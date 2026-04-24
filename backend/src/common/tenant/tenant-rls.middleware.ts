import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * TenantRlsMiddleware — Seta app.current_tenant_id no PostgreSQL
 * para cada requisição HTTP.
 *
 * Este middleware é executado APÓS o TenantInterceptor (que resolve o tenant)
 * e ANTES dos controllers. Ele garante que o PostgreSQL RLS filtre
 * as queries corretamente.
 *
 * FEATURE FLAG:
 * - Ativado somente quando RLS_ENABLED=true no .env
 * - Sem a flag, o middleware não faz nada (compatível com rollback)
 *
 * FLUXO:
 * 1. Extrai tenantId do request (setado pelo TenantInterceptor/JWT)
 * 2. Executa SET LOCAL app.current_tenant_id = 'uuid' na conexão
 * 3. Continua pipeline normalmente
 */
@Injectable()
export class TenantRlsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantRlsMiddleware.name);
  private readonly rlsEnabled: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.rlsEnabled = this.configService.get<string>('RLS_ENABLED') === 'true';
    if (this.rlsEnabled) {
      this.logger.log('🔒 RLS middleware ativo — PostgreSQL Row Level Security habilitado');
    }
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (!this.rlsEnabled) {
      return next();
    }

    // Extrair tenantId de múltiplas fontes
    const tenantId =
      (req as any).tenant?.id ||
      (req as any).user?.tenantId ||
      req.headers['x-tenant-id'] as string ||
      null;

    if (tenantId) {
      try {
        // SET SESSION para que a variável persista durante toda a requisição
        // (SET LOCAL só persiste dentro de uma transação)
        await this.dataSource.query(
          `SELECT set_config('app.current_tenant_id', $1, false)`,
          [tenantId],
        );
      } catch (error) {
        this.logger.debug(
          `RLS middleware: falha ao setar tenant context (non-blocking): ${error.message}`,
        );
      }
    } else {
      // Limpar variável para requisições sem tenant (SUPER_ADMIN, público)
      try {
        await this.dataSource.query(
          `SELECT set_config('app.current_tenant_id', '', false)`,
        );
      } catch {
        // Silenciar
      }
    }

    next();
  }
}
