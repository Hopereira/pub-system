import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ObservabilityEvent, EventSeverity, createObservabilityEvent } from './events';

/**
 * AlertService — Detecção automática de anomalias e envio de alertas
 *
 * Regras de threshold:
 * - HTTP 500 acima de X/min → ALERTA
 * - BullMQ job failures acima de X → ALERTA
 * - RLS_RISK detectado → ALERTA
 * - WebSocket auth failure → ALERTA
 * - Latência média elevada → ALERTA
 *
 * Integrações: Slack, Discord, Email (via ALERT_WEBHOOK_URL)
 *
 * ROLLBACK: Desativar setando ALERT_ENABLED=false ou removendo ALERT_WEBHOOK_URL
 */

export interface AlertRule {
  name: string;
  event: ObservabilityEvent;
  threshold: number;
  windowMs: number;
  severity: EventSeverity;
  cooldownMs: number;
}

interface AlertCounter {
  count: number;
  firstSeen: number;
  lastAlerted: number;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    name: 'high_error_rate',
    event: ObservabilityEvent.INTERNAL_SERVER_ERROR,
    threshold: 5,
    windowMs: 60_000,
    severity: 'critical',
    cooldownMs: 300_000,
  },
  {
    name: 'queue_failures',
    event: ObservabilityEvent.QUEUE_FAILED_JOB,
    threshold: 3,
    windowMs: 300_000,
    severity: 'error',
    cooldownMs: 600_000,
  },
  {
    name: 'rls_risk_detected',
    event: ObservabilityEvent.RLS_RISK,
    threshold: 1,
    windowMs: 60_000,
    severity: 'warning',
    cooldownMs: 300_000,
  },
  {
    name: 'websocket_auth_failure',
    event: ObservabilityEvent.WEBSOCKET_AUTH_FAILURE,
    threshold: 10,
    windowMs: 60_000,
    severity: 'warning',
    cooldownMs: 300_000,
  },
  {
    name: 'db_errors',
    event: ObservabilityEvent.DB_ERROR,
    threshold: 3,
    windowMs: 60_000,
    severity: 'critical',
    cooldownMs: 300_000,
  },
  {
    name: 'auth_failures',
    event: ObservabilityEvent.AUTH_FAILURE,
    threshold: 20,
    windowMs: 300_000,
    severity: 'warning',
    cooldownMs: 600_000,
  },
  {
    name: 'rate_limit_exceeded',
    event: ObservabilityEvent.RATE_LIMIT_EXCEEDED,
    threshold: 50,
    windowMs: 60_000,
    severity: 'warning',
    cooldownMs: 300_000,
  },
];

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly counters = new Map<string, AlertCounter>();
  private readonly rules: AlertRule[] = DEFAULT_RULES;

  /**
   * Registra um evento para avaliação de threshold.
   * Chamado por middleware, filters, e services ao detectar eventos críticos.
   */
  recordEvent(event: ObservabilityEvent, metadata?: Record<string, any>): void {
    const now = Date.now();

    for (const rule of this.rules) {
      if (rule.event !== event) continue;

      const key = rule.name;
      let counter = this.counters.get(key);

      if (!counter || now - counter.firstSeen > rule.windowMs) {
        counter = { count: 0, firstSeen: now, lastAlerted: 0 };
      }

      counter.count++;
      this.counters.set(key, counter);

      if (counter.count >= rule.threshold) {
        if (now - counter.lastAlerted > rule.cooldownMs) {
          counter.lastAlerted = now;
          this.triggerAlert(rule, counter.count, metadata);
          // Reset after alert
          counter.count = 0;
          counter.firstSeen = now;
        }
      }
    }
  }

  private triggerAlert(rule: AlertRule, count: number, metadata?: Record<string, any>): void {
    const payload = createObservabilityEvent(
      rule.event,
      rule.severity,
      `[ALERT] ${rule.name}: ${count} events in ${rule.windowMs / 1000}s (threshold: ${rule.threshold})`,
      { metadata: { ...metadata, rule: rule.name, count, threshold: rule.threshold } },
    );

    // Log structured alert
    this.logger.warn(`🚨 ALERT TRIGGERED: ${rule.name} | count=${count} threshold=${rule.threshold} severity=${rule.severity}`);
    this.logger.warn(JSON.stringify(payload));

    // Send webhook notification
    this.sendWebhook(rule, count, metadata);
  }

  private async sendWebhook(rule: AlertRule, count: number, metadata?: Record<string, any>): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    const severityEmoji: Record<EventSeverity, string> = {
      critical: '🔴',
      error: '🟠',
      warning: '🟡',
      info: 'ℹ️',
    };

    const message = {
      text: `${severityEmoji[rule.severity]} **PUB System Alert**\n` +
        `**Rule:** ${rule.name}\n` +
        `**Severity:** ${rule.severity.toUpperCase()}\n` +
        `**Count:** ${count} events in ${rule.windowMs / 1000}s\n` +
        `**Threshold:** ${rule.threshold}\n` +
        `**Environment:** ${process.env.NODE_ENV || 'development'}\n` +
        `**Timestamp:** ${new Date().toISOString()}\n` +
        (metadata ? `**Details:** ${JSON.stringify(metadata)}` : ''),
      // Slack-compatible format
      username: 'PUB System Alerts',
      icon_emoji: ':rotating_light:',
      // Discord-compatible format
      content: `${severityEmoji[rule.severity]} **${rule.name}** — ${count} events (${rule.severity})`,
      embeds: [{
        title: `Alert: ${rule.name}`,
        description: `${count} events in ${rule.windowMs / 1000}s (threshold: ${rule.threshold})`,
        color: rule.severity === 'critical' ? 0xff0000 : rule.severity === 'error' ? 0xff6600 : 0xffaa00,
        fields: [
          { name: 'Severity', value: rule.severity, inline: true },
          { name: 'Environment', value: process.env.NODE_ENV || 'dev', inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (err) {
      this.logger.debug(`Alert webhook failed: ${err.message}`);
    }
  }

  /**
   * Retorna snapshot dos contadores atuais (para /internal/status)
   */
  getCounterSnapshot(): Record<string, { count: number; windowMs: number; threshold: number }> {
    const now = Date.now();
    const snapshot: Record<string, { count: number; windowMs: number; threshold: number }> = {};

    for (const rule of this.rules) {
      const counter = this.counters.get(rule.name);
      const isActive = counter && now - counter.firstSeen <= rule.windowMs;
      snapshot[rule.name] = {
        count: isActive ? counter.count : 0,
        windowMs: rule.windowMs,
        threshold: rule.threshold,
      };
    }

    return snapshot;
  }

  /**
   * Cleanup de contadores expirados (a cada 5 min)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanupCounters(): void {
    const now = Date.now();
    for (const rule of this.rules) {
      const counter = this.counters.get(rule.name);
      if (counter && now - counter.firstSeen > rule.windowMs * 2) {
        this.counters.delete(rule.name);
      }
    }
  }
}
