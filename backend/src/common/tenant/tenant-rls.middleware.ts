import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * RLS Risk reasons — catálogo de eventos de risco
 */
export enum RlsRiskReason {
  TENANT_CONTEXT_MISSING = 'TENANT_CONTEXT_MISSING',
  TENANT_MISMATCH = 'TENANT_MISMATCH',
  RLS_SESSION_NOT_SET = 'RLS_SESSION_NOT_SET',
  SUPER_ADMIN_BYPASS = 'SUPER_ADMIN_BYPASS',
  PUBLIC_ROUTE_ACCESS = 'PUBLIC_ROUTE_ACCESS',
}

export interface RlsRiskEvent {
  reason: RlsRiskReason;
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  method: string;
  url: string;
  requestId: string | null;
  timestamp: string;
}

/**
 * TenantRlsMiddleware — Seta app.current_tenant_id no PostgreSQL
 * para cada requisição HTTP.
 *
 * MODOS:
 * - RLS_ENABLED=false, RLS_DRY_RUN=false → nada acontece (Fase 0)
 * - RLS_ENABLED=false, RLS_DRY_RUN=true  → loga riscos sem bloquear (Fase 1)
 * - RLS_ENABLED=true                     → seta variável no PG (Fase 2/3)
 *
 * ROLLBACK: Setar RLS_ENABLED=false + restart
 */
@Injectable()
export class TenantRlsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantRlsMiddleware.name);
  private readonly rlsEnabled: boolean;
  private readonly rlsDryRun: boolean;

  // Rotas que não precisam de tenant context
  private readonly publicRoutes = [
    '/health',
    '/auth/login',
    '/auth/refresh',
    '/public/',
    '/setup',
    '/api-docs',
  ];

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.rlsEnabled = this.configService.get<string>('RLS_ENABLED') === 'true';
    this.rlsDryRun = this.configService.get<string>('RLS_DRY_RUN') === 'true';

    if (this.rlsEnabled) {
      this.logger.log('🔒 RLS middleware ATIVO — PostgreSQL Row Level Security habilitado');
    } else if (this.rlsDryRun) {
      this.logger.log('🔍 RLS middleware DRY-RUN — auditando sem bloquear');
    }
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // Fase 0: totalmente desabilitado
    if (!this.rlsEnabled && !this.rlsDryRun) {
      return next();
    }

    const tenantId =
      (req as any).tenant?.id ||
      (req as any).user?.tenantId ||
      req.headers['x-tenant-id'] as string ||
      null;

    const userId = (req as any).user?.sub || (req as any).user?.id || null;
    const role = (req as any).user?.cargo || (req as any).user?.role || null;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const requestId = (req as any).requestId || req.headers['x-request-id'] as string || null;
    const isPublicRoute = this.publicRoutes.some(r => req.url.startsWith(r));

    // --- DRY-RUN: Auditar riscos sem bloquear ---
    if (this.rlsDryRun && !this.rlsEnabled) {
      if (isSuperAdmin) {
        this.logRlsRisk({
          reason: RlsRiskReason.SUPER_ADMIN_BYPASS,
          tenantId, userId, role,
          method: req.method, url: req.url, requestId,
          timestamp: new Date().toISOString(),
        });
      } else if (isPublicRoute) {
        this.logRlsRisk({
          reason: RlsRiskReason.PUBLIC_ROUTE_ACCESS,
          tenantId, userId, role,
          method: req.method, url: req.url, requestId,
          timestamp: new Date().toISOString(),
        });
      } else if (!tenantId && !isPublicRoute) {
        this.logRlsRisk({
          reason: RlsRiskReason.TENANT_CONTEXT_MISSING,
          tenantId, userId, role,
          method: req.method, url: req.url, requestId,
          timestamp: new Date().toISOString(),
        });
      }
      return next();
    }

    // --- RLS ATIVO: Setar variável no PostgreSQL ---
    if (this.rlsEnabled) {
      if (tenantId) {
        try {
          await this.dataSource.query(
            `SELECT set_config('app.current_tenant_id', $1, false)`,
            [tenantId],
          );
        } catch (error) {
          this.logRlsRisk({
            reason: RlsRiskReason.RLS_SESSION_NOT_SET,
            tenantId, userId, role,
            method: req.method, url: req.url, requestId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Limpar variável (SUPER_ADMIN / público)
        try {
          await this.dataSource.query(
            `SELECT set_config('app.current_tenant_id', '', false)`,
          );
        } catch {
          // Silenciar
        }

        if (isSuperAdmin) {
          this.logRlsRisk({
            reason: RlsRiskReason.SUPER_ADMIN_BYPASS,
            tenantId, userId, role,
            method: req.method, url: req.url, requestId,
            timestamp: new Date().toISOString(),
          });
        } else if (!isPublicRoute) {
          this.logRlsRisk({
            reason: RlsRiskReason.TENANT_CONTEXT_MISSING,
            tenantId, userId, role,
            method: req.method, url: req.url, requestId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    next();
  }

  /**
   * Log estruturado de risco RLS — JSON puro para parsing externo
   */
  private logRlsRisk(event: RlsRiskEvent): void {
    const severity = event.reason === RlsRiskReason.TENANT_CONTEXT_MISSING
      ? 'warn'
      : 'debug';

    const msg = `[RLS_RISK] ${event.reason} | ${event.method} ${event.url}`;

    if (severity === 'warn') {
      this.logger.warn(msg, JSON.stringify(event));
    } else {
      this.logger.debug(msg, JSON.stringify(event));
    }
  }
}
