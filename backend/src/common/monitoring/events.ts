/**
 * Catálogo de eventos de observabilidade — padroniza os eventos críticos
 * do sistema para logs, Sentry e alertas.
 */

export enum ObservabilityEvent {
  AUTH_FAILURE = 'AUTH_FAILURE',
  TENANT_MISMATCH = 'TENANT_MISMATCH',
  RLS_RISK = 'RLS_RISK',
  DB_ERROR = 'DB_ERROR',
  QUEUE_FAILED_JOB = 'QUEUE_FAILED_JOB',
  WEBSOCKET_AUTH_FAILURE = 'WEBSOCKET_AUTH_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export type EventSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ObservabilityPayload {
  event: ObservabilityEvent;
  severity: EventSeverity;
  tenantId?: string | null;
  userId?: string | null;
  requestId?: string | null;
  timestamp: string;
  environment: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Cria um payload padronizado de observabilidade.
 */
export function createObservabilityEvent(
  event: ObservabilityEvent,
  severity: EventSeverity,
  message: string,
  extra?: Partial<Omit<ObservabilityPayload, 'event' | 'severity' | 'message' | 'timestamp' | 'environment'>>,
): ObservabilityPayload {
  return {
    event,
    severity,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tenantId: extra?.tenantId ?? null,
    userId: extra?.userId ?? null,
    requestId: extra?.requestId ?? null,
    metadata: extra?.metadata,
  };
}
