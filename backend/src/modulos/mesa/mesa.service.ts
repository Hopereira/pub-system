// Caminho: backend/src/modulos/mesa/mesa.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
  Optional,
  Scope,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { TenantResolverService } from '../../common/tenant/tenant-resolver.service';
import { Mesa, MesaStatus } from './entities/mesa.entity';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { MesaRepository } from './mesa.repository';
import { AmbienteRepository } from '../ambiente/ambiente.repository';
import {
  AtualizarPosicaoMesaDto,
  AtualizarPosicoesBatchDto,
  MesaMapaDto,
  MapaCompletoDto,
} from './dto/mapa.dto';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { PontoEntregaRepository } from '../ponto-entrega/ponto-entrega.repository';
import { Pedido } from '../pedido/entities/pedido.entity';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
import { PlanFeaturesService } from '../../common/tenant/services/plan-features.service';

@Injectable({ scope: Scope.REQUEST })
export class MesaService {
  private readonly logger = new Logger(MesaService.name);

  constructor(
    private readonly mesaRepository: MesaRepository,
    private readonly ambienteRepository: AmbienteRepository,
    private readonly pontoEntregaRepository: PontoEntregaRepository,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly cacheInvalidationService: CacheInvalidationService,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
    @Optional() private readonly tenantResolver?: TenantResolverService,
    @Optional() private readonly planFeaturesService?: PlanFeaturesService,
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
    return this.request?.headers?.['x-tenant-id'] || null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   */
  private getCacheKey(params: string): string | null {
    const tenantId = this.getTenantId();
    if (!tenantId) return null;
    return `mesas:${tenantId}:${params}`;
  }

  // --- MÉTODO ATUALIZADO: Aceita posição, tamanho e rotação opcionais ---
  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const { numero, ambienteId, posicao, tamanho, rotacao } = createMesaDto;

    // Verificar limite do plano
    const tenantId = this.getTenantId();
    if (tenantId && this.planFeaturesService) {
      const currentCount = await this.mesaRepository.count();
      await this.planFeaturesService.requireLimitForTenant(tenantId, 'maxMesas', currentCount);
    }

    // Valida se ambiente existe
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });
    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID "${ambienteId}" não encontrado.`,
      );
    }

    // Verifica se já existe uma mesa com este número em qualquer ambiente
    const mesaExistente = await this.mesaRepository.findOne({
      where: { numero },
      relations: ['ambiente'],
    });

    if (mesaExistente) {
      if (mesaExistente.ambiente.id === ambienteId) {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${ambiente.nome}".`
        );
      } else {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${mesaExistente.ambiente.nome}". Por favor, escolha outro número.`
        );
      }
    }

    // Cria mesa com posição, tamanho e rotação (se fornecidos)
    const mesa = this.mesaRepository.create({
      numero,
      ambiente,
      posicao: posicao || { x: 100, y: 100 }, // Posição padrão
      tamanho: tamanho || { width: 80, height: 80 }, // Tamanho padrão
      rotacao: rotacao !== undefined ? rotacao : 0, // Rotação padrão
    });

    try {
      const mesaSalva = await this.mesaRepository.save(mesa);

      Logger.log(
        `✅ Mesa ${mesa.numero} criada no ambiente "${ambiente.nome}" com posição (${mesa.posicao.x}, ${mesa.posicao.y})`,
        'MesaService',
      );

      // Invalidar cache após criar mesa
      await this.cacheInvalidationService.invalidateMesas();

      return mesaSalva;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${ambiente.nome}".`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Mesa[]> {
    const cacheKey = this.getCacheKey('all');

    // Tentar buscar do cache (apenas se tenant disponível)
    if (cacheKey) {
      const cached = await this.cacheManager.get<Mesa[]>(cacheKey);
      if (cached) {
        this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`❌ Cache MISS: ${cacheKey}`);
    }

    const mesas = await this.mesaRepository.find({
      relations: ['ambiente', 'comandas', 'comandas.cliente'],
      order: { numero: 'ASC' },
    });
    
    const result = mesas.map((mesa) => {
      const comandaAberta = mesa.comandas?.find(
        (comanda) => comanda.status === 'ABERTA',
      );
      return {
        ...mesa,
        status: comandaAberta ? MesaStatus.OCUPADA : MesaStatus.LIVRE,
        comanda: comandaAberta
          ? {
              id: comandaAberta.id,
              cliente: comandaAberta.cliente
                ? {
                    id: comandaAberta.cliente.id,
                    nome: comandaAberta.cliente.nome,
                  }
                : undefined,
              dataAbertura: comandaAberta.dataAbertura,
            }
          : undefined,
      };
    });

    // Armazenar no cache por 3 minutos (apenas se tenant disponível)
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, result, 180000);
    }

    return result;
  }

  // Endpoint público para clientes - retorna apenas mesas livres (filtra por tenant do header)
  async findMesasLivres(): Promise<Mesa[]> {
    // Obter tenantId do request.tenant (já resolvido pelo TenantInterceptor)
    let tenantId = this.request?.tenant?.id;
    
    // Se não tiver tenant resolvido, tentar resolver do header X-Tenant-ID
    if (!tenantId) {
      const headerValue = this.request?.headers?.['x-tenant-id'];
      if (headerValue) {
        // Verificar se é UUID ou slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(headerValue);
        if (isUuid) {
          tenantId = headerValue;
        } else {
          // É um slug, resolver para UUID
          try {
            const resolved = await this.tenantResolver?.resolveBySlug(headerValue);
            tenantId = resolved?.id;
            this.logger.log(`🔄 Slug "${headerValue}" resolvido para UUID: ${tenantId}`);
          } catch (error) {
            this.logger.warn(`⚠️ Não foi possível resolver slug "${headerValue}": ${error.message}`);
          }
        }
      }
    }
    
    // Buscar mesas usando rawRepository com filtro de tenant
    const whereClause: any = {};
    if (tenantId) {
      whereClause.tenantId = tenantId;
      this.logger.log(`🔒 Mesas públicas filtrando por tenantId: ${tenantId}`);
    } else {
      this.logger.warn(`⚠️ Mesas públicas SEM tenantId - retornando TODAS!`);
    }
    
    const mesas = await this.mesaRepository.rawRepository.find({
      where: whereClause,
      relations: ['ambiente', 'comandas'],
      order: { numero: 'ASC' },
    });
    
    // Filtra apenas mesas sem comanda aberta (livres)
    return mesas
      .filter((mesa) => {
        const comandaAberta = mesa.comandas?.find(
          (comanda) => comanda.status === 'ABERTA',
        );
        return !comandaAberta;
      })
      .map((mesa) => ({
        ...mesa,
        status: MesaStatus.LIVRE,
        comandas: undefined, // Remove comandas da resposta pública
      }));
  }

  // --- NOVO: Buscar mesas por ambiente ---
  async findByAmbiente(ambienteId: string): Promise<Mesa[]> {
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });
    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID "${ambienteId}" não encontrado.`,
      );
    }

    const mesas = await this.mesaRepository.find({
      where: { ambiente: { id: ambienteId } },
      relations: ['ambiente', 'comandas'],
      order: { numero: 'ASC' },
    });

    Logger.log(
      `🔍 Buscadas ${mesas.length} mesas do ambiente "${ambiente.nome}"`,
      'MesaService',
    );

    return mesas.map((mesa) => {
      const temComandaAberta = mesa.comandas?.some(
        (comanda) => comanda.status === 'ABERTA',
      );
      return {
        ...mesa,
        status: temComandaAberta ? MesaStatus.OCUPADA : MesaStatus.LIVRE,
      };
    });
  }

  async findOne(id: string): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return mesa;
  }

  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const { ambienteId, ...dadosUpdate } = updateMesaDto;

    const mesa = await this.mesaRepository.preload({
      id: id,
      ...dadosUpdate,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }

    if (ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({
        where: { id: ambienteId },
      });
      if (!ambiente) {
        throw new NotFoundException(
          `Ambiente com ID "${ambienteId}" não encontrado.`,
        );
      }
      mesa.ambiente = ambiente;
    }

    // NOTA: O update também poderia ter o mesmo tratamento de erro de duplicidade.
    // Vamos focar no create primeiro, mas saiba que seria bom adicionar aqui também.
    const updatedMesa = await this.mesaRepository.save(mesa);
    
    // Invalidar cache após atualizar mesa
    await this.cacheInvalidationService.invalidateMesas();
    
    return updatedMesa;
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
    
    // Invalidar cache após remover mesa
    await this.cacheInvalidationService.invalidateMesas();
  }

  // ===== MÉTODOS DE MAPA VISUAL =====

  async atualizarPosicao(
    id: string,
    dto: AtualizarPosicaoMesaDto,
  ): Promise<Mesa> {
    const mesa = await this.findOne(id);

    mesa.posicao = dto.posicao;
    if (dto.tamanho) {
      mesa.tamanho = dto.tamanho;
    }
    if (dto.rotacao !== undefined) {
      mesa.rotacao = dto.rotacao;
    }

    const mesaAtualizada = await this.mesaRepository.save(mesa);
    Logger.log(
      `Mesa ${mesa.numero} posição atualizada: (${dto.posicao.x}, ${dto.posicao.y})`,
    );

    return mesaAtualizada;
  }

  /**
   * Atualiza posições de múltiplas mesas em uma única operação
   * Evita rate limiting ao fazer batch update
   */
  async atualizarPosicoesBatch(
    dto: AtualizarPosicoesBatchDto,
  ): Promise<{ atualizadas: number }> {
    let atualizadas = 0;

    for (const item of dto.mesas) {
      const mesa = await this.mesaRepository.findOne({ where: { id: item.id } });
      if (mesa) {
        mesa.posicao = item.posicao;
        if (item.tamanho) {
          mesa.tamanho = item.tamanho;
        }
        if (item.rotacao !== undefined) {
          mesa.rotacao = item.rotacao;
        }
        await this.mesaRepository.save(mesa);
        atualizadas++;
      }
    }

    Logger.log(`Batch update: ${atualizadas} mesas atualizadas`);
    return { atualizadas };
  }

  async getMapa(ambienteId: string): Promise<MapaCompletoDto> {
    // Buscar mesas do ambiente
    const mesas = await this.mesaRepository.find({
      where: { ambiente: { id: ambienteId } },
      relations: ['comandas', 'comandas.pedidos'],
      order: { numero: 'ASC' },
    });

    // Buscar pontos de entrega do ambiente (tenant-aware)
    const pontosEntrega = await this.pontoEntregaRepository.find({
      where: { ambientePreparoId: ambienteId } as any,
      relations: ['comandas', 'comandas.pedidos'],
    });

    // Mapear mesas com informações de pedidos
    const mesasMapa: MesaMapaDto[] = mesas.map((mesa) => {
      const comandaAberta = mesa.comandas?.find((c) => c.status === 'ABERTA');

      let pedidosProntos = 0;
      let totalPedidos = 0;

      if (comandaAberta) {
        totalPedidos = comandaAberta.pedidos?.length || 0;
        pedidosProntos =
          comandaAberta.pedidos?.filter((p) => p.status === PedidoStatus.FEITO)
            .length || 0;
      }

      return {
        id: mesa.id,
        numero: mesa.numero,
        status: comandaAberta ? 'OCUPADA' : 'LIVRE',
        posicao: mesa.posicao,
        tamanho: mesa.tamanho || { width: 80, height: 80 },
        rotacao: mesa.rotacao || 0,
        comanda: comandaAberta
          ? {
              id: comandaAberta.id,
              pedidosProntos,
              totalPedidos,
            }
          : undefined,
      };
    });

    // Mapear pontos de entrega
    const pontosEntregaMapa = pontosEntrega.map((ponto) => {
      const comandasAtivas =
        ponto.comandas?.filter((c) => c.status === 'ABERTA') || [];

      let pedidosProntos = 0;
      comandasAtivas.forEach((comanda) => {
        pedidosProntos +=
          comanda.pedidos?.filter((p) => p.status === PedidoStatus.FEITO)
            .length || 0;
      });

      return {
        id: ponto.id,
        nome: ponto.nome,
        ativo: ponto.ativo,
        posicao: ponto.posicao,
        tamanho: ponto.tamanho || { width: 100, height: 60 },
        pedidosProntos,
      };
    });

    return {
      mesas: mesasMapa,
      pontosEntrega: pontosEntregaMapa,
      layout: {
        width: 1200,
        height: 800,
        gridSize: 20,
      },
    };
  }
}
