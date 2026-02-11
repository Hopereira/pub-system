// Caminho: backend/src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const user = request.user?.email || 'Público';

    // Request ID correlation — aceita do client ou gera novo
    const requestId = (headers['x-request-id'] as string) || randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();

    this.logger.log(
      `📥 ENTRADA: ${method} ${url} | Usuário: ${user} | IP: ${ip} | rid:${requestId}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.log(
            `📤 SAÍDA: ${method} ${url} | Status: ${statusCode} | Tempo: ${responseTime}ms | rid:${requestId}`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `❌ ERRO: ${method} ${url} | ${error.message} | Tempo: ${responseTime}ms | rid:${requestId}`,
          );
        },
      }),
    );
  }
}
