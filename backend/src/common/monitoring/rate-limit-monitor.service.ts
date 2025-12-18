import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface RateLimitStats {
  totalKeys: number;
  ipBlocks: number;
  userBlocks: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedUsers: Array<{ userId: string; count: number }>;
}

@Injectable()
export class RateLimitMonitorService {
  private readonly logger = new Logger(RateLimitMonitorService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  @Cron(CronExpression.EVERY_HOUR)
  async monitorRateLimits() {
    try {
      const stats = await this.getRateLimitStats();

      if (stats.totalKeys > 0) {
        this.logger.log(`📊 Rate Limit Stats:`);
        this.logger.log(`   Total de chaves ativas: ${stats.totalKeys}`);
        this.logger.log(`   Bloqueios por IP: ${stats.ipBlocks}`);
        this.logger.log(`   Bloqueios por usuário: ${stats.userBlocks}`);

        if (stats.topBlockedIPs.length > 0) {
          this.logger.warn(
            `⚠️ IPs mais bloqueados: ${JSON.stringify(stats.topBlockedIPs)}`,
          );
        }

        if (stats.topBlockedUsers.length > 0) {
          this.logger.warn(
            `⚠️ Usuários mais bloqueados: ${JSON.stringify(stats.topBlockedUsers)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('❌ Erro ao monitorar rate limits:', error);
    }
  }

  async getRateLimitStats(): Promise<RateLimitStats> {
    // Estatísticas simplificadas - cache-manager não expõe keys()
    const stats: RateLimitStats = {
      totalKeys: 0,
      ipBlocks: 0,
      userBlocks: 0,
      topBlockedIPs: [],
      topBlockedUsers: [],
    };

    this.logger.debug('Rate limit monitoring ativo (estatísticas detalhadas requerem acesso direto ao Redis)');

    return stats;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredKeys() {
    this.logger.log('🧹 Limpeza de rate limit executada (gerenciada automaticamente pelo Redis TTL)');
  }
}
