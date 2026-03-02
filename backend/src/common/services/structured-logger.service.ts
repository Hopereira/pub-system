import { Injectable, LoggerService, Scope } from '@nestjs/common';

/**
 * StructuredLoggerService - Logs estruturados para observabilidade SaaS
 * 
 * Formato JSON para integração com:
 * - CloudWatch Logs
 * - Datadog
 * - Elastic Stack
 * - Grafana Loki
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string | object) {
    this.emit('info', message, context);
  }

  error(message: string, trace?: string, context?: string | object) {
    this.emit('error', message, context, { trace });
  }

  warn(message: string, context?: string | object) {
    this.emit('warn', message, context);
  }

  debug(message: string, context?: string | object) {
    if (process.env.NODE_ENV !== 'production') {
      this.emit('debug', message, context);
    }
  }

  verbose(message: string, context?: string | object) {
    if (process.env.NODE_ENV !== 'production') {
      this.emit('verbose', message, context);
    }
  }

  private emit(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    context?: string | object,
    extra?: Record<string, unknown>,
  ) {
    const timestamp = new Date().toISOString();
    const contextName = typeof context === 'string' ? context : this.context;
    const metadata = typeof context === 'object' ? context : {};

    const logEntry = {
      timestamp,
      level,
      message,
      context: contextName,
      service: 'pub-system-backend',
      env: process.env.NODE_ENV || 'development',
      ...metadata,
      ...extra,
    };

    // Em produção, output JSON puro para parsing
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      // Em dev, formato legível
      const emoji = this.getEmoji(level);
      const color = this.getColor(level);
      console.log(
        `${color}${emoji} [${timestamp}] [${level.toUpperCase()}] [${contextName || 'App'}] ${message}${this.reset}`,
        Object.keys(metadata).length > 0 ? metadata : '',
      );
    }
  }

  private getEmoji(level: string): string {
    const emojis: Record<string, string> = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      verbose: '📝',
    };
    return emojis[level] || '📋';
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[35m',   // Magenta
      verbose: '\x1b[37m', // White
    };
    return colors[level] || '\x1b[0m';
  }

  private get reset(): string {
    return '\x1b[0m';
  }
}

/**
 * Helper para criar logs estruturados com contexto específico
 */
export function createStructuredLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown>,
) {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'pub-system-backend',
    env: process.env.NODE_ENV || 'development',
    ...data,
  };
}

/**
 * Tipos de eventos para tracking
 */
export enum LogEvent {
  // Auth
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILED = 'auth.login.failed',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_TOKEN_REFRESH = 'auth.token.refresh',
  
  // Pedidos
  PEDIDO_CREATED = 'pedido.created',
  PEDIDO_STATUS_CHANGED = 'pedido.status.changed',
  PEDIDO_CANCELLED = 'pedido.cancelled',
  
  // Comandas
  COMANDA_OPENED = 'comanda.opened',
  COMANDA_CLOSED = 'comanda.closed',
  COMANDA_PAID = 'comanda.paid',
  
  // Caixa
  CAIXA_OPENED = 'caixa.opened',
  CAIXA_CLOSED = 'caixa.closed',
  CAIXA_SANGRIA = 'caixa.sangria',
  CAIXA_SUPRIMENTO = 'caixa.suprimento',
  
  // Sistema
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_ERROR = 'system.error',
  
  // Tenant
  TENANT_CREATED = 'tenant.created',
  TENANT_SUSPENDED = 'tenant.suspended',
  TENANT_ACTIVATED = 'tenant.activated',
}
