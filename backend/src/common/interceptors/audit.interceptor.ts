import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modulos/audit/audit.service';
import {
  AUDIT_METADATA_KEY,
  AuditMetadata,
} from '../decorators/auditable.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, ip, headers, method, url, body } = request;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log({
            funcionario: user,
            funcionarioEmail: user?.email,
            action: auditMetadata.action,
            entityName: auditMetadata.entityName,
            entityId: response?.id || body?.id,
            newData: this.sanitizeData(response),
            ipAddress: ip,
            userAgent: headers['user-agent'],
            endpoint: url,
            method,
            description: auditMetadata.description,
          });
        } catch (error) {
          this.logger.error('❌ Erro ao registrar auditoria:', error);
        }
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return null;

    const sanitized = { ...data };

    const sensitiveFields = ['senha', 'password', 'token', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
