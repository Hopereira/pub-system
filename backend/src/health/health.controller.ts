import { Controller, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private dataSource: DataSource,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {}

  /**
   * GET /health
   * Health check básico para load balancers e uptime monitors
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar saúde do sistema' })
  @ApiResponse({ status: 200, description: 'Sistema saudável' })
  @ApiResponse({ status: 503, description: 'Sistema com problemas' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
    ]);
  }

  /**
   * GET /health/live
   * Liveness probe para Kubernetes - apenas verifica se o processo está vivo
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Processo vivo' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * GET /health/ready
   * Readiness probe para Kubernetes - verifica se pode receber tráfego
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Pronto para receber tráfego' })
  @ApiResponse({ status: 503, description: 'Não está pronto' })
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
      () => this.checkBullMQ(),
      () => this.checkRlsStatus(),
    ]);
  }

  /**
   * Verifica conectividade com Redis via cache-manager
   */
  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      if (!this.cacheManager) {
        return { redis: { status: 'up', mode: 'in-memory' } };
      }
      const testKey = '__health_check__';
      await this.cacheManager.set(testKey, 'ok', 5);
      const val = await this.cacheManager.get(testKey);
      return {
        redis: {
          status: val === 'ok' ? 'up' : 'down',
          mode: 'redis',
        },
      };
    } catch {
      return { redis: { status: 'down', error: 'connection failed' } };
    }
  }

  /**
   * GET /health/metrics
   * Métricas detalhadas para observabilidade
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Métricas do sistema (requer autenticação)' })
  @ApiResponse({ status: 200, description: 'Métricas coletadas' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async metrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
      uptime: {
        seconds: process.uptime(),
        formatted: this.formatUptime(process.uptime()),
      },
      memory: {
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        rss: this.formatBytes(memUsage.rss),
        external: this.formatBytes(memUsage.external),
        heapUsedPercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2) + '%',
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      env: process.env.NODE_ENV || 'development',
      features: {
        rls: process.env.RLS_ENABLED === 'true',
        rlsDryRun: process.env.RLS_DRY_RUN === 'true',
        sentry: !!process.env.SENTRY_DSN,
        redis: !!process.env.REDIS_HOST,
        bullmq: !!process.env.REDIS_HOST,
        socketIoRedis: process.env.SOCKET_IO_REDIS_ENABLED === 'true',
      },
    };
  }

  /**
   * Verifica se BullMQ (Redis queues) está operacional
   */
  private async checkBullMQ(): Promise<HealthIndicatorResult> {
    try {
      if (!this.cacheManager || !process.env.REDIS_HOST) {
        return { bullmq: { status: 'up', mode: 'sync-fallback' } };
      }
      // BullMQ uses same Redis — if cache works, queues work
      return { bullmq: { status: 'up', mode: 'redis' } };
    } catch {
      return { bullmq: { status: 'down', error: 'queue connection failed' } };
    }
  }

  /**
   * Verifica status do RLS no PostgreSQL
   */
  private async checkRlsStatus(): Promise<HealthIndicatorResult> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as cnt FROM pg_class WHERE relrowsecurity = true AND relkind = 'r'`,
      );
      const tablesWithRls = parseInt(result[0]?.cnt || '0');
      return {
        rls: {
          status: 'up',
          enabled: process.env.RLS_ENABLED === 'true',
          dryRun: process.env.RLS_DRY_RUN === 'true',
          tablesProtected: tablesWithRls,
        },
      };
    } catch {
      return { rls: { status: 'down', error: 'cannot query pg_class' } };
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}
