// Caminho: backend/src/modulos/comanda/comanda.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  Optional,
  Scope,
} from '@nestjs/common';
import { Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

// Entidades de Módulos Associados
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { Evento } from '../evento/entities/evento.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

// Repositórios tenant-aware
import { ComandaRepository } from './comanda.repository';
import { ComandaAgregadoRepository } from './comanda-agregado.repository';
import { MesaRepository } from '../mesa/mesa.repository';
import { ClienteRepository } from '../cliente/cliente.repository';
import { PedidoRepository } from '../pedido/pedido.repository';
import { ItemPedidoRepository } from '../pedido/item-pedido.repository';
import { PaginaEventoRepository } from '../pagina-evento/pagina-evento.repository';
import { EventoRepository } from '../evento/evento.repository';
import { PontoEntregaRepository } from '../ponto-entrega/ponto-entrega.repository';

// Entidades e DTOs Locais
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdatePontoEntregaComandaDto } from './dto/update-ponto-entrega.dto';
import { FecharComandaDto } from './dto/fechar-comanda.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

// Gateways
import { PedidosGateway } from '../pedido/pedidos.gateway';

// Serviços
import { CaixaService } from '../caixa/caixa.service';

import Decimal from 'decimal.js';

@Injectable({ scope: Scope.REQUEST })
export class ComandaService {
  private readonly logger = new Logger(ComandaService.name);

  constructor(
    private readonly comandaRepository: ComandaRepository,
    private readonly mesaRepository: MesaRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly paginaEventoRepository: PaginaEventoRepository,
    private readonly eventoRepository: EventoRepository,
    private readonly pedidoRepository: PedidoRepository,
    private readonly itemPedidoRepository: ItemPedidoRepository,
    private readonly pontoEntregaRepository: PontoEntregaRepository,
    private readonly comandaAgregadoRepository: ComandaAgregadoRepository,
    private readonly pedidosGateway: PedidosGateway,
    private readonly caixaService: CaixaService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly cacheInvalidationService: CacheInvalidationService,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
  ) {}

  /**
   * Obtém o tenantId do contexto atual para namespace de cache
   */
  private getTenantId(): string | null {
    try {
      if (this.tenantContext?.hasTenant?.()) {
        return this.tenantContext.getTenantId();
      }
    } catch {
      // Ignorar
    }
    const userTenantId = this.request?.user?.tenantId;
    if (userTenantId) return userTenantId;
    // Usar o tenant já resolvido pelo TenantInterceptor (UUID garantido)
    // NUNCA usar headers['x-tenant-id'] diretamente — pode conter slug em vez de UUID
    if (this.request?.tenant?.id) return this.request.tenant.id;
    return null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   */
  private getCacheKey(params: string): string | null {
    const tenantId = this.getTenantId();
    if (!tenantId) return null;
    return `comandas:${tenantId}:${params}`;
  }

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const {
      mesaId,
      pontoEntregaId,
      clienteId,
      paginaEventoId,
      eventoId,
      agregados,
    } = createComandaDto;

    // Validação: Mesa XOR Ponto de Entrega (não pode ter ambos)
    if (mesaId && pontoEntregaId) {
      throw new BadRequestException(
        'A comanda não pode ter mesa E ponto de entrega ao mesmo tempo.',
      );
    }

    // Validação: Se não tiver mesa, precisa ter cliente (balcão/delivery/ponto)
    if (!mesaId && !clienteId) {
      throw new BadRequestException(
        'Comandas sem mesa precisam estar associadas a um cliente.',
      );
    }

    // Obter tenantId do contexto ANTES da transação (imutável durante a request)
    let tenantId = this.getTenantId();

    // Fallback para rotas públicas: resolver tenantId a partir da paginaEvento
    // O TenantInterceptor pode não resolver o slug quando a request vem de domínio externo
    if (!tenantId && paginaEventoId) {
      const paginaRaw = await this.paginaEventoRepository.rawRepository.findOne({
        where: { id: paginaEventoId },
        select: ['tenantId'],
      });
      if (paginaRaw?.tenantId) {
        tenantId = paginaRaw.tenantId;
        this.logger.debug(`🏢 tenantId resolvido via paginaEvento: ${tenantId}`);
      }
    }

    // Fallback secundário: resolver tenantId via eventoId (quando evento não tem paginaEvento)
    if (!tenantId && eventoId) {
      const eventoRaw = await this.eventoRepository.rawRepository.findOne({
        where: { id: eventoId },
        select: ['tenantId'],
      });
      if (eventoRaw?.tenantId) {
        tenantId = eventoRaw.tenantId;
        this.logger.debug(`🏢 tenantId resolvido via evento: ${tenantId}`);
      }
    }

    if (!tenantId) {
      throw new BadRequestException('Tenant não identificado. Impossível criar comanda.');
    }

    // Sincronizar tenant resolvido via fallback com request.tenant
    // Garante que BaseTenantRepository.getTenantId() funcione em findOne() após a transação
    if (this.request && !this.request.tenant?.id) {
      this.request.tenant = { id: tenantId };
    }

    // ✅ USAR TRANSAÇÃO COM LOCK PESSIMISTA PARA EVITAR RACE CONDITION
    // IMPORTANTE: Todas as queries dentro da transação DEVEM filtrar por tenantId
    // pois transactionalEntityManager bypassa BaseTenantRepository
    return await this.comandaRepository.manager
      .transaction(async (transactionalEntityManager) => {
        let mesa: Mesa | null = null;
        if (mesaId) {
          mesa = await transactionalEntityManager.findOne(Mesa, {
            where: { id: mesaId, tenantId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!mesa)
            throw new NotFoundException(
              `Mesa com ID "${mesaId}" não encontrada.`,
            );
          if (!clienteId && mesa.status !== MesaStatus.LIVRE) {
            throw new BadRequestException(
              `A Mesa ${mesa.numero} já está ocupada.`,
            );
          }
        }

        let cliente: Cliente | null = null;
        if (clienteId) {
          // Busca sem filtro de tenant: clientes criados via rota pública têm tenantId = null
          cliente = await transactionalEntityManager.findOne(Cliente, {
            where: { id: clienteId },
          });
          if (!cliente)
            throw new NotFoundException(
              `Cliente com ID "${clienteId}" não encontrado.`,
            );

          // ✅ REGRA DE NEGÓCIO: UMA COMANDA ABERTA POR CLIENTE (BLOQUEIO TOTAL)
          const comandaAbertaExistente =
            await transactionalEntityManager.findOne(Comanda, {
              where: {
                cliente: { id: clienteId },
                status: ComandaStatus.ABERTA,
                tenantId,
              },
            });

          if (comandaAbertaExistente) {
            this.logger.warn(
              `BLOQUEIO: Cliente ${clienteId} tentou criar nova comanda, mas já possui comanda aberta: ${comandaAbertaExistente.id}.`,
            );
            throw new BadRequestException(
              `O Cliente "${cliente.nome}" já possui uma comanda aberta (ID: ${comandaAbertaExistente.id}). Por favor, feche a comanda anterior.`,
            );
          }
        }

        let paginaEvento: PaginaEvento | null = null;
        if (paginaEventoId) {
          paginaEvento = await transactionalEntityManager.findOne(
            PaginaEvento,
            { where: { id: paginaEventoId, tenantId } },
          );
          if (!paginaEvento) {
            this.logger.warn(
              `Página de Evento com ID "${paginaEventoId}" não encontrada.`,
            );
          }
        }

        // Validar Ponto de Entrega
        let pontoEntrega: PontoEntrega | null = null;
        if (pontoEntregaId) {
          pontoEntrega = await transactionalEntityManager.findOne(
            PontoEntrega,
            {
              where: { id: pontoEntregaId, tenantId },
            },
          );
          if (!pontoEntrega) {
            throw new NotFoundException(
              `Ponto de entrega com ID "${pontoEntregaId}" não encontrado.`,
            );
          }
          if (!pontoEntrega.ativo) {
            throw new BadRequestException(
              `O ponto de entrega "${pontoEntrega.nome}" está desativado.`,
            );
          }
          this.logger.log(
            `📍 Comanda será criada no ponto: ${pontoEntrega.nome}`,
          );
        }

        const comanda = transactionalEntityManager.create(Comanda, {
          mesa,
          cliente,
          pontoEntrega,
          paginaEvento,
          status: ComandaStatus.ABERTA,
          tenantId,
        });

        const novaComanda = await transactionalEntityManager.save(comanda);

        // Criar agregados se fornecidos
        if (agregados && agregados.length > 0) {
          const agregadosEntities = agregados.map((agr, index) =>
            transactionalEntityManager.create(ComandaAgregado, {
              comandaId: novaComanda.id,
              nome: agr.nome,
              cpf: agr.cpf,
              ordem: index + 1,
              tenantId,
            }),
          );
          await transactionalEntityManager.save(agregadosEntities);
          this.logger.log(
            `✅ ${agregados.length} agregado(s) adicionado(s) à comanda ${novaComanda.id}`,
          );
        }

        // ✅ LÓGICA PARA ADICIONAR O VALOR DE ENTRADA DO EVENTO (COVER ARTÍSTICO)
        if (eventoId) {
          const evento = await transactionalEntityManager.findOne(Evento, {
            where: { id: eventoId, tenantId },
          });
          if (evento && evento.valor > 0) {
            this.logger.log(
              `Adicionando entrada de R$ ${evento.valor} do evento "${evento.titulo}" à comanda ${novaComanda.id}`,
            );

            const itemEntrada = transactionalEntityManager.create(ItemPedido, {
              produto: null,
              quantidade: 1,
              precoUnitario: evento.valor,
              observacao: `Couvert Artístico - ${evento.titulo}`,
              status: PedidoStatus.ENTREGUE,
              tenantId,
            });

            const pedidoEntrada = transactionalEntityManager.create(Pedido, {
              comanda: novaComanda,
              itens: [itemEntrada],
              total: evento.valor,
              status: PedidoStatus.ENTREGUE,
              tenantId,
            });

            await transactionalEntityManager.save(itemEntrada);
            await transactionalEntityManager.save(pedidoEntrada);
          }
        }

        if (mesa) {
          mesa.status = MesaStatus.OCUPADA;
          await transactionalEntityManager.save(mesa);
        }

        return novaComanda;
      })
      .then(async (novaComanda) => {
        // Recarregamos a comanda para garantir que ela retorne com o novo pedido de entrada incluído
        const comandaCompleta = await this.findOne(novaComanda.id);
        
        // Invalidar cache após criar comanda (afeta comandas e mesas)
        await this.cacheInvalidationService.invalidateComandas();
        
        // Emite evento WebSocket para notificar nova comanda
        this.pedidosGateway.emitNovaComanda(comandaCompleta);
        
        return comandaCompleta;
      });
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResponse<Comanda>> {
    const { page = 1, limit = 20, sortBy = 'dataAbertura', sortOrder = 'DESC' } = paginationDto || {};
    const cacheKey = this.getCacheKey(`page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`);

    // Tentar buscar do cache (apenas se tenant disponível)
    if (cacheKey) {
      const cached = await this.cacheManager.get<PaginatedResponse<Comanda>>(cacheKey);
      if (cached) {
        this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`❌ Cache MISS: ${cacheKey}`);
    }

    // Buscar do banco com paginação
    const [data, total] = await this.comandaRepository.findAndCount({
      relations: ['mesa', 'cliente', 'paginaEvento'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Comanda> = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Armazenar no cache por 5 minutos (apenas se tenant disponível)
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, response, 300000);
      CacheInvalidationService.trackKey(cacheKey);
    }

    return response;
  }

  async search(term: string): Promise<Comanda[]> {
    const queryBuilder = this.comandaRepository.createQueryBuilder('comanda');
    queryBuilder
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'ambiente')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.pontoEntrega', 'pontoEntrega')
      .leftJoinAndSelect('comanda.pedidos', 'pedidos')
      .leftJoinAndSelect('pedidos.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .where('comanda.status = :status', { status: ComandaStatus.ABERTA });

    if (term) {
      const searchTerm = term.trim();
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // Busca por nome do cliente (parcial, case-insensitive)
          qb.where('LOWER(cliente.nome) LIKE LOWER(:nomeTerm)', {
            nomeTerm: `%${searchTerm}%`,
          });

          // Busca por CPF (parcial ou completo, apenas números)
          const cpfNumeros = searchTerm.replace(/\D/g, ''); // Remove tudo que não é número
          if (cpfNumeros) {
            qb.orWhere('cliente.cpf LIKE :cpfTerm', {
              cpfTerm: `%${cpfNumeros}%`,
            });
          }

          // Busca por número de mesa (apenas se for um número pequeno, não um CPF)
          // CPF tem 11 dígitos, então só considera número de mesa se tiver menos de 5 dígitos
          const numeroMesa = parseInt(searchTerm, 10);
          if (!isNaN(numeroMesa) && searchTerm.length < 5) {
            qb.orWhere('mesa.numero = :numero', { numero: numeroMesa });
          }
        }),
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: [
        'mesa',
        'cliente',
        'paginaEvento',
        'pontoEntrega',
        'pontoEntrega.mesaProxima',
        'pontoEntrega.ambientePreparo',
        'agregados',
        'pedidos',
        'pedidos.itens',
        'pedidos.itens.produto',
        'pedidos.itens.ambienteRetirada', // Carrega ambiente onde item foi deixado
      ],
      order: {
        agregados: {
          ordem: 'ASC',
        },
        pedidos: {
          data: 'ASC',
        },
      },
    });

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    let totalComandaCalculado = new Decimal(0);
    if (comanda.pedidos) {
      comanda.pedidos.forEach((pedido) => {
        const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
          // Itens de entrada (sem produto) também devem ser somados
          if (item.status !== PedidoStatus.CANCELADO) {
            const itemTotal = new Decimal(item.precoUnitario).times(
              new Decimal(item.quantidade),
            );
            return sum.plus(itemTotal);
          }
          return sum;
        }, new Decimal(0));

        pedido.total = totalPedidoCalculado.toNumber();
        totalComandaCalculado =
          totalComandaCalculado.plus(totalPedidoCalculado);
      });
    }
    (comanda as any).total = totalComandaCalculado.toNumber();

    return comanda;
  }

  async findAbertaByMesaId(mesaId: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { mesa: { id: mesaId }, status: ComandaStatus.ABERTA },
    });
    if (!comanda) {
      throw new NotFoundException(
        `Nenhuma comanda aberta encontrada para a mesa com ID "${mesaId}".`,
      );
    }
    return this.findOne(comanda.id);
  }

  // Método público para clientes recuperarem comanda por ID ou CPF
  async recuperarComandaPublica(termo: string) {
    if (!termo || termo.trim().length === 0) {
      throw new NotFoundException('Termo de busca não informado');
    }

    const searchTerm = termo.trim();
    
    // Verifica se é um CPF (apenas números, 11 dígitos)
    const cpfNumeros = searchTerm.replace(/\D/g, '');
    const isCpf = cpfNumeros.length === 11;
    
    // Verifica se é um UUID (formato de ID da comanda)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(searchTerm);

    let comanda: Comanda | null = null;

    if (isCpf) {
      // Busca por CPF - retorna a comanda ABERTA mais recente
      comanda = await this.comandaRepository.rawRepository.findOne({
        where: {
          cliente: { cpf: cpfNumeros },
          status: ComandaStatus.ABERTA,
        },
        relations: ['cliente', 'mesa', 'pontoEntrega'],
        order: { dataAbertura: 'DESC' },
      });
    } else if (isUuid) {
      // Busca por ID da comanda (UUID)
      comanda = await this.comandaRepository.rawRepository.findOne({
        where: {
          id: searchTerm,
          status: ComandaStatus.ABERTA,
        },
        relations: ['cliente', 'mesa', 'pontoEntrega'],
      });
    } else {
      throw new NotFoundException(
        'Formato inválido. Use o CPF (11 dígitos) ou o ID da comanda.',
      );
    }

    if (!comanda) {
      throw new NotFoundException(
        isCpf
          ? 'Nenhuma comanda aberta encontrada para este CPF'
          : 'Comanda não encontrada ou já foi fechada.',
      );
    }

    // Retorna dados básicos para o cliente
    return {
      id: comanda.id,
      status: comanda.status,
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      mesa: comanda.mesa
        ? { id: comanda.mesa.id, numero: comanda.mesa.numero }
        : null,
      pontoEntrega: comanda.pontoEntrega
        ? { id: comanda.pontoEntrega.id, nome: comanda.pontoEntrega.nome }
        : null,
    };
  }

  async findAgregadosPublic(id: string) {
    const comanda = await this.comandaRepository.rawRepository.findOne({
      where: { id },
      relations: ['agregados'],
    });
    if (!comanda) throw new NotFoundException(`Comanda "${id}" não encontrada.`);
    return comanda.agregados || [];
  }

  async findPublicOne(id: string) {
    const comanda = await this.comandaRepository.rawRepository.findOne({
      where: { id },
      relations: [
        'mesa',
        'cliente',
        'paginaEvento',
        'pontoEntrega',
        'pontoEntrega.mesaProxima',
        'pontoEntrega.ambientePreparo',
        'agregados',
        'pedidos',
        'pedidos.itens',
        'pedidos.itens.produto',
        'pedidos.itens.ambienteRetirada',
      ],
      order: { agregados: { ordem: 'ASC' } },
    });
    if (!comanda) throw new NotFoundException(`Comanda "${id}" não encontrada.`);

    // Simplificamos o retorno dos itens para o frontend não se confundir
    const pedidosSimplificados = comanda.pedidos.map((p) => ({
      ...p,
      itens: p.itens.map((i) => ({
        ...i,
        produto: i.produto ? { nome: i.produto.nome } : null, // Envia só o nome do produto
        ambienteRetirada: i.ambienteRetirada
          ? {
              id: i.ambienteRetirada.id,
              nome: i.ambienteRetirada.nome,
            }
          : null, // Inclui ambiente de retirada quando item foi deixado no ambiente
      })),
    }));

    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa
        ? { id: comanda.mesa.id, numero: comanda.mesa.numero }
        : null,
      pontoEntrega: comanda.pontoEntrega
        ? {
            id: comanda.pontoEntrega.id,
            nome: comanda.pontoEntrega.nome,
            descricao: comanda.pontoEntrega.descricao,
          }
        : null,
      agregados: comanda.agregados || [],
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      pedidos: pedidosSimplificados, // Usa a versão simplificada
      totalComanda: (comanda as any).total,
      paginaEvento: comanda.paginaEvento,
    };
  }

  async fecharComanda(id: string, dto: FecharComandaDto, funcionarioId?: string): Promise<Comanda> {
    this.logger.log(
      `🔒 Iniciando fechamento da comanda ${id} - Forma: ${dto.formaPagamento}`,
    );

    // Buscar comanda com todas as relações necessárias
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: [
        'mesa',
        'cliente',
        'pedidos',
        'pedidos.itens',
        'pedidos.itens.produto',
      ],
    });

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException(
        'Apenas comandas com status ABERTA podem ser fechadas.',
      );
    }

    // Calcular total da comanda
    const total = comanda.pedidos.reduce((totalComanda, pedido) => {
      const totalPedido = pedido.itens.reduce((sum, item) => {
        const valorItem = new Decimal(item.precoUnitario).times(
          item.quantidade,
        );
        return sum.plus(valorItem);
      }, new Decimal(0));
      return totalComanda.plus(totalPedido);
    }, new Decimal(0));

    const totalNumber = total.toNumber();

    this.logger.log(`💰 Total da comanda: R$ ${totalNumber.toFixed(2)}`);

    // ✅ NOVO: Validar e registrar venda no caixa
    try {
      // Buscar caixa aberto (pode estar vinculado ao funcionário que abriu a comanda ou ao atual)
      // Por simplicidade, vamos buscar qualquer caixa aberto no momento
      const caixaAberto = await this.caixaService.getCaixaAbertoAtual(funcionarioId);

      if (!caixaAberto) {
        throw new BadRequestException(
          'Não há caixa aberto no momento. Por favor, abra o caixa antes de fechar comandas.',
        );
      }

      // Validar valor pago se for DINHEIRO
      if (dto.formaPagamento === 'DINHEIRO') {
        if (!dto.valorPago) {
          throw new BadRequestException(
            'Valor pago é obrigatório quando a forma de pagamento é DINHEIRO.',
          );
        }
        if (dto.valorPago < totalNumber) {
          throw new BadRequestException(
            `Valor pago (R$ ${dto.valorPago.toFixed(2)}) é menor que o total da comanda (R$ ${totalNumber.toFixed(2)}).`,
          );
        }
      }

      // Registrar venda no caixa
      await this.caixaService.registrarVenda({
        aberturaCaixaId: caixaAberto.id,
        comandaId: comanda.id,
        comandaNumero: comanda.id, // Usando ID como identificador único
        valor: totalNumber,
        formaPagamento: dto.formaPagamento,
        descricao: dto.observacao,
      });

      this.logger.log(
        `✅ Venda registrada no caixa ${caixaAberto.id} - Valor: R$ ${totalNumber.toFixed(2)}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao registrar venda no caixa: ${error.message}`,
      );

      // Se for erro de validação (BadRequestException), propagar
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Outros erros
      throw new BadRequestException(
        `Erro ao registrar venda no caixa: ${error.message}. Por favor, tente novamente.`,
      );
    }

    // Fechar comanda
    comanda.status = ComandaStatus.FECHADA;

    // Liberar mesa se houver
    if (comanda.mesa) {
      comanda.mesa.status = MesaStatus.LIVRE;
      await this.mesaRepository.save(comanda.mesa);
      this.logger.log(`🪑 Mesa ${comanda.mesa.numero} liberada`);
    }

    const comandaFechada = await this.comandaRepository.save(comanda);
    
    // Invalidar cache após fechar comanda (afeta comandas e mesas)
    await this.cacheInvalidationService.invalidateComandas();
    
    this.pedidosGateway.emitComandaAtualizada(comandaFechada);

    this.logger.log(`✅ Comanda ${id} fechada com sucesso`);

    return comandaFechada;
  }

  async update(id: string, updateComandaDto: any): Promise<Comanda> {
    const comanda = await this.comandaRepository.preload({
      id,
      ...updateComandaDto,
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    const comandaAtualizada = await this.comandaRepository.save(comanda);
    
    // Invalidar cache após atualizar comanda
    await this.cacheInvalidationService.invalidateComandas();
    
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);
    return comandaAtualizada;
  }

  async remove(id: string): Promise<void> {
    const comanda = await this.findOne(id);
    await this.comandaRepository.remove(comanda);
  }

  async updateLocal(
    comandaId: string,
    dto: { mesaId?: string | null; pontoEntregaId?: string | null },
  ): Promise<Comanda> {
    const comanda = await this.comandaRepository.rawRepository.findOne({
      where: { id: comandaId },
      relations: ['mesa', 'pontoEntrega'],
    });
    if (!comanda) throw new NotFoundException(`Comanda "${comandaId}" não encontrada.`);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException(
        'Apenas comandas abertas podem ter o local alterado.',
      );
    }

    // Se for mesa
    if (dto.mesaId) {
      const mesa = await this.mesaRepository.rawRepository.findOne({
        where: { id: dto.mesaId },
      });
      if (!mesa) {
        throw new NotFoundException(
          `Mesa com ID "${dto.mesaId}" não encontrada.`,
        );
      }
      comanda.mesa = mesa;
      comanda.pontoEntrega = null;
      comanda.pontoEntregaId = null;
      this.logger.log(
        `🔄 Comanda ${comandaId} vinculada à Mesa ${mesa.numero}`,
      );
    }
    // Se for ponto de entrega
    else if (dto.pontoEntregaId) {
      const ponto = await this.pontoEntregaRepository.rawRepository.findOne({
        where: { id: dto.pontoEntregaId },
      });
      if (!ponto) {
        throw new NotFoundException(
          `Ponto de entrega com ID "${dto.pontoEntregaId}" não encontrado.`,
        );
      }
      if (!ponto.ativo) {
        throw new BadRequestException(
          `O ponto de entrega "${ponto.nome}" está desativado.`,
        );
      }
      comanda.pontoEntrega = ponto;
      comanda.pontoEntregaId = dto.pontoEntregaId;
      comanda.mesa = null;
      this.logger.log(
        `🔄 Comanda ${comandaId} vinculada ao Ponto ${ponto.nome}`,
      );
    }
    // Se for remover ambos
    else {
      comanda.mesa = null;
      comanda.pontoEntrega = null;
      comanda.pontoEntregaId = null;
      this.logger.log(`🔄 Comanda ${comandaId} sem local definido`);
    }

    const comandaAtualizada = await this.comandaRepository.rawRepository.save(comanda);
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);

    return comandaAtualizada;
  }

  async updatePontoEntrega(
    comandaId: string,
    dto: UpdatePontoEntregaComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.comandaRepository.rawRepository.findOne({
      where: { id: comandaId },
      relations: ['pontoEntrega'],
    });
    if (!comanda) throw new NotFoundException(`Comanda "${comandaId}" não encontrada.`);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException(
        'Apenas comandas abertas podem ter o ponto de entrega alterado.',
      );
    }

    // Verifica se tem pedidos EM_PREPARO
    const pedidosEmPreparo = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoin('pedido.itens', 'item')
      .where('pedido.comanda.id = :comandaId', { comandaId })
      .andWhere('item.status = :status', { status: PedidoStatus.EM_PREPARO })
      .getCount();

    if (pedidosEmPreparo > 0) {
      this.logger.warn(
        `⚠️ Cliente mudou ponto de entrega com ${pedidosEmPreparo} pedido(s) em preparo - Comanda ${comandaId}`,
      );
      // Não bloqueia, apenas alerta
    }

    const novoPonto = await this.pontoEntregaRepository.rawRepository.findOne({
      where: { id: dto.pontoEntregaId },
    });

    if (!novoPonto) {
      throw new NotFoundException(
        `Ponto de entrega com ID "${dto.pontoEntregaId}" não encontrado.`,
      );
    }

    if (!novoPonto.ativo) {
      throw new BadRequestException(
        `O ponto de entrega "${novoPonto.nome}" está desativado.`,
      );
    }

    comanda.pontoEntrega = novoPonto;
    comanda.pontoEntregaId = dto.pontoEntregaId;

    const comandaAtualizada = await this.comandaRepository.rawRepository.save(comanda);

    this.logger.log(
      `🔄 Ponto de entrega alterado: Comanda ${comandaId} → ${novoPonto.nome}`,
    );

    // Emite evento WebSocket para notificar mudança de local
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);
    this.logger.log(
      `📡 Evento 'comanda_atualizada' emitido para comanda ${comandaId}`,
    );

    return this.comandaRepository.rawRepository.findOne({
      where: { id: comandaId },
      relations: ['pontoEntrega', 'mesa', 'cliente', 'pedidos', 'pedidos.itens'],
    });
  }
}
