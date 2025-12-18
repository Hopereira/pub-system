import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

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

  constructor(@InjectRedis() private readonly redis: Redis) {}

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
    const keys = await this.redis.keys('throttle:*');

    const stats: RateLimitStats = {
      totalKeys: keys.length,
      ipBlocks: 0,
      userBlocks: 0,
      topBlockedIPs: [],
      topBlockedUsers: [],
    };

    const ipCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();

    for (const key of keys) {
      if (key.includes(':ip:')) {
        stats.ipBlocks++;
        const ip = key.split(':ip:')[1]?.split(':')[0];
        if (ip) {
          ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
        }
      } else if (key.includes(':user:')) {
        stats.userBlocks++;
        const userId = key.split(':user:')[1]?.split(':')[0];
        if (userId) {
          userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
        }
      }
    }

    // Top 5 IPs bloqueados
    stats.topBlockedIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    // Top 5 usuários bloqueados
    stats.topBlockedUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, count }));

    return stats;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredKeys() {
    try {
      const keys = await this.redis.keys('throttle:*');
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Chave sem TTL (não deveria acontecer)
          await this.redis.del(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.log(`🧹 ${cleaned} chaves de rate limit sem TTL removidas`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao limpar chaves de rate limit:', error);
    }
  }
}
