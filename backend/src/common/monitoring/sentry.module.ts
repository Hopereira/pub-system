import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { SentryExceptionFilter } from './sentry-exception.filter';

/**
 * SentryModule — Integração com Sentry para error tracking
 *
 * FEATURE FLAG:
 * - Ativado somente quando SENTRY_DSN está definido no .env
 * - Sem SENTRY_DSN, o módulo não inicializa o SDK (sem impacto)
 *
 * Captura:
 * - Exceções não tratadas (via ExceptionFilter global)
 * - tenantId como tag em cada evento
 * - Usuário (email, id) quando disponível
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SENTRY_INIT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('SentryModule');
        const dsn = configService.get<string>('SENTRY_DSN');

        if (!dsn) {
          logger.log('📊 Sentry desabilitado (SENTRY_DSN não configurado)');
          return null;
        }

        try {
          const Sentry = await import('@sentry/node');
          Sentry.init({
            dsn,
            environment: configService.get<string>('NODE_ENV', 'development'),
            release: `pub-system@${process.env.npm_package_version || '0.0.1'}`,
            tracesSampleRate: configService.get<number>('SENTRY_TRACES_SAMPLE_RATE', 0.1),
            // Não capturar erros esperados (validação, auth)
            beforeSend(event, hint) {
              const error = hint?.originalException;
              if (error instanceof Error) {
                // Ignorar erros de validação e autenticação
                const ignoredPatterns = [
                  'UnauthorizedException',
                  'ForbiddenException',
                  'BadRequestException',
                  'NotFoundException',
                  'ThrottlerException',
                ];
                if (ignoredPatterns.some(p => error.constructor?.name === p)) {
                  return null;
                }
              }
              return event;
            },
          });

          logger.log(`🔍 Sentry inicializado (env: ${configService.get('NODE_ENV')})`);
          return Sentry;
        } catch (err) {
          logger.warn(`⚠️ Falha ao inicializar Sentry: ${err.message}`);
          return null;
        }
      },
    },
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
  exports: ['SENTRY_INIT'],
})
export class SentryModule {}
