// Caminho: backend/src/modulos/ambiente/ambiente.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
  Scope,
  Optional,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { Ambiente } from './entities/ambiente.entity';
import { AmbienteRepository } from './ambiente.repository';

@Injectable({ scope: Scope.REQUEST })
export class AmbienteService {
  private readonly logger = new Logger(AmbienteService.name);

  constructor(
    private readonly ambienteRepository: AmbienteRepository,
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
    return tenantId ? `ambientes:${tenantId}:${params}` : `ambientes:global:${params}`;
  }

  async create(createAmbienteDto: CreateAmbienteDto): Promise<Ambiente> {
    this.logger.log(`📝 Criando ambiente: ${createAmbienteDto.nome}`);
    
    try {
      // Criar entidade com tenant_id automático
      const ambiente = this.ambienteRepository.create(createAmbienteDto);
      this.logger.log(`📝 Ambiente criado em memória com tenantId: ${ambiente.tenantId}`);
      
      const savedAmbiente = await this.ambienteRepository.save(ambiente);
      this.logger.log(`✅ Ambiente salvo: ${savedAmbiente.id} | tenantId: ${savedAmbiente.tenantId}`);
      
      // Invalidar cache após criar ambiente (afeta ambientes e produtos)
      try {
        await this.cacheInvalidationService.invalidateAmbientes();
      } catch (cacheError) {
        this.logger.warn(`⚠️ Erro ao invalidar cache: ${cacheError.message}`);
      }
      
      return savedAmbiente;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar ambiente: ${error.name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // --- MÉTODO 'findAll' CORRIGIDO ---
  async findAll(): Promise<any[]> {
    const tenantId = this.getTenantId();
    this.logger.log(`🔍 [findAll] TenantId obtido: ${tenantId}`);
    
    if (!tenantId) {
      this.logger.error(`❌ [findAll] TenantId é NULL/undefined! Retornando array vazio por segurança.`);
      return [];
    }
    
    const cacheKey = this.getCacheKey('all');

    // Tentar buscar do cache
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    // 🔒 CORREÇÃO DEFINITIVA: Usar query builder do TypeORM raw com filtro explícito de tenant
    // O createQueryBuilder do BaseTenantRepository pode perder o WHERE ao usar .select()
    const queryBuilder = this.ambienteRepository
      .createQueryBuilder('ambiente')
      .leftJoin('ambiente.produtos', 'produto')
      .leftJoin('ambiente.mesas', 'mesa')
      .select('ambiente.id', 'id')
      .addSelect('ambiente.nome', 'nome')
      .addSelect('ambiente.descricao', 'descricao')
      .addSelect('ambiente.tipo', 'tipo')
      .addSelect('ambiente.isPontoDeRetirada', 'isPontoDeRetirada')
      .addSelect('ambiente.tenantId', 'tenantId')
      .addSelect('COUNT(DISTINCT produto.id)', 'productCount')
      .addSelect('COUNT(DISTINCT mesa.id)', 'tableCount')
      // 🔒 GARANTIR filtro de tenant EXPLICITAMENTE (caso o createQueryBuilder não esteja aplicando)
      .andWhere('ambiente.tenantId = :tenantId', { tenantId })
      .groupBy('ambiente.id')
      .orderBy('ambiente.nome', 'ASC');
    
    // Log da query SQL para debug
    this.logger.log(`🔍 [findAll] Query SQL: ${queryBuilder.getQuery()}`);
    this.logger.log(`🔍 [findAll] Parâmetros: ${JSON.stringify(queryBuilder.getParameters())}`);
    
    const ambientes = await queryBuilder.getRawMany();
    
    this.logger.log(`🔍 [findAll] Ambientes encontrados: ${ambientes.length} para tenant: ${tenantId}`);

    // A conversão de `isPontoDeRetirada` para booleano é feita automaticamente pelo driver.
    // O resto da lógica permanece a mesma.
    const result = ambientes.map((ambiente) => ({
      ...ambiente,
      productCount: parseInt(ambiente.productCount, 10),
      tableCount: parseInt(ambiente.tableCount, 10),
    }));

    // Armazenar no cache por 10 minutos (ambientes mudam raramente)
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }
  // --- FIM DA CORREÇÃO ---

  async findOne(id: string): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.findOne({ where: { id } });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    return ambiente;
  }

  async update(
    id: string,
    updateAmbienteDto: UpdateAmbienteDto,
  ): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.preload({
      id,
      ...updateAmbienteDto,
    });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    const updatedAmbiente = await this.ambienteRepository.save(ambiente);
    
    // Invalidar cache após atualizar ambiente (afeta ambientes e produtos)
    await this.cacheInvalidationService.invalidateAmbientes();
    
    return updatedAmbiente;
  }

  async remove(id: string): Promise<void> {
    const ambiente = await this.findOne(id);
    try {
      await this.ambienteRepository.remove(ambiente);
      
      // Invalidar cache após remover ambiente (afeta ambientes e produtos)
      await this.cacheInvalidationService.invalidateAmbientes();
    } catch (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Este ambiente não pode ser apagado pois está em uso por produtos ou mesas.',
        );
      }
      throw error;
    }
  }
}
