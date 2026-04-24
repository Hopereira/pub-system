import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Metadata estruturada para logs.
 * Qualquer service pode passar tenantId, module, dados extras.
 */
export interface LogMeta {
  tenantId?: string;
  module?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = process.env.LOG_DIR || 'logs';
    const isProd = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'pub-system' },
      transports: [
        // Console (desenvolvimento: colorido; produção: JSON)
        new winston.transports.Console({
          format: isProd
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, tenantId, ...meta }) => {
                  const ctx = context ? `[${context}]` : '';
                  const tenant = tenantId ? `[tenant:${String(tenantId).substring(0, 8)}]` : '';
                  const { service, ...rest } = meta;
                  const metaStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
                  return `${timestamp} ${level} ${tenant}${ctx} ${message}${metaStr}`;
                }),
              ),
        }),
        // Arquivo rotativo - todos os logs (JSON estruturado)
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/app-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.json(),
        }),
        // Arquivo rotativo - apenas erros (JSON estruturado)
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.json(),
        }),
      ],
    });
  }

  log(message: string, context?: string | LogMeta) {
    this.logger.info(message, this.normalizeMeta(context));
  }

  error(message: string, trace?: string, context?: string | LogMeta) {
    const meta = this.normalizeMeta(context);
    this.logger.error(message, { ...meta, trace });
  }

  warn(message: string, context?: string | LogMeta) {
    this.logger.warn(message, this.normalizeMeta(context));
  }

  debug(message: string, context?: string | LogMeta) {
    this.logger.debug(message, this.normalizeMeta(context));
  }

  verbose(message: string, context?: string | LogMeta) {
    this.logger.verbose(message, this.normalizeMeta(context));
  }

  // Método para logs críticos com notificação
  critical(message: string, error?: Error, context?: string | LogMeta) {
    const meta = this.normalizeMeta(context);
    this.logger.error(message, {
      ...meta,
      critical: true,
      error: error?.message,
      stack: error?.stack,
    });

    // Aqui pode integrar com serviço de notificação
    this.notifyCriticalError(message, error);
  }

  /**
   * Normaliza o parâmetro context: aceita string (NestJS padrão) ou LogMeta.
   */
  private normalizeMeta(context?: string | LogMeta): Record<string, any> {
    if (!context) return {};
    if (typeof context === 'string') return { context };
    return context;
  }

  private notifyCriticalError(message: string, error?: Error) {
    // Webhook para notificação (Slack, Discord, Email, etc)
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ERRO CRÍTICO - PUB System\n${message}\n${error?.message || ''}`,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silenciar erro de notificação
      });
    }
  }
}
