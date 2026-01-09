import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  Optional,
  Scope,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { Pedido } from './entities/pedido.entity';
import { ComandaStatus } from '../comanda/entities/comanda.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { CreatePedidoGarcomDto } from './dto/create-pedido-garcom.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ItemPedido } from './entities/item-pedido.entity';
import { UpdateItemPedidoStatusDto } from './dto/update-item-pedido-status.dto';
import { DeixarNoAmbienteDto } from './dto/deixar-no-ambiente.dto';
import { MarcarEntregueDto } from './dto/marcar-entregue.dto';
import { RetirarItemDto } from './dto/retirar-item.dto';
import { PedidoStatus } from './enums/pedido-status.enum';
import { PedidosGateway } from './pedidos.gateway';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import Decimal from 'decimal.js';
import { PedidoRepository } from './pedido.repository';
import { ItemPedidoRepository } from './item-pedido.repository';
import { RetiradaItemRepository } from './retirada-item.repository';
import { ComandaRepository } from '../comanda/comanda.repository';
import { ProdutoRepository } from '../produto/produto.repository';
import { AmbienteRepository } from '../ambiente/ambiente.repository';
import { FuncionarioRepository } from '../funcionario/funcionario.repository';
import { TurnoRepository } from '../turno/turno.repository';

@Injectable({ scope: Scope.REQUEST })
export class PedidoService {
  private readonly logger = new Logger(PedidoService.name);

  // Construtor refatorado para usar repositórios tenant-aware
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly itemPedidoRepository: ItemPedidoRepository,
    private readonly retiradaItemRepository: RetiradaItemRepository,
    private readonly comandaRepository: ComandaRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly ambienteRepository: AmbienteRepository,
    private readonly funcionarioRepository: FuncionarioRepository,
    private readonly turnoRepository: TurnoRepository,
    private readonly pedidosGateway: PedidosGateway,
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
    const userTenantId = this.request?.user?.tenantId || this.request?.user?.empresaId;
    if (userTenantId) return userTenantId;
    return this.request?.headers?.['x-tenant-id'] || null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   */
  private getCacheKey(params: string): string {
    const tenantId = this.getTenantId();
    return tenantId ? `pedidos:${tenantId}:${params}` : `pedidos:global:${params}`;
  }

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { comandaId, itens } = createPedidoDto;

    this.logger.log(
      `📝 Criando novo pedido | Comanda: ${comandaId} | ${itens.length} itens`,
    );

    // Usar rawRepository para rotas públicas (sem tenant)
    const tenantId = this.getTenantId();
    const comanda = tenantId 
      ? await this.comandaRepository.findOne({ where: { id: comandaId } })
      : await this.comandaRepository.rawRepository.findOne({ 
          where: { id: comandaId },
          relations: ['mesa', 'cliente', 'paginaEvento'],
          select: {
            id: true,
            status: true,
            tenantId: true, // ✅ IMPORTANTE: Carregar tenantId explicitamente!
            mesa: { id: true, numero: true },
            cliente: { id: true, nome: true },
            paginaEvento: { id: true },
          },
        });
    
    // ✅ DEBUG: Log para verificar se tenantId foi carregado
    this.logger.debug(`📋 Comanda carregada | id: ${comanda?.id} | tenantId: ${comanda?.tenantId || 'NULL'}`);
    
    if (!comanda) {
      this.logger.warn(
        `⚠️ Tentativa de criar pedido para comanda inexistente: ${comandaId}`,
      );
      throw new NotFoundException(
        `Comanda com ID "${comandaId}" não encontrada.`,
      );
    }
    if (!itens || itens.length === 0) {
      this.logger.warn(
        `⚠️ Tentativa de criar pedido sem itens | Comanda: ${comandaId}`,
      );
      throw new BadRequestException('Um pedido não pode ser criado sem itens.');
    }

    // ✅ OTIMIZAÇÃO: Buscar todos os produtos de uma vez (resolve N+1 query)
    const produtoIds = itens.map(item => item.produtoId);
    const produtos = tenantId
      ? await this.produtoRepository.findByIds(produtoIds)
      : await this.produtoRepository.rawRepository.findByIds(produtoIds);
    
    // Criar mapa para lookup O(1)
    const produtoMap = new Map(produtos.map(p => [p.id, p]));
    
    // Validar e criar itens
    // Para rotas públicas (sem tenant), usar rawRepository.create() para evitar erro de tenant
    const itensPedido = itens.map(itemDto => {
      const produto = produtoMap.get(itemDto.produtoId);
      if (!produto) {
        this.logger.warn(
          `⚠️ Tentativa de criar item de pedido para produto inexistente: ${itemDto.produtoId}`,
        );
        throw new NotFoundException(
          `Produto com ID "${itemDto.produtoId}" não encontrado.`,
        );
      }
      
      const itemData = {
        produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
        observacao: itemDto.observacao,
        status: PedidoStatus.FEITO,
        tenantId: comanda.tenantId, // Herdar tenant da comanda
      };
      
      return tenantId
        ? this.itemPedidoRepository.create(itemData)
        : this.itemPedidoRepository.rawRepository.create(itemData);
    });

    // Usar Decimal.js para cálculos monetários precisos
    const total = itensPedido.reduce((sum, item) => {
      const itemTotal = new Decimal(item.quantidade).times(
        new Decimal(item.precoUnitario),
      );
      return sum.plus(itemTotal);
    }, new Decimal(0));

    // Criar pedido - para rotas públicas, usar rawRepository e herdar tenant da comanda
    const pedidoData = {
      comanda,
      itens: itensPedido,
      total: total.toNumber(),
      status: PedidoStatus.FEITO,
      tenantId: comanda.tenantId, // Herdar tenant da comanda
    };
    
    const pedido = tenantId
      ? this.pedidoRepository.create(pedidoData)
      : this.pedidoRepository.rawRepository.create(pedidoData);

    // Para rotas públicas, usar rawRepository.save() também
    const novoPedido = tenantId
      ? await this.pedidoRepository.save(pedido)
      : await this.pedidoRepository.rawRepository.save(pedido);
    
    // Usar método público ou privado dependendo se há tenant
    const pedidoCompleto = tenantId 
      ? await this.findOne(novoPedido.id)
      : await this.findOnePublic(novoPedido.id);

    this.logger.log(
      `✅ Pedido criado com sucesso | ID: ${pedidoCompleto.id} | Total: R$ ${total.toFixed(2)} | Itens: ${itensPedido.length}`,
    );

    // Invalidar cache após criar pedido
    await this.cacheInvalidationService.invalidatePedidos();

    this.pedidosGateway.emitNovoPedido(pedidoCompleto);

    return pedidoCompleto;
  }

  /**
   * Busca um pedido por ID usando rawRepository (para rotas públicas)
   * ✅ CORREÇÃO: Inclui select explícito para tenantId para WebSocket funcionar
   */
  private async findOnePublic(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.rawRepository.findOne({
      where: { id },
      relations: [
        'comanda',
        'comanda.mesa',
        'comanda.cliente',
        'comanda.pontoEntrega',
        'itens',
        'itens.produto',
        'itens.produto.ambiente',
      ],
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    
    // ✅ CORREÇÃO: Se tenantId não veio, herda da comanda
    if (!pedido.tenantId && pedido.comanda?.tenantId) {
      pedido.tenantId = pedido.comanda.tenantId;
      this.logger.debug(`📋 TenantId herdado da comanda: ${pedido.tenantId}`);
    }
    
    return pedido;
  }

  // ✅ NOVO: Criar pedido pelo garçom (com criação automática de comanda)
  async createPedidoGarcom(dto: CreatePedidoGarcomDto): Promise<Pedido> {
    const { clienteId, garcomId, mesaId, itens, observacao } = dto;

    this.logger.log(
      `👨‍🍳 Garçom criando pedido | Garçom: ${garcomId} | Cliente: ${clienteId} | ${itens.length} itens`,
    );

    // Busca ou cria comanda para o cliente
    let comanda = await this.comandaRepository.findOne({
      where: {
        cliente: { id: clienteId },
        status: ComandaStatus.ABERTA,
      },
      relations: ['cliente', 'mesa'],
    });

    // Se não existe comanda aberta, cria uma nova
    if (!comanda) {
      this.logger.log(`📋 Criando nova comanda para cliente ${clienteId}`);

      const novaComanda = this.comandaRepository.create({
        cliente: { id: clienteId } as any,
        mesa: mesaId ? ({ id: mesaId } as any) : null,
        status: ComandaStatus.ABERTA,
      });

      comanda = await this.comandaRepository.save(novaComanda);
      this.logger.log(`✅ Comanda criada | ID: ${comanda.id}`);
    } else {
      this.logger.log(`📋 Usando comanda existente | ID: ${comanda.id}`);
    }

    // Valida itens
    if (!itens || itens.length === 0) {
      throw new BadRequestException('Um pedido não pode ser criado sem itens.');
    }

    // Cria itens do pedido
    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({
        where: { id: itemDto.produtoId },
      });
      if (!produto) {
        throw new NotFoundException(
          `Produto com ID "${itemDto.produtoId}" não encontrado.`,
        );
      }
      return this.itemPedidoRepository.create({
        produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
        observacao: itemDto.observacao,
        status: PedidoStatus.FEITO,
      });
    });

    const itensPedido = await Promise.all(itensPedidoPromise);

    // Calcula total
    const total = itensPedido.reduce((sum, item) => {
      const itemTotal = new Decimal(item.quantidade).times(
        new Decimal(item.precoUnitario),
      );
      return sum.plus(itemTotal);
    }, new Decimal(0));

    // Cria pedido
    const pedido = this.pedidoRepository.create({
      comanda,
      itens: itensPedido,
      total: total.toNumber(),
      status: PedidoStatus.FEITO,
    });

    const novoPedido = await this.pedidoRepository.save(pedido);
    const pedidoCompleto = await this.findOne(novoPedido.id);

    this.logger.log(
      `✅ Pedido pelo garçom criado | ID: ${pedidoCompleto.id} | Garçom: ${garcomId} | Total: R$ ${total.toFixed(2)}`,
    );

    // Invalidar cache após criar pedido
    await this.cacheInvalidationService.invalidatePedidos();

    this.pedidosGateway.emitNovoPedido(pedidoCompleto);

    return pedidoCompleto;
  }

  async findAll(filters?: {
    ambienteId?: string;
    status?: string;
    comandaId?: string;
  }): Promise<Pedido[]> {
    const { ambienteId, status, comandaId } = filters || {};
    
    // Cache key baseado nos filtros com namespace do tenant
    const cacheKey = this.getCacheKey(`amb:${ambienteId || 'all'}:st:${status || 'all'}:cmd:${comandaId || 'all'}`);
    
    // Tentar buscar do cache
    const cached = await this.cacheManager.get<Pedido[]>(cacheKey);
    if (cached) {
      this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
      return cached;
    }
    
    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    const queryBuilder = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.pontoEntrega', 'pontoEntrega')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .leftJoinAndSelect('produto.ambiente', 'ambiente')
      .leftJoinAndSelect('itemPedido.ambienteRetirada', 'ambienteRetirada')
      .select([
        'pedido',
        'comanda',
        'mesa',
        'cliente',
        'pontoEntrega',
        'itemPedido',
        'produto',
        'ambiente',
        'ambienteRetirada',
      ]);

    // Filtro por status específico ou padrão
    if (status) {
      queryBuilder.where('itemPedido.status = :status', { status });
    } else {
      queryBuilder.where('itemPedido.status IN (:...statuses)', {
        statuses: [
          PedidoStatus.FEITO,
          PedidoStatus.EM_PREPARO,
          PedidoStatus.QUASE_PRONTO,
          PedidoStatus.PRONTO,
          PedidoStatus.RETIRADO,
          PedidoStatus.ENTREGUE,
          PedidoStatus.DEIXADO_NO_AMBIENTE,
        ],
      });
    }

    // Filtro por comanda
    if (comandaId) {
      queryBuilder.andWhere('comanda.id = :comandaId', { comandaId });
    }

    queryBuilder.orderBy('pedido.data', 'ASC');

    if (ambienteId) {
      queryBuilder.andWhere('ambiente.id = :ambienteId', { ambienteId });
    }

    const pedidos = await queryBuilder.getMany();
    let pedidosFiltrados = pedidos;

    if (ambienteId) {
      // Log para debug: quantos itens ANTES do filtro
      const totalItensAntesFiltro = pedidos.reduce(
        (sum, p) => sum + p.itens.length,
        0,
      );
      const statusAntes = pedidos
        .flatMap((p) => p.itens)
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      this.logger.debug(
        `📊 ANTES do filtro JS | Pedidos: ${pedidos.length} | Total Itens: ${totalItensAntesFiltro} | Status: ${JSON.stringify(statusAntes)}`,
      );

      pedidosFiltrados = pedidos
        .map((pedido) => ({
          ...pedido,
          itens: pedido.itens.filter(
            (item) => item.produto.ambiente?.id === ambienteId,
          ),
        }))
        .filter((pedido) => pedido.itens.length > 0);

      const totalItensDepoisFiltro = pedidosFiltrados.reduce(
        (sum, p) => sum + p.itens.length,
        0,
      );
      const statusDepois = pedidosFiltrados
        .flatMap((p) => p.itens)
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      this.logger.debug(
        `🔍 DEPOIS do filtro JS | Ambiente: ${ambienteId} | Pedidos: ${pedidosFiltrados.length} | Total Itens: ${totalItensDepoisFiltro} | Status: ${JSON.stringify(statusDepois)}`,
      );
    }

    // Armazenar no cache por 2 minutos (pedidos mudam muito frequentemente)
    await this.cacheManager.set(cacheKey, pedidosFiltrados, 120000);

    return pedidosFiltrados;
  }
  //----------------------------------------------------------
  async findOne(id: string): Promise<Pedido> {
    const relations = [
      'comanda',
      'comanda.mesa',
      'comanda.cliente',
      'comanda.pontoEntrega',
      'itens',
      'itens.produto',
      'itens.produto.ambiente',
    ];

    // Primeiro tenta com filtro de tenant
    let pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations,
    });

    // Se não encontrou com filtro de tenant, busca sem filtro (pode ter tenantId null)
    if (!pedido) {
      this.logger.warn(
        `⚠️ Pedido não encontrado com filtro de tenant, tentando rawRepository: ${id}`,
      );
      
      pedido = await this.pedidoRepository.rawRepository.findOne({
        where: { id },
        relations,
      });
      
      // Se encontrou com rawRepository, corrige o tenantId
      if (pedido) {
        const currentTenantId = this.getTenantId();
        if (!pedido.tenantId && currentTenantId) {
          this.logger.warn(
            `🔧 Corrigindo tenantId do pedido ${id} para: ${currentTenantId}`,
          );
          pedido.tenantId = currentTenantId;
          // Salva para corrigir o tenantId permanentemente
          await this.pedidoRepository.rawRepository.save(pedido);
          this.logger.log(`✅ TenantId do pedido corrigido!`);
        }
      }
    }

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    return pedido;
  }

  async updateItemStatus(
    itemPedidoId: string,
    updateDto: UpdateItemPedidoStatusDto,
  ): Promise<ItemPedido> {
    // Primeiro tenta com filtro de tenant
    let itemPedido = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: ['pedido', 'produto'],
    });

    // Se não encontrou com filtro de tenant, busca sem filtro (pode ter tenantId null)
    if (!itemPedido) {
      this.logger.warn(
        `⚠️ Item não encontrado com filtro de tenant, tentando rawRepository: ${itemPedidoId}`,
      );
      
      itemPedido = await this.itemPedidoRepository.rawRepository.findOne({
        where: { id: itemPedidoId },
        relations: ['pedido', 'produto'],
      });
      
      // Se encontrou com rawRepository, corrige o tenantId
      if (itemPedido) {
        const currentTenantId = this.getTenantId();
        if (!itemPedido.tenantId && currentTenantId) {
          this.logger.warn(
            `🔧 Corrigindo tenantId do item de pedido ${itemPedidoId} para: ${currentTenantId}`,
          );
          itemPedido.tenantId = currentTenantId;
          // Salva para corrigir o tenantId permanentemente
          await this.itemPedidoRepository.rawRepository.save(itemPedido);
          this.logger.log(`✅ TenantId do item de pedido corrigido!`);
        }
      }
    }

    if (!itemPedido) {
      this.logger.warn(
        `⚠️ Tentativa de atualizar status de item inexistente: ${itemPedidoId}`,
      );
      throw new NotFoundException(
        `Item de pedido com ID "${itemPedidoId}" não encontrado.`,
      );
    }

    const statusAnterior = itemPedido.status;
    itemPedido.status = updateDto.status;

    // Registra timestamps para cálculo de tempo de preparo
    const agora = new Date();
    if (
      updateDto.status === PedidoStatus.EM_PREPARO &&
      !itemPedido.iniciadoEm
    ) {
      itemPedido.iniciadoEm = agora;
      this.logger.log(
        `⏱️ Preparo iniciado: ${itemPedido.produto?.nome || 'Produto'}`,
      );
    } else if (
      updateDto.status === PedidoStatus.PRONTO &&
      !itemPedido.prontoEm
    ) {
      itemPedido.prontoEm = agora;
      const tempoPreparo = itemPedido.iniciadoEm
        ? Math.round(
            (agora.getTime() - itemPedido.iniciadoEm.getTime()) / 60000,
          )
        : null;
      this.logger.log(
        `✅ Item pronto: ${itemPedido.produto?.nome || 'Produto'} | Tempo: ${tempoPreparo || '?'} min`,
      );
    } else if (
      updateDto.status === PedidoStatus.ENTREGUE &&
      !itemPedido.entregueEm
    ) {
      itemPedido.entregueEm = agora;
      const tempoTotal = itemPedido.iniciadoEm
        ? Math.round(
            (agora.getTime() - itemPedido.iniciadoEm.getTime()) / 60000,
          )
        : null;
      this.logger.log(
        `🎉 Item entregue: ${itemPedido.produto?.nome || 'Produto'} | Tempo total: ${tempoTotal || '?'} min`,
      );
    }

    if (updateDto.status === PedidoStatus.CANCELADO) {
      itemPedido.motivoCancelamento = updateDto.motivoCancelamento;
      this.logger.warn(
        `🚫 Item cancelado: ${itemPedido.produto?.nome || 'Produto'} | Motivo: ${updateDto.motivoCancelamento}`,
      );
    } else {
      this.logger.log(
        `🔄 Status alterado: ${itemPedido.produto?.nome || 'Produto'} | ${statusAnterior} → ${updateDto.status}`,
      );
    }

    const itemAtualizado = await this.itemPedidoRepository.save(itemPedido);

    // Invalidar cache após atualizar status do item
    await this.cacheInvalidationService.invalidatePedidos();

    const pedidoPaiCompleto = await this.findOne(itemAtualizado.pedido.id);
    this.pedidosGateway.emitStatusAtualizado(pedidoPaiCompleto);

    return itemAtualizado;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.pedidoRepository.preload({
      id,
      ...updatePedidoDto,
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    return this.pedidoRepository.save(pedido);
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);
    await this.pedidoRepository.remove(pedido);
  }

  // ==================== NOVOS MÉTODOS ====================

  /**
   * Lista pedidos prontos para entrega (status PRONTO)
   * Formatado com informações de localização (Mesa ou Ponto de Entrega)
   */
  async findProntos(ambienteId?: string): Promise<any[]> {
    const queryBuilder = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'mesaAmbiente')
      .leftJoinAndSelect('comanda.pontoEntrega', 'pontoEntrega')
      .leftJoinAndSelect('pontoEntrega.mesaProxima', 'mesaProxima')
      .leftJoinAndSelect('pontoEntrega.ambientePreparo', 'ambientePreparo')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .where('itemPedido.status = :status', { status: PedidoStatus.PRONTO })
      .orderBy('pedido.data', 'ASC');

    if (ambienteId) {
      queryBuilder
        .leftJoinAndSelect('produto.ambiente', 'produtoAmbiente')
        .andWhere('produtoAmbiente.id = :ambienteId', { ambienteId });
    }

    const pedidos = await queryBuilder.getMany();

    this.logger.log(
      `📋 Listando pedidos prontos | Ambiente: ${ambienteId || 'Todos'} | Quantidade: ${pedidos.length}`,
    );

    // Formata resposta com informações de localização
    return pedidos.map((pedido) => {
      const tempoEspera = Math.floor(
        (Date.now() - new Date(pedido.data).getTime()) / 60000,
      );

      return {
        pedidoId: pedido.id,
        comandaId: pedido.comanda.id,
        cliente: pedido.comanda.cliente?.nome || 'Cliente Avulso',
        local: pedido.comanda.mesa
          ? {
              tipo: 'MESA',
              mesa: {
                numero: pedido.comanda.mesa.numero,
                ambiente: pedido.comanda.mesa.ambiente?.nome,
              },
            }
          : {
              tipo: 'PONTO_ENTREGA',
              pontoEntrega: {
                nome: pedido.comanda.pontoEntrega?.nome || 'N/A',
                mesaProxima: pedido.comanda.pontoEntrega?.mesaProxima?.numero,
                ambientePreparo:
                  pedido.comanda.pontoEntrega?.ambientePreparo?.nome,
              },
            },
        itens: pedido.itens.filter(
          (item) => item.status === PedidoStatus.PRONTO,
        ),
        tempoEspera: `${tempoEspera} min`,
        data: pedido.data,
      };
    });
  }

  /**
   * Marca item como DEIXADO_NO_AMBIENTE quando cliente não é encontrado
   * Notifica cliente via WebSocket
   */
  async deixarNoAmbiente(
    itemPedidoId: string,
    dto: DeixarNoAmbienteDto,
  ): Promise<ItemPedido> {
    // Primeiro tenta com filtro de tenant
    let item = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: [
        'pedido',
        'pedido.comanda',
        'pedido.comanda.pontoEntrega',
        'pedido.comanda.pontoEntrega.ambientePreparo',
        'pedido.comanda.mesa',
        'pedido.comanda.mesa.ambiente',
        'produto',
      ],
    });

    // Se não encontrou com filtro de tenant, busca sem filtro (pode ter tenantId null)
    if (!item) {
      item = await this.itemPedidoRepository.rawRepository.findOne({
        where: { id: itemPedidoId },
        relations: [
          'pedido',
          'pedido.comanda',
          'pedido.comanda.pontoEntrega',
          'pedido.comanda.pontoEntrega.ambientePreparo',
          'pedido.comanda.mesa',
          'pedido.comanda.mesa.ambiente',
          'produto',
        ],
      });
      
      // Corrige tenantId se necessário
      if (item && !item.tenantId) {
        const currentTenantId = this.getTenantId();
        if (currentTenantId) {
          this.logger.warn(`🔧 Corrigindo tenantId do item ${itemPedidoId}`);
          item.tenantId = currentTenantId;
        }
      }
    }

    if (!item) {
      this.logger.warn(
        `⚠️ Tentativa de deixar no ambiente - Item não encontrado: ${itemPedidoId}`,
      );
      throw new NotFoundException('Item de pedido não encontrado');
    }

    if (item.status !== PedidoStatus.PRONTO) {
      throw new BadRequestException(
        'Apenas itens com status PRONTO podem ser deixados no ambiente',
      );
    }

    const { comanda } = item.pedido;
    let ambienteRetirada: Ambiente;

    // Busca ambiente de retirada baseado no tipo de comanda
    if (comanda.pontoEntrega) {
      ambienteRetirada = await this.ambienteRepository.findOne({
        where: { id: comanda.pontoEntrega.ambientePreparoId },
      });
    } else if (comanda.mesa) {
      // Mesa tem relação 'ambiente', não 'ambienteId'
      ambienteRetirada = comanda.mesa.ambiente;
    }

    if (!ambienteRetirada) {
      throw new NotFoundException('Ambiente de retirada não encontrado');
    }

    // Atualiza item
    item.status = PedidoStatus.DEIXADO_NO_AMBIENTE;
    item.ambienteRetiradaId = ambienteRetirada.id;
    item.ambienteRetirada = ambienteRetirada;

    await this.itemPedidoRepository.save(item);

    this.logger.log(
      `📦 Item deixado no ambiente | Produto: ${item.produto?.nome || 'Item'} → ${ambienteRetirada.nome} | Motivo: ${dto.motivo || 'Cliente não encontrado'}`,
    );

    // Notifica cliente via WebSocket
    this.pedidosGateway.server
      .to(`comanda_${comanda.id}`)
      .emit('item_deixado_no_ambiente', {
        itemId: item.id,
        produtoNome: item.produto?.nome,
        ambiente: ambienteRetirada.nome,
        mensagem: `Seu pedido está pronto para retirada no ${ambienteRetirada.nome}`,
      });

    return item;
  }

  /**
   * ✅ NOVO: Marca item como retirado pelo garçom
   */
  async retirarItem(
    itemPedidoId: string,
    dto: RetirarItemDto,
  ): Promise<ItemPedido> {
    // Primeiro tenta com filtro de tenant
    let item = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: ['pedido', 'pedido.comanda', 'produto', 'produto.ambiente'],
    });

    // Se não encontrou com filtro de tenant, busca sem filtro
    if (!item) {
      item = await this.itemPedidoRepository.rawRepository.findOne({
        where: { id: itemPedidoId },
        relations: ['pedido', 'pedido.comanda', 'produto', 'produto.ambiente'],
      });
      
      // Corrige tenantId se necessário
      if (item && !item.tenantId) {
        const currentTenantId = this.getTenantId();
        if (currentTenantId) {
          this.logger.warn(`🔧 Corrigindo tenantId do item ${itemPedidoId}`);
          item.tenantId = currentTenantId;
        }
      }
    }

    if (!item) {
      throw new NotFoundException(
        `Item de pedido com ID "${itemPedidoId}" não encontrado.`,
      );
    }

    // Verifica se o item está no estado PRONTO
    if (item.status !== PedidoStatus.PRONTO) {
      throw new BadRequestException(
        'Apenas itens com status PRONTO podem ser retirados. ' +
          `Status atual: ${item.status}`,
      );
    }

    // Busca o garçom
    const garcom = await this.funcionarioRepository.findOne({
      where: { id: dto.garcomId },
    });

    if (!garcom) {
      throw new NotFoundException(
        `Garçom com ID "${dto.garcomId}" não encontrado.`,
      );
    }

    // Valida se o garçom está em turno ativo
    const turnoAtivo = await this.turnoRepository.findOne({
      where: {
        funcionarioId: dto.garcomId,
        ativo: true,
        checkOut: null as any, // TypeORM IsNull workaround
      },
    });

    if (!turnoAtivo) {
      throw new BadRequestException(
        `Garçom ${garcom.nome} não possui turno ativo. ` +
          'Faça check-in antes de retirar pedidos.',
        { cause: 'FORBIDDEN', description: 'Sem turno ativo' },
      );
    }

    // Calcula tempo de reação (PRONTO -> RETIRADO)
    const agora = new Date();
    let tempoReacaoMinutos = null;

    if (item.prontoEm) {
      const diferencaMs = agora.getTime() - new Date(item.prontoEm).getTime();
      tempoReacaoMinutos = Math.round(diferencaMs / 60000); // Converte para minutos
    }

    // ✅ SOLUÇÃO 1: Registra ambiente de preparo do produto como ambiente de retirada
    const ambientePreparo = item.produto?.ambiente;
    if (ambientePreparo) {
      item.ambienteRetiradaId = ambientePreparo.id;
      item.ambienteRetirada = ambientePreparo;
    }

    // Atualiza o item
    item.status = PedidoStatus.RETIRADO;
    item.retiradoEm = agora;
    item.retiradoPorGarcomId = dto.garcomId;
    item.tempoReacaoMinutos = tempoReacaoMinutos;

    await this.itemPedidoRepository.save(item);

    // ✅ SOLUÇÃO 3: Registra na tabela de histórico de retiradas
    if (ambientePreparo) {
      const retirada = this.retiradaItemRepository.create({
        itemPedidoId: item.id,
        garcomId: dto.garcomId,
        ambienteId: ambientePreparo.id,
        retiradoEm: agora,
        tempoReacaoMinutos,
        observacao: `Retirada do ambiente ${ambientePreparo.nome}`,
      });

      await this.retiradaItemRepository.save(retirada);

      this.logger.debug(
        `📝 Retirada registrada no histórico | ID: ${retirada.id} | ` +
          `Item: ${item.id} | Ambiente: ${ambientePreparo.nome}`,
      );
    }

    this.logger.log(
      `🎯 Item retirado | Produto: ${item.produto?.nome || 'Item'} | ` +
        `Ambiente: ${ambientePreparo?.nome || 'N/A'} | ` +
        `Garçom: ${garcom.nome} | Tempo reação: ${tempoReacaoMinutos || 'N/A'} min`,
    );

    // Emite evento WebSocket para atualização em tempo real
    const comanda = item.pedido?.comanda;
    if (comanda) {
      // ✅ CORREÇÃO: Recarrega o pedido completo com todas as relações para o WebSocket
      // Usa rawRepository como fallback para pedidos com tenantId null
      let pedidoCompleto = await this.pedidoRepository.findOne({
        where: { id: item.pedido.id },
        relations: [
          'comanda',
          'comanda.mesa',
          'comanda.cliente',
          'comanda.pontoEntrega',
          'itens',
          'itens.produto',
          'itens.produto.ambiente',
          'itens.garcomEntrega',
          'itens.retiradoPorGarcom',
        ],
      });

      // Fallback para rawRepository se não encontrar com filtro de tenant
      if (!pedidoCompleto) {
        pedidoCompleto = await this.pedidoRepository.rawRepository.findOne({
          where: { id: item.pedido.id },
          relations: [
            'comanda',
            'comanda.mesa',
            'comanda.cliente',
            'comanda.pontoEntrega',
            'itens',
            'itens.produto',
            'itens.produto.ambiente',
            'itens.garcomEntrega',
            'itens.retiradoPorGarcom',
          ],
        });
        
        // Corrige tenantId se necessário
        if (pedidoCompleto && !pedidoCompleto.tenantId) {
          const currentTenantId = this.getTenantId();
          if (currentTenantId) {
            pedidoCompleto.tenantId = currentTenantId;
            await this.pedidoRepository.rawRepository.save(pedidoCompleto);
          }
        }
      }

      if (pedidoCompleto) {
        this.pedidosGateway.emitStatusAtualizado(pedidoCompleto);
      }

      // Evento específico de item retirado
      this.pedidosGateway.server.emit('item_retirado', {
        itemId: item.id,
        pedidoId: item.pedido.id,
        produtoNome: item.produto?.nome,
        ambienteId: ambientePreparo?.id,
        ambienteNome: ambientePreparo?.nome,
        garcomId: dto.garcomId,
        garcomNome: garcom.nome,
        retiradoEm: agora,
        tempoReacaoMinutos,
        statusAnterior: PedidoStatus.PRONTO,
        statusAtual: PedidoStatus.RETIRADO,
      });

      // Emite também para sala de gestão
      this.pedidosGateway.server.to('gestao').emit('item_retirado', {
        itemId: item.id,
        pedidoId: item.pedido.id,
        produtoNome: item.produto?.nome,
        ambienteId: ambientePreparo?.id,
        ambienteNome: ambientePreparo?.nome,
        garcomId: dto.garcomId,
        garcomNome: garcom.nome,
        retiradoEm: agora,
        tempoReacaoMinutos,
      });
    }

    return item;
  }

  /**
   * ✅ NOVO: Marca item como entregue pelo garçom
   */
  async marcarComoEntregue(
    itemPedidoId: string,
    dto: MarcarEntregueDto,
  ): Promise<ItemPedido> {
    // Primeiro tenta com filtro de tenant
    let item = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: ['pedido', 'pedido.comanda', 'produto', 'garcomEntrega'],
    });

    // Se não encontrou com filtro de tenant, busca sem filtro
    if (!item) {
      item = await this.itemPedidoRepository.rawRepository.findOne({
        where: { id: itemPedidoId },
        relations: ['pedido', 'pedido.comanda', 'produto', 'garcomEntrega'],
      });
      
      // Corrige tenantId se necessário
      if (item && !item.tenantId) {
        const currentTenantId = this.getTenantId();
        if (currentTenantId) {
          this.logger.warn(`🔧 Corrigindo tenantId do item ${itemPedidoId}`);
          item.tenantId = currentTenantId;
        }
      }
    }

    if (!item) {
      throw new NotFoundException(
        `Item de pedido com ID "${itemPedidoId}" não encontrado.`,
      );
    }

    // Verifica se o item está RETIRADO (não PRONTO)
    if (item.status !== PedidoStatus.RETIRADO) {
      throw new BadRequestException(
        'Apenas itens com status RETIRADO podem ser marcados como entregues.',
      );
    }

    // Busca o garçom
    const garcom = await this.funcionarioRepository.findOne({
      where: { id: dto.garcomId },
    });

    if (!garcom) {
      throw new NotFoundException(
        `Garçom com ID "${dto.garcomId}" não encontrado.`,
      );
    }

    // ✅ SOLUÇÃO 2: Valida se o garçom está em turno ativo
    const turnoAtivo = await this.turnoRepository.findOne({
      where: {
        funcionarioId: dto.garcomId,
        ativo: true,
        checkOut: null as any, // TypeORM IsNull workaround
      },
    });

    if (!turnoAtivo) {
      throw new BadRequestException(
        `Garçom ${garcom.nome} não possui turno ativo. ` +
          'Faça check-in antes de entregar pedidos.',
        { cause: 'FORBIDDEN', description: 'Sem turno ativo' },
      );
    }

    // Calcula tempo de entrega FINAL (do momento que foi RETIRADO até agora)
    const agora = new Date();
    let tempoEntregaFinalMinutos = null;

    if (item.retiradoEm) {
      const diferencaMs = agora.getTime() - new Date(item.retiradoEm).getTime();
      tempoEntregaFinalMinutos = Math.round(diferencaMs / 60000); // Converte para minutos
    }

    // Calcula tempo TOTAL de entrega (do momento que ficou PRONTO até agora)
    let tempoEntregaMinutos = null;
    if (item.prontoEm) {
      const diferencaMs = agora.getTime() - new Date(item.prontoEm).getTime();
      tempoEntregaMinutos = Math.round(diferencaMs / 60000);
    }

    // Atualiza o item
    item.status = PedidoStatus.ENTREGUE;
    item.entregueEm = agora;
    item.garcomEntregaId = dto.garcomId;
    item.tempoEntregaMinutos = tempoEntregaMinutos; // Tempo total (PRONTO -> ENTREGUE)
    item.tempoEntregaFinalMinutos = tempoEntregaFinalMinutos; // Última milha (RETIRADO -> ENTREGUE)

    await this.itemPedidoRepository.save(item);

    this.logger.log(
      `✅ Item entregue | Produto: ${item.produto?.nome || 'Item'} | Garçom: ${garcom.nome} | Tempo total: ${tempoEntregaMinutos || 'N/A'} min | Última milha: ${tempoEntregaFinalMinutos || 'N/A'} min`,
    );

    // Emite evento WebSocket para TODOS os clientes
    const comanda = item.pedido?.comanda;
    if (comanda) {
      // ✅ CORREÇÃO: Recarrega o pedido completo com todas as relações para o WebSocket
      // Usa rawRepository como fallback para pedidos com tenantId null
      let pedidoCompleto = await this.pedidoRepository.findOne({
        where: { id: item.pedido.id },
        relations: [
          'comanda',
          'comanda.mesa',
          'comanda.cliente',
          'comanda.pontoEntrega',
          'itens',
          'itens.produto',
          'itens.produto.ambiente',
          'itens.garcomEntrega',
        ],
      });

      // Fallback para rawRepository se não encontrar com filtro de tenant
      if (!pedidoCompleto) {
        pedidoCompleto = await this.pedidoRepository.rawRepository.findOne({
          where: { id: item.pedido.id },
          relations: [
            'comanda',
            'comanda.mesa',
            'comanda.cliente',
            'comanda.pontoEntrega',
            'itens',
            'itens.produto',
            'itens.produto.ambiente',
            'itens.garcomEntrega',
          ],
        });
        
        // Corrige tenantId se necessário
        if (pedidoCompleto && !pedidoCompleto.tenantId) {
          const currentTenantId = this.getTenantId();
          if (currentTenantId) {
            pedidoCompleto.tenantId = currentTenantId;
            await this.pedidoRepository.rawRepository.save(pedidoCompleto);
          }
        }
      }

      // Atualiza status geral do pedido
      if (pedidoCompleto) {
        this.pedidosGateway.emitStatusAtualizado(pedidoCompleto);
      }

      // Evento específico de item entregue (broadcast para todos)
      this.pedidosGateway.server.emit('item_entregue', {
        itemId: item.id,
        pedidoId: item.pedido.id,
        produtoNome: item.produto?.nome,
        garcomNome: garcom.nome,
        tempoEntregaFinalMinutos,
        tempoEntregaMinutos,
      });

      // Notifica cliente específico da comanda
      this.pedidosGateway.server
        .to(`comanda_${comanda.id}`)
        .emit('item_entregue', {
          itemId: item.id,
          produtoNome: item.produto?.nome,
          garcomNome: garcom.nome,
        });
    }

    return item;
  }
}
