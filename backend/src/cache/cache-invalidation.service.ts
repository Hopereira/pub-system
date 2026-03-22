// Caminho: backend/src/cache/cache-invalidation.service.ts

import { Injectable, Inject, Logger, Optional, Scope } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { TenantContextService } from '../common/tenant/tenant-context.service';

/**
 * CacheInvalidationService - Serviço de invalidação de cache com suporte a multi-tenancy
 * 
 * IMPORTANTE: Todas as chaves de cache DEVEM incluir o tenantId para evitar
 * vazamento de dados entre diferentes bares/empresas.
 * 
 * Formato das chaves: {entidade}:{tenantId}:{parametros}
 * Exemplo: produtos:550e8400-e29b-41d4-a716-446655440000:page:1:limit:20
 */
@Injectable({ scope: Scope.REQUEST })
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
  ) {}

  /**
   * Obtém o tenantId do contexto atual
   * Tenta múltiplas fontes: TenantContextService, request.tenant, request.user
   */
  private getTenantId(): string | null {
    // 1. Tentar do TenantContextService
    try {
      if (this.tenantContext?.hasTenant?.()) {
        return this.tenantContext.getTenantId();
      }
    } catch {
      // Ignorar e tentar próxima fonte
    }

    // 2. Tentar do request.tenant
    if (this.request?.tenant?.id) {
      return this.request.tenant.id;
    }

    // 3. Tentar do request.user
    const userTenantId = this.request?.user?.tenantId;
    if (userTenantId) {
      return userTenantId;
    }

    // 4. Tentar do request.headers
    const headerTenantId = this.request?.headers?.['x-tenant-id'];
    if (headerTenantId) {
      return headerTenantId;
    }

    return null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   * @param entity - Nome da entidade (produtos, comandas, etc)
   * @param params - Parâmetros adicionais da chave
   * @param tenantId - TenantId opcional (usa o do contexto se não fornecido)
   */
  generateCacheKey(entity: string, params: string, tenantId?: string): string | null {
    const effectiveTenantId = tenantId || this.getTenantId();
    if (!effectiveTenantId) {
      this.logger.warn(`⚠️ Cache key rejected: no tenant for ${entity}:${params}`);
      return null;
    }
    return `${entity}:${effectiveTenantId}:${params}`;
  }

  /**
   * Invalida todas as chaves que correspondem a um padrão
   * @param pattern - Padrão de chave (ex: 'produtos:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const stores = (this.cacheManager as any).stores;
      const store = stores?.[0] || (this.cacheManager as any).store;
      
      // Obter todas as chaves que correspondem ao padrão
      const keys = typeof store?.keys === 'function' ? await store.keys(pattern) : [];
      
      if (!keys || keys.length === 0) {
        this.logger.debug(`🔍 Nenhuma chave encontrada para o padrão: ${pattern}`);
        return 0;
      }

      // Deletar todas as chaves encontradas
      let deletedCount = 0;
      for (const key of keys) {
        await this.cacheManager.del(key);
        this.logger.debug(`🗑️ Cache invalidado: ${key}`);
        deletedCount++;
      }

      this.logger.log(`✅ Total de chaves invalidadas (${pattern}): ${deletedCount}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`❌ Erro ao invalidar padrão ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalida cache de produtos do tenant atual
   * Usado quando produtos são criados, atualizados ou deletados
   */
  async invalidateProdutos(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Não é possível invalidar cache de produtos sem tenant');
      return;
    }
    this.logger.log(`🔄 Invalidando cache de produtos do tenant ${tenantId}...`);
    await this.invalidatePattern(`produtos:${tenantId}:*`);
  }

  /**
   * Invalida cache de comandas e mesas do tenant atual
   * Usado quando comandas são criadas, atualizadas ou fechadas
   * Mesas dependem de comandas (status OCUPADA/LIVRE)
   */
  async invalidateComandas(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Não é possível invalidar cache de comandas sem tenant');
      return;
    }
    this.logger.log(`🔄 Invalidando cache de comandas e mesas do tenant ${tenantId}...`);
    await this.invalidatePattern(`comandas:${tenantId}:*`);
    await this.invalidatePattern(`mesas:${tenantId}:*`);
  }

  /**
   * Invalida cache de pedidos do tenant atual
   * Usado quando pedidos são criados ou status é atualizado
   */
  async invalidatePedidos(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Não é possível invalidar cache de pedidos sem tenant');
      return;
    }
    this.logger.log(`🔄 Invalidando cache de pedidos do tenant ${tenantId}...`);
    await this.invalidatePattern(`pedidos:${tenantId}:*`);
  }

  /**
   * Invalida cache de ambientes e produtos do tenant atual
   * Produtos dependem de ambientes
   */
  async invalidateAmbientes(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Não é possível invalidar cache de ambientes sem tenant');
      return;
    }
    this.logger.log(`🔄 Invalidando cache de ambientes e produtos do tenant ${tenantId}...`);
    await this.invalidatePattern(`ambientes:${tenantId}:*`);
    await this.invalidatePattern(`produtos:${tenantId}:*`);
  }

  /**
   * Invalida cache de mesas do tenant atual
   * Usado quando mesas são criadas, atualizadas ou deletadas
   */
  async invalidateMesas(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Não é possível invalidar cache de mesas sem tenant');
      return;
    }
    this.logger.log(`🔄 Invalidando cache de mesas do tenant ${tenantId}...`);
    await this.invalidatePattern(`mesas:${tenantId}:*`);
  }

  /**
   * Invalida cache de um tenant específico (usado pelo Super Admin)
   * @param tenantId - ID do tenant a invalidar
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    this.logger.log(`🔄 Invalidando TODO o cache do tenant ${tenantId}...`);
    await this.invalidatePattern(`*:${tenantId}:*`);
  }

  /**
   * Invalida múltiplos padrões de uma vez
   * @param patterns - Array de padrões a serem invalidados
   */
  async invalidateMultiple(patterns: string[]): Promise<void> {
    this.logger.log(`🔄 Invalidando múltiplos padrões: ${patterns.join(', ')}`);
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  /**
   * Limpa todo o cache (usar com cuidado!)
   */
  async clearAll(): Promise<void> {
    this.logger.warn('⚠️ LIMPANDO TODO O CACHE!');
    const stores = (this.cacheManager as any).stores;
    const store = stores?.[0] || (this.cacheManager as any).store;
    if (typeof store?.clear === 'function') {
      await store.clear();
    }
    this.logger.log('✅ Cache completamente limpo');
  }
}
