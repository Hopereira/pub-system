# Operations Guide — Pub System

> Guia operacional para monitoramento 24/7, alertas e manutenção contínua.

---

## Endpoints Operacionais

| Endpoint | Auth | Descrição |
|----------|------|-----------|
| `GET /health` | Não | Health check básico (load balancer) |
| `GET /health/live` | Não | Liveness probe |
| `GET /health/ready` | Não | Readiness probe (DB + Redis + BullMQ + RLS) |
| `GET /health/metrics` | JWT | Métricas do sistema (memória, CPU, features) |
| `GET /internal/status` | JWT (ADMIN) | Dashboard operacional completo |

---

## Sistema de Alertas

### Como funciona

O `AlertService` monitora eventos de observabilidade em janelas de tempo. Quando um threshold é atingido, dispara log estruturado + webhook.

### Regras configuradas

| Regra | Evento | Threshold | Janela | Cooldown |
|-------|--------|-----------|--------|----------|
| `high_error_rate` | INTERNAL_SERVER_ERROR | 5 | 60s | 5min |
| `queue_failures` | QUEUE_FAILED_JOB | 3 | 5min | 10min |
| `rls_risk_detected` | RLS_RISK | 1 | 60s | 5min |
| `websocket_auth_failure` | WEBSOCKET_AUTH_FAILURE | 10 | 60s | 5min |
| `db_errors` | DB_ERROR | 3 | 60s | 5min |
| `auth_failures` | AUTH_FAILURE | 20 | 5min | 10min |
| `rate_limit_exceeded` | RATE_LIMIT_EXCEEDED | 50 | 60s | 5min |

### Configuração de webhook

```env
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
ALERT_ENABLED=true
```

Suporta: Slack, Discord, ou qualquer endpoint que aceite POST JSON.

---

## Monitoramento de Queries Lentas

### Como funciona

O `SlowQueryLogger` integra com TypeORM e automaticamente:
- Loga queries acima do threshold (padrão: 200ms)
- Sugere índices quando possível
- Expõe métricas em `/internal/status`

### Configuração

```env
SLOW_QUERY_THRESHOLD_MS=200
```

### Métricas expostas

```json
{
  "totalQueries": 1500,
  "slowQueries": 3,
  "failedQueries": 0,
  "avgDurationMs": 245,
  "slowQueryPercent": "0.20%"
}
```

---

## Smoke Tests Pós-Deploy

```bash
# Rodar smoke tests contra o backend
npm run smoke:test

# Contra URL específica
API_URL=https://api.pubsystem.com.br npm run smoke:test
```

Testa:
- Health endpoints
- Login
- Endpoints autenticados (funcionários, mesas, produtos, ambientes, comandas)
- Status interno
- Conexão WebSocket

---

## Feature Flags

| Flag | Default | Descrição |
|------|---------|-----------|
| `RLS_ENABLED` | false | PostgreSQL Row Level Security ativo |
| `RLS_DRY_RUN` | false | RLS audit mode (log sem bloquear) |
| `SOCKET_IO_REDIS_ENABLED` | false | Multi-node WebSocket via Redis |
| `ALERT_ENABLED` | true | Sistema de alertas automáticos |
| `SENTRY_DSN` | (vazio) | Error tracking com Sentry |

### Prioridade de ativação em produção

1. `RLS_DRY_RUN=true` → monitorar 48h
2. `RLS_ENABLED=true` → ativar após validação
3. `SOCKET_IO_REDIS_ENABLED=true` → ativar se multi-node

---

## Monitoramento Diário

### Checklist matinal

1. ☐ `curl /health/ready` — todos os serviços UP
2. ☐ Verificar Sentry — novos erros?
3. ☐ Verificar `/internal/status` — slow queries? alertas?
4. ☐ Verificar disco da VM: `df -h /`
5. ☐ Verificar logs de erro: `docker logs pub-backend 2>&1 | grep ERROR | tail -20`

### Checklist semanal

1. ☐ Rodar `npm run rls:readiness`
2. ☐ Verificar backups: `ls -la backups/`
3. ☐ Limpar cache Docker: `docker image prune -af`
4. ☐ Verificar journald: `journalctl --disk-usage`
5. ☐ Review de slow queries acumuladas

---

## Disaster Recovery

### Banco de dados

```bash
# Backup
bash scripts/backup-db.sh

# Restore
bash scripts/restore-db.sh backups/pub_system_YYYYMMDD_HHMMSS.sql.gz
```

### Rollback de deploy

```bash
# Via CI/CD
# O deploy-staging job inclui rollback automático se health check falhar

# Manual
docker tag pub-backend:previous pub-backend:latest
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

### Recuperação de .env

```bash
# Se .env perdido na VM
docker inspect pub-backend --format '{{range .Config.Env}}{{println .}}{{end}}'
```
