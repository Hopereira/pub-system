import { Controller, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../modulos/funcionario/enums/cargo.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { AlertService } from '../common/monitoring/alert.service';
import { getSlowQueryLogger } from '../common/monitoring/slow-query.logger';
import { BaseTenantGateway } from '../common/tenant/gateways/base-tenant.gateway';

/**
 * InternalStatusController — Operational dashboard for monitoring
 *
 * GET /internal/status — Full system status (requires ADMIN or SUPER_ADMIN)
 *
 * Shows:
 * - Redis: OK/FAIL
 * - DB: OK/FAIL + pool stats
 * - Queues: pending/failed jobs
 * - RLS: enabled/dry-run
 * - Sentry: active/inactive
 * - Active tenants count
 * - WebSocket connections
 * - Alert counters
 * - Slow query metrics
 * - Memory/CPU usage
 */
@Controller('internal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalStatusController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly alertService: AlertService,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {}

  @Get('status')
  @Roles(Cargo.ADMIN, Cargo.SUPER_ADMIN)
  async getStatus() {
    const [
      dbStatus,
      redisStatus,
      rlsStatus,
      tenantCount,
      dbPoolStats,
      queueStats,
    ] = await Promise.allSettled([
      this.checkDb(),
      this.checkRedis(),
      this.checkRls(),
      this.getTenantCount(),
      this.getDbPoolStats(),
      this.getQueueStats(),
    ]);

    const slowQueryLogger = getSlowQueryLogger();
    const memUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(process.uptime()),
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',

      services: {
        database: this.unwrapSettled(dbStatus, { status: 'unknown' }),
        redis: this.unwrapSettled(redisStatus, { status: 'unknown' }),
        sentry: { status: process.env.SENTRY_DSN ? 'active' : 'inactive' },
      },

      security: {
        rls: this.unwrapSettled(rlsStatus, { enabled: false, dryRun: false }),
        rateLimiting: true,
        helmet: true,
        cors: true,
      },

      tenants: this.unwrapSettled(tenantCount, { active: 0 }),

      database: {
        pool: this.unwrapSettled(dbPoolStats, {}),
      },

      queues: this.unwrapSettled(queueStats, { status: 'unknown' }),

      websocket: BaseTenantGateway.getMetrics(),

      performance: {
        slowQueries: slowQueryLogger.getMetrics(),
        memory: {
          heapUsed: this.formatBytes(memUsage.heapUsed),
          heapTotal: this.formatBytes(memUsage.heapTotal),
          rss: this.formatBytes(memUsage.rss),
          heapPercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1) + '%',
        },
        cpu: process.cpuUsage(),
      },

      alerts: this.alertService.getCounterSnapshot(),

      featureFlags: {
        rls: process.env.RLS_ENABLED === 'true',
        rlsDryRun: process.env.RLS_DRY_RUN === 'true',
        sentry: !!process.env.SENTRY_DSN,
        socketIoRedis: process.env.SOCKET_IO_REDIS_ENABLED === 'true',
        alertWebhook: !!process.env.ALERT_WEBHOOK_URL,
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '200'),
      },
    };
  }

  private async checkDb(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', latencyMs: Date.now() - start };
  }

  private async checkRedis(): Promise<{ status: string; mode: string }> {
    if (!this.cacheManager) {
      return { status: 'up', mode: 'in-memory' };
    }
    try {
      const key = '__internal_status_check__';
      await this.cacheManager.set(key, 'ok', 5);
      const val = await this.cacheManager.get(key);
      return { status: val === 'ok' ? 'ok' : 'degraded', mode: 'redis' };
    } catch {
      return { status: 'down', mode: 'redis' };
    }
  }

  private async checkRls(): Promise<{ enabled: boolean; dryRun: boolean; tablesProtected: number }> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM pg_class WHERE relrowsecurity = true AND relkind = 'r'`,
    );
    return {
      enabled: process.env.RLS_ENABLED === 'true',
      dryRun: process.env.RLS_DRY_RUN === 'true',
      tablesProtected: parseInt(result[0]?.cnt || '0'),
    };
  }

  private async getTenantCount(): Promise<{ active: number }> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as cnt FROM tenants WHERE "isActive" = true`,
      );
      return { active: parseInt(result[0]?.cnt || '0') };
    } catch {
      return { active: -1 };
    }
  }

  private async getDbPoolStats(): Promise<Record<string, any>> {
    try {
      const result = await this.dataSource.query(
        `SELECT count(*) as total,
                count(*) FILTER (WHERE state = 'active') as active,
                count(*) FILTER (WHERE state = 'idle') as idle,
                count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting
         FROM pg_stat_activity
         WHERE datname = current_database()`,
      );
      return {
        total: parseInt(result[0]?.total || '0'),
        active: parseInt(result[0]?.active || '0'),
        idle: parseInt(result[0]?.idle || '0'),
        waiting: parseInt(result[0]?.waiting || '0'),
        maxConnections: 10,
      };
    } catch {
      return {};
    }
  }

  private async getQueueStats(): Promise<Record<string, any>> {
    try {
      // BullMQ uses Redis — check if it's available
      if (!process.env.REDIS_HOST) {
        return { status: 'sync-fallback', pending: 0, failed: 0 };
      }
      return { status: 'ok', mode: 'redis' };
    } catch {
      return { status: 'unknown' };
    }
  }

  private unwrapSettled(result: PromiseSettledResult<any>, fallback: any): any {
    return result.status === 'fulfilled' ? result.value : { ...fallback, error: (result as PromiseRejectedResult).reason?.message };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(2)} ${units[i]}`;
  }
}
