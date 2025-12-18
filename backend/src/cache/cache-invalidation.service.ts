// Caminho: backend/src/cache/cache-invalidation.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Invalida todas as chaves que correspondem a um padrão
   * @param pattern - Padrão de chave (ex: 'produtos:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const store = this.cacheManager.store as any;
      
      // Obter todas as chaves que correspondem ao padrão
      const keys = await store.keys(pattern);
      
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
   * Invalida cache de produtos
   * Usado quando produtos são criados, atualizados ou deletados
   */
  async invalidateProdutos(): Promise<void> {
    this.logger.log('🔄 Invalidando cache de produtos...');
    await this.invalidatePattern('produtos:*');
  }

  /**
   * Invalida cache de comandas e mesas
   * Usado quando comandas são criadas, atualizadas ou fechadas
   * Mesas dependem de comandas (status OCUPADA/LIVRE)
   */
  async invalidateComandas(): Promise<void> {
    this.logger.log('🔄 Invalidando cache de comandas e mesas...');
    await this.invalidatePattern('comandas:*');
    await this.invalidatePattern('mesas:*');
  }

  /**
   * Invalida cache de pedidos
   * Usado quando pedidos são criados ou status é atualizado
   */
  async invalidatePedidos(): Promise<void> {
    this.logger.log('🔄 Invalidando cache de pedidos...');
    await this.invalidatePattern('pedidos:*');
  }

  /**
   * Invalida cache de ambientes e produtos
   * Produtos dependem de ambientes
   */
  async invalidateAmbientes(): Promise<void> {
    this.logger.log('🔄 Invalidando cache de ambientes e produtos...');
    await this.invalidatePattern('ambientes:*');
    await this.invalidatePattern('produtos:*'); // Produtos dependem de ambientes
  }

  /**
   * Invalida cache de mesas
   * Usado quando mesas são criadas, atualizadas ou deletadas
   */
  async invalidateMesas(): Promise<void> {
    this.logger.log('🔄 Invalidando cache de mesas...');
    await this.invalidatePattern('mesas:*');
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
    await this.cacheManager.reset();
    this.logger.log('✅ Cache completamente limpo');
  }
}
