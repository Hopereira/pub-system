import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Scope,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * TenantLoggingInterceptor - Adiciona tenant_id em todos os logs
 * 
 * Este interceptor enriquece os logs com informações do tenant,
 * facilitando o troubleshooting por cliente em ambientes SaaS.
 * 
 * Formato do log:
 * [tenant:uuid-do-tenant] Mensagem do log
 * 
 * NOTA: Este interceptor NÃO depende de TenantContextService para evitar
 * problemas com Scope.REQUEST quando usado como APP_INTERCEPTOR global.
 * Em vez disso, extrai o tenant diretamente do request.tenant (definido pelo TenantInterceptor).
 */
@Injectable()
export class TenantLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Proteção: Se não tiver request válido, pular logging
    if (!request) {
      return next.handle();
    }
    
    const { method, url, ip } = request;
    const startTime = Date.now();

    // Extrai tenant diretamente do request (definido pelo TenantInterceptor)
    // ou do JWT do usuário autenticado
    const tenantId = request.tenant?.id || request.user?.tenantId || null;
    const tenantName = request.tenant?.nomeFantasia || '';
    const tenantPrefix = tenantId 
      ? `[tenant:${tenantId.substring(0, 8)}]${tenantName ? ` (${tenantName})` : ''}` 
      : '[tenant:public]';

    this.logger?.log?.(
      `${tenantPrefix} 📥 ${method} ${url} | IP: ${ip || 'unknown'}`
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger?.log?.(
            `${tenantPrefix} 📤 ${method} ${url} | ${duration}ms | OK`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger?.error?.(
            `${tenantPrefix} ❌ ${method} ${url} | ${duration}ms | ${error?.message || 'Unknown error'}`
          );
        },
      }),
    );
  }
}
