# Observabilidade — Pub System

## Eventos Críticos

| Evento | Severidade | Quando |
|--------|-----------|--------|
| `AUTH_FAILURE` | warning | Login falho, token inválido |
| `TENANT_MISMATCH` | error | JWT tenantId ≠ contexto |
| `RLS_RISK` | warning | Requisição sem tenant context em rota protegida |
| `DB_ERROR` | critical | Falha de conexão ou query |
| `QUEUE_FAILED_JOB` | error | Job BullMQ falhou após retries |
| `WEBSOCKET_AUTH_FAILURE` | warning | Conexão WS com token inválido |
| `RATE_LIMIT_EXCEEDED` | warning | Tenant/IP excedeu rate limit |
| `PAYMENT_ERROR` | critical | Falha no processamento de pagamento |
| `INTERNAL_SERVER_ERROR` | critical | HTTP 500 inesperado |

Cada evento contém: `severity`, `tenantId`, `userId`, `requestId`, `timestamp`, `environment`, `message`, `metadata`.

## RequestId

Toda requisição recebe um UUID via `X-Request-Id`:
- Se o cliente enviar `X-Request-Id`, ele é propagado
- Se não enviado, o backend gera automaticamente
- Retornado na response (`X-Request-Id` header)
- Incluído em: logs Winston, tags Sentry, responses de erro

**Como investigar por requestId:**
1. Buscar no log: `grep "req:XXXXXXXX" logs/`
2. Buscar no Sentry: filtrar tag `requestId:XXXXXXXX`

## Sentry

### Configuração
```env
SENTRY_DSN=https://xxx@sentry.io/yyy
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Contexto capturado
- `tenantId` — tag
- `userId`, `email` — user context
- `role` — tag
- `requestId` — tag
- `method`, `url` — tags
- `statusCode` — tag
- `version` — tag
- `ip` — extra

### Erros filtrados (não enviados ao Sentry)
400, 401, 403, 404, 409, 429

### Erros capturados como críticos
- HTTP 500+
- Erro de banco de dados (connection lost, query fail)
- Erro de fila (job failed)
- Erro WebSocket (auth failure)
- Falha inesperada em RLS (SESSION_NOT_SET)

## Health Checks

| Endpoint | Auth | Descrição |
|----------|------|-----------|
| `GET /health` | ❌ | Básico (load balancer) |
| `GET /health/live` | ❌ | Liveness probe (k8s) |
| `GET /health/ready` | ❌ | Readiness: DB + Redis + BullMQ + RLS |
| `GET /health/metrics` | ✅ JWT | Métricas: memória, CPU, feature flags, version |

### `/health/ready` verifica:
- PostgreSQL pingCheck
- Redis connectivity
- BullMQ queue status
- RLS status (tables protected count)

### `/health/metrics` expõe:
- Uso de memória (heap, RSS)
- Uptime
- Feature flags: `rls`, `rlsDryRun`, `sentry`, `redis`, `bullmq`, `socketIoRedis`
- Versão da aplicação

## Logs Estruturados

### Formato (produção — JSON)
```json
{
  "level": "info",
  "message": "[tenant:abcd1234][req:ef567890] 📥 GET /funcionarios | IP: 1.2.3.4",
  "tenantId": "abcd1234-...",
  "requestId": "ef567890-...",
  "method": "GET",
  "url": "/funcionarios",
  "timestamp": "2026-04-24T18:00:00.000Z"
}
```

### Logs RLS Risk (DRY-RUN)
```
[RLS_RISK] TENANT_CONTEXT_MISSING | GET /produtos
{"reason":"TENANT_CONTEXT_MISSING","tenantId":null,"userId":null,"role":null,"method":"GET","url":"/produtos","requestId":"...","timestamp":"..."}
```

## Plano de Ativação RLS

| Fase | `RLS_ENABLED` | `RLS_DRY_RUN` | Ação |
|------|:---:|:---:|------|
| 0 — Off | `false` | `false` | Estado inicial, sem RLS |
| 1 — Audit | `false` | `true` | Auditar riscos sem bloquear |
| 2 — Staging | `true` | `false` | Ativar em staging, testar |
| 3 — Produção | `true` | `false` | Ativar em produção com monitoramento |
| 4 — Enforce | FORCE RLS | — | Após 7 dias sem alerta crítico |

### Critérios de avanço
- **Fase 0 → 1**: Nenhum — basta setar env var
- **Fase 1 → 2**: 48h sem `TENANT_CONTEXT_MISSING` em rotas críticas
- **Fase 2 → 3**: Todos os testes E2E passando, `rls:readiness` = READY/WARNING
- **Fase 3 → 4**: 7 dias sem `RLS_SESSION_NOT_SET` em produção

### Rollback
- Qualquer fase → Fase 0: `RLS_ENABLED=false` + `RLS_DRY_RUN=false` + restart
- Não requer migration, não causa downtime

## Monitoramento Diário

- [ ] Verificar `/health/ready` retorna 200
- [ ] Verificar Sentry: novos erros críticos?
- [ ] Verificar logs: `TENANT_CONTEXT_MISSING`?
- [ ] Verificar queues: jobs falhos?

## Playbook de Incidente

1. **Detectar**: alerta Sentry ou health check falho
2. **Identificar**: buscar `requestId` nos logs e Sentry
3. **Isolar**: identificar tenant, endpoint, e tipo de erro
4. **Mitigar**: rollback se necessário (RLS → Fase 0, deploy → rollback)
5. **Investigar**: reproduzir em staging com dados de teste
6. **Corrigir**: fix + test + deploy via CI/CD normal
7. **Documentar**: post-mortem em `docs/sessions/`

## Checklist de Produção

- [x] Sentry configurado (`SENTRY_DSN`)
- [x] RequestId global (middleware)
- [x] Health checks operacionais
- [x] Logs estruturados (Winston JSON em prod)
- [x] Feature flags visíveis em `/health/metrics`
- [x] Rate limiting por tenant
- [x] RLS dry-run disponível
- [ ] Alertas Slack/Discord para erros críticos (usar `ALERT_WEBHOOK_URL`)
- [ ] Dashboard Grafana (futuro)
