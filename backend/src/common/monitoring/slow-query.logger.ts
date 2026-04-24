import { Logger as TypeOrmLogger } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * SlowQueryLogger — TypeORM custom logger that auto-logs queries > threshold
 *
 * Integrates with TypeORM logging system to capture:
 * - Slow queries (> SLOW_QUERY_THRESHOLD_MS, default 200ms)
 * - Failed queries (always logged)
 * - Query errors (always logged)
 *
 * Does NOT block or alter query execution.
 *
 * ROLLBACK: Set DB_LOGGING=false to disable, or remove from TypeORM config
 */
export class SlowQueryLogger implements TypeOrmLogger {
  private readonly logger = new Logger('SlowQueryLogger');
  private readonly thresholdMs: number;

  // Metrics counters
  private totalQueries = 0;
  private slowQueries = 0;
  private failedQueries = 0;
  private totalDurationMs = 0;

  constructor(thresholdMs?: number) {
    this.thresholdMs = thresholdMs || parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '200');
  }

  logQuery(query: string, parameters?: any[]): void {
    this.totalQueries++;
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]): void {
    this.failedQueries++;
    const errorMsg = error instanceof Error ? error.message : error;
    this.logger.error(
      `❌ QUERY ERROR: ${errorMsg}`,
      JSON.stringify({
        query: this.truncateQuery(query),
        parameters: this.sanitizeParams(parameters),
        timestamp: new Date().toISOString(),
      }),
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]): void {
    this.slowQueries++;
    this.totalDurationMs += time;
    this.logger.warn(
      `🐢 SLOW QUERY (${time}ms > ${this.thresholdMs}ms): ${this.truncateQuery(query)}`,
    );
    this.logger.warn(
      JSON.stringify({
        event: 'SLOW_QUERY',
        durationMs: time,
        threshold: this.thresholdMs,
        query: this.truncateQuery(query),
        parameters: this.sanitizeParams(parameters),
        timestamp: new Date().toISOString(),
        suggestion: this.suggestIndex(query),
      }),
    );
  }

  logSchemaBuild(message: string): void {
    this.logger.debug(`Schema: ${message}`);
  }

  logMigration(message: string): void {
    this.logger.log(`Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any): void {
    switch (level) {
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        this.logger.debug(message);
    }
  }

  /**
   * Returns metrics snapshot for /internal/status
   */
  getMetrics(): {
    totalQueries: number;
    slowQueries: number;
    failedQueries: number;
    avgDurationMs: number;
    slowQueryPercent: string;
  } {
    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      failedQueries: this.failedQueries,
      avgDurationMs: this.slowQueries > 0 ? Math.round(this.totalDurationMs / this.slowQueries) : 0,
      slowQueryPercent: this.totalQueries > 0
        ? ((this.slowQueries / this.totalQueries) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Resets counters (called periodically or after snapshot)
   */
  resetMetrics(): void {
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.failedQueries = 0;
    this.totalDurationMs = 0;
  }

  private truncateQuery(query: string): string {
    return query.length > 500 ? query.substring(0, 500) + '...' : query;
  }

  private sanitizeParams(params?: any[]): any[] | undefined {
    if (!params) return undefined;
    return params.map((p) => {
      if (typeof p === 'string' && p.length > 100) return p.substring(0, 100) + '...';
      return p;
    });
  }

  private suggestIndex(query: string): string | null {
    const upper = query.toUpperCase();
    // Simple heuristic: WHERE clause with tenant_id and another column
    if (upper.includes('WHERE') && upper.includes('TENANT_ID')) {
      const match = query.match(/WHERE.*?(\w+)\s*=\s*\$/i);
      if (match && match[1].toLowerCase() !== 'tenant_id') {
        return `Consider composite index on (tenant_id, ${match[1]})`;
      }
    }
    if (upper.includes('ORDER BY') && !upper.includes('LIMIT')) {
      return 'Consider adding LIMIT or index on ORDER BY column';
    }
    return null;
  }
}

/**
 * Singleton instance for metrics access across modules
 */
let _instance: SlowQueryLogger | null = null;

export function getSlowQueryLogger(): SlowQueryLogger {
  if (!_instance) {
    _instance = new SlowQueryLogger();
  }
  return _instance;
}
