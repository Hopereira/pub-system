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
import { Injectable, Scope } from '@nestjs/common';
import { TenantContextService } from '../tenant-context.service';
import { TenantId } from '../tenant.types';

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
    protected readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Obtém o tenant_id do contexto atual
   * @throws TenantNotSetError se o tenant não estiver definido
   */
  protected getTenantId(): TenantId {
    return this.tenantContext.getTenantId();
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
}
