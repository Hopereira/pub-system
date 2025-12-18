import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantContextService } from './tenant-context.service';

/**
 * TenantLoggingInterceptor - Adiciona tenant_id em todos os logs
 * 
 * Este interceptor enriquece os logs com informações do tenant,
 * facilitando o troubleshooting por cliente em ambientes SaaS.
 * 
 * Formato do log:
 * [tenant:uuid-do-tenant] Mensagem do log
 */
@Injectable()
export class TenantLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const startTime = Date.now();

    // Obtém tenant_id de forma segura (pode não estar definido em rotas públicas)
    const tenantId = this.tenantContext.getTenantIdOrNull();
    const tenantPrefix = tenantId ? `[tenant:${tenantId}]` : '[tenant:public]';

    this.logger.log(
      `${tenantPrefix} 📥 ${method} ${url} | IP: ${ip}`
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${tenantPrefix} 📤 ${method} ${url} | ${duration}ms | OK`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${tenantPrefix} ❌ ${method} ${url} | ${duration}ms | ${error.message}`
          );
        },
      }),
    );
  }
}
