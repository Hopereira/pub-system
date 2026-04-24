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
import { AlertService } from './alert.service';
import { ObservabilityEvent } from './events';

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
    @Optional() @Inject(AlertService) private readonly alertService?: AlertService,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Reportar ao Sentry (se inicializado)
    if (this.sentry && exception instanceof Error) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();

      // Ignorar erros esperados (4xx + 409 Conflict)
      const ignoredStatuses = [400, 401, 403, 404, 409, 429];
      if (ignoredStatuses.includes(httpStatus)) {
        // Não reportar ao Sentry
      } else {
        try {
          this.sentry.withScope((scope: any) => {
            // Contexto do tenant
            const tenantId =
              request?.tenant?.id ||
              request?.user?.tenantId ||
              request?.headers?.['x-tenant-id'];
            if (tenantId) {
              scope.setTag('tenantId', tenantId);
            }

            // Info do usuário
            if (request?.user) {
              scope.setUser({
                id: request.user.sub || request.user.id,
                email: request.user.email,
              });
              scope.setTag('role', request.user.cargo || request.user.role || 'unknown');
            }

            // RequestId
            const requestId = request?.requestId || request?.headers?.['x-request-id'];
            if (requestId) {
              scope.setTag('requestId', requestId);
            }

            // Contexto da requisição
            scope.setTag('method', request?.method);
            scope.setTag('url', request?.url);
            scope.setTag('statusCode', String(httpStatus));
            scope.setExtra('ip', request?.ip);
            scope.setTag('version', process.env.npm_package_version || '0.0.1');

            // Nível de severidade
            scope.setLevel(httpStatus >= 500 ? 'error' : 'warning');

            this.sentry.captureException(exception);
          });
        } catch (sentryError) {
          this.logger.debug(`Sentry capture failed: ${sentryError.message}`);
        }
      }
    }

    // Record event for alert threshold evaluation
    if (this.alertService && httpStatus >= 500) {
      const request = host.switchToHttp().getRequest();
      this.alertService.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR, {
        status: httpStatus,
        method: request?.method,
        url: request?.url,
        requestId: request?.requestId || request?.headers?.['x-request-id'],
      });
    }

    // Delegar para o filter padrão do NestJS
    super.catch(exception, host);
  }
}
