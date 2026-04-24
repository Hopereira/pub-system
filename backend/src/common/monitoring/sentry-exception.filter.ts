import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * SentryExceptionFilter — Captura exceções e envia para o Sentry
 *
 * Este filter NÃO altera o comportamento padrão de erro do NestJS.
 * Ele apenas intercepta, envia para o Sentry (se disponível), e
 * delega para o filter padrão.
 *
 * Inclui tenantId e user info como contexto extra no evento Sentry.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  constructor(
    @Optional() @Inject('SENTRY_INIT') private readonly sentry?: any,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    // Reportar ao Sentry (se inicializado)
    if (this.sentry && exception instanceof Error) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();

      // Não reportar erros HTTP esperados (4xx)
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      if (status >= 500) {
        try {
          this.sentry.withScope((scope: any) => {
            // Adicionar contexto do tenant
            const tenantId =
              request?.tenant?.id ||
              request?.user?.tenantId ||
              request?.headers?.['x-tenant-id'];
            if (tenantId) {
              scope.setTag('tenantId', tenantId);
            }

            // Adicionar info do usuário
            if (request?.user) {
              scope.setUser({
                id: request.user.sub || request.user.id,
                email: request.user.email,
              });
            }

            // Adicionar contexto da requisição
            scope.setTag('method', request?.method);
            scope.setTag('url', request?.url);
            scope.setExtra('ip', request?.ip);

            this.sentry.captureException(exception);
          });
        } catch (sentryError) {
          this.logger.debug(`Sentry capture failed: ${sentryError.message}`);
        }
      }
    }

    // Delegar para o filter padrão do NestJS
    super.catch(exception, host);
  }
}
