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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const user = request.user?.email || 'Público';

    const startTime = Date.now();

    this.logger.log(
      `📥 ENTRADA: ${method} ${url} | Usuário: ${user} | IP: ${ip}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.log(
            `📤 SAÍDA: ${method} ${url} | Status: ${statusCode} | Tempo: ${responseTime}ms`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `❌ ERRO: ${method} ${url} | ${error.message} | Tempo: ${responseTime}ms`,
          );
        },
      }),
    );
  }
}
