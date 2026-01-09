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
import { TenantResolverService } from '../../common/tenant/tenant-resolver.service';

// Entidades de Módulos Associados
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { Evento } from '../evento/entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

// Repositórios tenant-aware
import { ComandaRepository } from './comanda.repository';
import { MesaRepository } from '../mesa/mesa.repository';
import { ClienteRepository } from '../cliente/cliente.repository';
import { PedidoRepository } from '../pedido/pedido.repository';
import { ItemPedidoRepository } from '../pedido/item-pedido.repository';
import { EventoRepository } from '../evento/evento.repository';
import { PaginaEventoRepository } from '../pagina-evento/pagina-evento.repository';
import { PontoEntregaRepository } from '../ponto-entrega/ponto-entrega.repository';
import { ComandaAgregadoRepository } from './comanda-agregado.repository';

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
    @Optional() private readonly tenantResolver?: TenantResolverService,
  ) {}

  /**
   * Obtém o tenantId do contexto atual para namespace de cache
   */
  private getTenantId(): string | null {
    // 1. Tentar do TenantContextService
    try {
      if (this.tenantContext?.hasTenant?.()) {
        return this.tenantContext.getTenantId();
      }
    } catch {
      // Ignorar
    }
    
    // 2. Tentar do request.tenant (definido pelo TenantInterceptor)
    if (this.request?.tenant?.id) {
      return this.request.tenant.id;
    }
    
    // 3. Tentar do user (JWT)
    const userTenantId = this.request?.user?.tenantId || this.request?.user?.empresaId;
    if (userTenantId) return userTenantId;
    
    // 4. Tentar do header X-Tenant-ID
    return this.request?.headers?.['x-tenant-id'] || null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   */
  private getCacheKey(params: string): string {
    const tenantId = this.getTenantId();
    return tenantId ? `comandas:${tenantId}:${params}` : `comandas:global:${params}`;
  }

  /**
   * Resolve o tenantId a partir do slug no header ou do contexto
   * ✅ ESSENCIAL para rotas públicas que precisam associar ao tenant correto
   */
  private async resolveAndGetTenantId(): Promise<string | null> {
    // 1. Se já tem tenantId do contexto/JWT, usar
    const tenantIdFromContext = this.getTenantId();
    if (tenantIdFromContext && this.isValidUUID(tenantIdFromContext)) {
      return tenantIdFromContext;
    }
    
    // 2. Se header x-tenant-id for um slug (não UUID), resolver para UUID
    const headerValue = this.request?.headers?.['x-tenant-id'];
    if (headerValue && !this.isValidUUID(headerValue) && this.tenantResolver) {
      try {
        const tenant = await this.tenantResolver.resolveBySlug(headerValue);
        this.logger.debug(`🔄 Slug "${headerValue}" resolvido para UUID: ${tenant.id}`);
        return tenant.id;
      } catch (error) {
        this.logger.warn(`⚠️ Não foi possível resolver tenant pelo slug "${headerValue}": ${error.message}`);
      }
    }
    
    return null;
  }
  
  /**
   * Valida se uma string é um UUID válido
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
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

    // ✅ USAR TRANSAÇÃO COM LOCK PESSIMISTA PARA EVITAR RACE CONDITION
    // Usar publicManager para permitir criação de comanda em rotas públicas (sem tenant)
    return await this.comandaRepository.publicManager
      .transaction(async (transactionalEntityManager) => {
        let mesa: Mesa | null = null;
        if (mesaId) {
          // Lock pessimista para evitar que duas requisições simultâneas ocupem a mesma mesa
          mesa = await transactionalEntityManager.findOne(Mesa, {
            where: { id: mesaId },
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
            { where: { id: paginaEventoId } },
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
              where: { id: pontoEntregaId },
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

        // ✅ RESOLVER TENANT ID DO SLUG ANTES DE CRIAR A COMANDA
        const resolvedTenantId = await this.resolveAndGetTenantId();
        this.logger.log(
          `🏢 Criando comanda com tenantId: ${resolvedTenantId || 'NULL'}`,
        );

        const comanda = transactionalEntityManager.create(Comanda, {
          mesa,
          cliente,
          pontoEntrega,
          paginaEvento,
          status: ComandaStatus.ABERTA,
          tenantId: resolvedTenantId, // ✅ GARANTIR TENANT ID NA COMANDA
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
            where: { id: eventoId },
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
            });

            const pedidoEntrada = transactionalEntityManager.create(Pedido, {
              comanda: novaComanda,
              itens: [itemEntrada],
              total: evento.valor,
              status: PedidoStatus.ENTREGUE,
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
        // Usar rawRepository para evitar erro de tenant em rotas públicas
        const comandaCompleta = await this.findOnePublic(novaComanda.id);
        
        // Invalidar cache após criar comanda (afeta comandas e mesas)
        await this.cacheInvalidationService.invalidateComandas();
        
        // Emite evento WebSocket para notificar nova comanda
        this.pedidosGateway.emitNovaComanda(comandaCompleta);
        
        return comandaCompleta;
      });
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResponse<Comanda>> {
    const { page = 1, limit = 20, sortBy = 'criadoEm', sortOrder = 'DESC' } = paginationDto || {};
    const cacheKey = this.getCacheKey(`page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`);

    // Tentar buscar do cache
    const cached = await this.cacheManager.get<PaginatedResponse<Comanda>>(cacheKey);
    if (cached) {
      this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

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

    // Armazenar no cache por 5 minutos (comandas mudam frequentemente)
    await this.cacheManager.set(cacheKey, response, 300000);

    return response;
  }

  async search(term: string): Promise<Comanda[]> {
    this.logger.log(`🔍 Buscando comandas abertas ${term ? `com termo: "${term}"` : 'sem filtro'}`);
    
    const queryBuilder = this.comandaRepository.createQueryBuilder('comanda');
    queryBuilder
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'ambiente')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.pontoEntrega', 'pontoEntrega')
      .leftJoinAndSelect('comanda.pedidos', 'pedidos')
      .leftJoinAndSelect('pedidos.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .andWhere('comanda.status = :status', { status: ComandaStatus.ABERTA }); // ✅ andWhere para NÃO sobrescrever filtro de tenant
    
    // Nota: O filtro de tenant já é aplicado automaticamente pelo createQueryBuilder do BaseTenantRepository

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

  /**
   * Busca comanda por ID SEM filtro de tenant (para rotas públicas)
   * Usado após criar comanda em rotas públicas para recarregar com relações
   */
  async findOnePublic(id: string): Promise<Comanda> {
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
      comanda = await this.comandaRepository.findOne({
        where: {
          cliente: { cpf: cpfNumeros },
          status: ComandaStatus.ABERTA,
        },
        relations: ['cliente', 'mesa', 'pontoEntrega'],
        order: { dataAbertura: 'DESC' },
      });
    } else if (isUuid) {
      // Busca por ID da comanda (UUID)
      comanda = await this.comandaRepository.findOne({
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

  async findPublicOne(id: string) {
    // Usar findOnePublic para evitar erro de tenant em rotas públicas
    const comanda = await this.findOnePublic(id);

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

  async fecharComanda(id: string, dto: FecharComandaDto, funcionarioId: string): Promise<Comanda> {
    this.logger.log(
      `🔒 Iniciando fechamento da comanda ${id} - Forma: ${dto.formaPagamento} - Operador: ${funcionarioId}`,
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

    // ✅ Validar e registrar venda no caixa DO OPERADOR ATUAL
    try {
      // Buscar caixa aberto pelo funcionário atual (cada operador só pode usar seu próprio caixa)
      const caixaAberto = await this.caixaService.getCaixaAbertoAtual(funcionarioId);

      if (!caixaAberto) {
        throw new BadRequestException(
          'Você precisa abrir um caixa antes de processar pagamentos. Acesse "Gestão de Caixas" para abrir seu caixa.',
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
    // Usar findOnePublic para rotas públicas (sem filtro de tenant)
    const comanda = await this.findOnePublic(comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException(
        'Apenas comandas abertas podem ter o local alterado.',
      );
    }

    // Se for mesa - usar rawRepository para evitar filtro de tenant
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
    // Se for ponto de entrega - usar rawRepository para evitar filtro de tenant
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

    // Usar rawRepository para salvar sem filtro de tenant
    const comandaAtualizada = await this.comandaRepository.rawRepository.save(comanda);
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);

    return comandaAtualizada;
  }

  async updatePontoEntrega(
    comandaId: string,
    dto: UpdatePontoEntregaComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.findOne(comandaId);

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

    const novoPonto = await this.pontoEntregaRepository.findOne({
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

    const comandaAtualizada = await this.comandaRepository.save(comanda);

    this.logger.log(
      `🔄 Ponto de entrega alterado: Comanda ${comandaId} → ${novoPonto.nome}`,
    );

    // Emite evento WebSocket para notificar mudança de local
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);
    this.logger.log(
      `📡 Evento 'comanda_atualizada' emitido para comanda ${comandaId}`,
    );

    return this.findOne(comandaId);
  }
}
