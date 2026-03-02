import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
  DeepPartial,
  SaveOptions,
  ObjectLiteral,
} from 'typeorm';
import { Injectable, Scope, Inject, Optional, ForbiddenException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantContextService } from '../tenant-context.service';
import { TenantId, createTenantId, TenantNotSetError } from '../tenant.types';

/**
 * Interface para entidades que possuem tenant_id
 * O tenantId é opcional para compatibilidade com entidades em migração
 */
export interface TenantAwareEntity extends ObjectLiteral {
  tenantId?: string;
}

/**
 * BaseTenantRepository - Repositório base com filtro automático por tenant
 * 
 * Esta classe abstrata garante que TODAS as queries sejam filtradas pelo tenant_id
 * do contexto atual, mitigando o risco de vazamento de dados entre bares.
 * 
 * IMPORTANTE:
 * - Todos os métodos find/findOne/count são sobrescritos para injetar o filtro
 * - O método createQueryBuilder já inicia com WHERE tenant_id = ?
 * - Métodos save/insert automaticamente preenchem o tenant_id
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class ProdutoRepository extends BaseTenantRepository<Produto> {
 *   constructor(
 *     @InjectRepository(Produto) repository: Repository<Produto>,
 *     tenantContext: TenantContextService,
 *   ) {
 *     super(repository, tenantContext);
 *   }
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export abstract class BaseTenantRepository<T extends TenantAwareEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    @Optional() protected readonly tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) protected readonly request?: any,
  ) {}

  /**
   * Obtém o tenant_id do contexto atual
   * Tenta múltiplas fontes: TenantContextService, request.tenant, request.user
   * @throws ForbiddenException se o tenant não estiver definido
   */
  protected getTenantId(): TenantId {
    // 1. Tentar do TenantContextService
    try {
      if (this.tenantContext?.hasTenant?.()) {
        const tenantId = this.tenantContext.getTenantId();
        return tenantId;
      }
    } catch {
      // Ignorar e tentar próxima fonte
    }

    // 2. Tentar do request.tenant (definido pelo TenantInterceptor)
    if (this.request?.tenant?.id) {
      return createTenantId(this.request.tenant.id);
    }

    // 3. Tentar do request.user (do JWT)
    const userTenantId = this.request?.user?.tenantId;
    if (userTenantId) {
      return createTenantId(userTenantId);
    }

    // 4. Tentar do request.headers (x-tenant-id)
    const headerTenantId = this.request?.headers?.['x-tenant-id'];
    if (headerTenantId) {
      return createTenantId(headerTenantId);
    }

    // 5. Se nenhuma fonte encontrada, verificar se request existe
    if (!this.request) {
      throw new ForbiddenException(
        'Request não disponível. Verifique se o repositório está com scope REQUEST.'
      );
    }

    throw new ForbiddenException(
      'Tenant não identificado. Verifique se você está autenticado corretamente.'
    );
  }

  /**
   * Obtém o tenant_id do contexto atual ou null se não disponível
   * Útil para rotas públicas onde o tenant é opcional
   */
  protected getTenantIdOrNull(): TenantId | null {
    try {
      return this.getTenantId();
    } catch {
      return null;
    }
  }

  /**
   * Adiciona filtro de tenant às opções de busca
   */
  protected addTenantFilter<O extends FindManyOptions<T> | FindOneOptions<T>>(
    options?: O,
  ): O {
    const tenantId = this.getTenantId();
    const tenantWhere = { tenantId } as unknown as FindOptionsWhere<T>;

    if (!options) {
      return { where: tenantWhere } as O;
    }

    if (!options.where) {
      return { ...options, where: tenantWhere };
    }

    // Se where é um array, adiciona tenant_id em cada condição
    if (Array.isArray(options.where)) {
      return {
        ...options,
        where: options.where.map((w) => ({ ...w, tenantId })),
      };
    }

    // Se where é um objeto, mescla com tenant_id
    return {
      ...options,
      where: { ...options.where, tenantId },
    };
  }

  // ============================================
  // MÉTODOS DE LEITURA (com filtro automático)
  // ============================================

  /**
   * Busca múltiplos registros com filtro automático de tenant
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(this.addTenantFilter(options));
  }

  /**
   * Busca um registro com filtro automático de tenant
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(this.addTenantFilter(options));
  }

  /**
   * Busca um registro por ID com filtro automático de tenant
   * @returns null se não encontrado OU se pertence a outro tenant
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne(
      this.addTenantFilter({
        where: { id } as unknown as FindOptionsWhere<T>,
      }),
    );
  }

  /**
   * Busca um registro ou lança exceção
   */
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    return this.repository.findOneOrFail(this.addTenantFilter(options));
  }

  /**
   * Conta registros com filtro automático de tenant
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(this.addTenantFilter(options));
  }

  /**
   * Verifica se existe registro com filtro automático de tenant
   */
  async exists(options: FindManyOptions<T>): Promise<boolean> {
    const count = await this.count(options);
    return count > 0;
  }

  /**
   * Busca com paginação e filtro automático de tenant
   */
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repository.findAndCount(this.addTenantFilter(options));
  }

  // ============================================
  // MÉTODOS SEM FILTRO DE TENANT (rotas públicas)
  // ============================================

  /**
   * Busca múltiplos registros SEM filtro de tenant
   * ⚠️ Use apenas em rotas públicas onde o tenant não é obrigatório
   */
  async findWithoutTenant(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Busca com paginação SEM filtro de tenant
   * ⚠️ Use apenas em rotas públicas onde o tenant não é obrigatório
   */
  async findAndCountWithoutTenant(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repository.findAndCount(options);
  }

  /**
   * Busca múltiplos registros por IDs com filtro automático de tenant
   */
  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];
    const tenantId = this.getTenantId();
    return this.repository
      .createQueryBuilder('entity')
      .where('entity.id IN (:...ids)', { ids })
      .andWhere('entity.tenantId = :tenantId', { tenantId })
      .getMany();
  }

  // ============================================
  // QUERY BUILDER (com filtro automático)
  // ============================================

  /**
   * Cria QueryBuilder já com filtro de tenant aplicado
   * 
   * @example
   * ```typescript
   * const produtos = await this.produtoRepository
   *   .createQueryBuilder('produto')
   *   .andWhere('produto.preco > :preco', { preco: 10 })
   *   .getMany();
   * // Query gerada: SELECT ... WHERE produto.tenant_id = ? AND produto.preco > 10
   * ```
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const tenantId = this.getTenantId();
    return this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.tenantId = :tenantId`, { tenantId });
  }

  /**
   * Cria QueryBuilder SEM filtro de tenant (uso interno/admin)
   * ⚠️ CUIDADO: Use apenas quando realmente necessário
   */
  createQueryBuilderUnsafe(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  // ============================================
  // MÉTODOS DE ESCRITA (com tenant automático)
  // ============================================

  /**
   * Salva entidade com tenant_id automático
   */
  async save(entity: DeepPartial<T>, options?: SaveOptions): Promise<T> {
    const tenantId = this.getTenantId();
    const entityWithTenant = {
      ...entity,
      tenantId,
    } as DeepPartial<T>;
    return this.repository.save(entityWithTenant, options);
  }

  /**
   * Salva múltiplas entidades com tenant_id automático
   */
  async saveMany(entities: DeepPartial<T>[], options?: SaveOptions): Promise<T[]> {
    const tenantId = this.getTenantId();
    const entitiesWithTenant = entities.map((entity) => ({
      ...entity,
      tenantId,
    })) as DeepPartial<T>[];
    return this.repository.save(entitiesWithTenant, options);
  }

  /**
   * Cria entidade com tenant_id automático (sem salvar)
   */
  create(entityLike: DeepPartial<T>): T {
    const tenantId = this.getTenantId();
    return this.repository.create({
      ...entityLike,
      tenantId,
    } as DeepPartial<T>);
  }

  /**
   * Atualiza entidade com verificação de tenant
   * @returns Número de registros afetados
   */
  async update(
    id: string,
    partialEntity: DeepPartial<T>,
  ): Promise<number> {
    const tenantId = this.getTenantId();
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set(partialEntity as any)
      .where('id = :id AND tenantId = :tenantId', { id, tenantId })
      .execute();
    return result.affected || 0;
  }

  /**
   * Remove entidade com verificação de tenant
   * @returns Número de registros afetados
   */
  async delete(id: string): Promise<number> {
    const tenantId = this.getTenantId();
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('id = :id AND tenantId = :tenantId', { id, tenantId })
      .execute();
    return result.affected || 0;
  }

  /**
   * Soft delete com verificação de tenant
   */
  async softDelete(id: string): Promise<number> {
    const tenantId = this.getTenantId();
    const result = await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id AND tenantId = :tenantId', { id, tenantId })
      .execute();
    return result.affected || 0;
  }

  // ============================================
  // ACESSO AO REPOSITÓRIO ORIGINAL
  // ============================================

  /**
   * Acesso ao repositório TypeORM original
   * ⚠️ CUIDADO: Queries sem filtro de tenant!
   */
  get rawRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * Retorna o metadata da entidade
   */
  get metadata() {
    return this.repository.metadata;
  }

  /**
   * Acesso ao EntityManager do repositório
   * ⚠️ CUIDADO: Queries sem filtro de tenant!
   */
  get manager() {
    return this.repository.manager;
  }

  /**
   * Preload - Cria uma entidade parcial a partir do banco
   * com filtro automático de tenant
   */
  async preload(entityLike: DeepPartial<T>): Promise<T | undefined> {
    const tenantId = this.getTenantId();
    const entityWithTenant = {
      ...entityLike,
      tenantId,
    } as DeepPartial<T>;
    return this.repository.preload(entityWithTenant);
  }

  /**
   * Remove uma entidade com verificação de tenant
   */
  async remove(entity: T): Promise<T> {
    const tenantId = this.getTenantId();
    // Verifica se a entidade pertence ao tenant atual
    if (entity.tenantId && entity.tenantId !== tenantId) {
      throw new Error('Cannot remove entity from different tenant');
    }
    return this.repository.remove(entity);
  }

  /**
   * Remove múltiplas entidades com verificação de tenant
   */
  async removeMany(entities: T[]): Promise<T[]> {
    const tenantId = this.getTenantId();
    // Verifica se todas as entidades pertencem ao tenant atual
    for (const entity of entities) {
      if (entity.tenantId && entity.tenantId !== tenantId) {
        throw new Error('Cannot remove entity from different tenant');
      }
    }
    return this.repository.remove(entities);
  }
}
