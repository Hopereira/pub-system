# Production Readiness — Sprint 5

## Status: ✅ READY

## O que foi implementado

### 1. RLS — Produção Segura
- **DRY-RUN mode** (`RLS_DRY_RUN=true`): audita sem bloquear requisições
- **Risk logging**: logs estruturados com `TENANT_CONTEXT_MISSING`, `SUPER_ADMIN_BYPASS`, `RLS_SESSION_NOT_SET`, `PUBLIC_ROUTE_ACCESS`
- **Readiness check**: `npm run rls:readiness` — verifica tabelas, policies, migrations, dados órfãos
- **Plano gradual**: 5 fases (Off → Audit → Staging → Produção → Enforce)
- **Testes**: `rls-modes.spec.ts` — cobre OFF, DRY-RUN e ENABLED

### 2. Observabilidade Ativa
- **RequestId global**: `X-Request-Id` em toda requisição (middleware)
- **Event catalog**: `ObservabilityEvent` enum com 9 eventos padronizados
- **Sentry melhorado**: requestId, role, version, 409 filtrado, severidade por status
- **Logs com requestId**: `[tenant:xxx][req:yyy]` em todo log HTTP
- **Health checks**: `/ready` valida DB + Redis + BullMQ + RLS status
- **Metrics**: `/metrics` expõe feature flags incluindo `rlsDryRun` e `socketIoRedis`

### 3. Testes de Carga
- **HTTP**: k6 script com login, listagem de mesas/produtos/comandas/funcionários
- **Queue**: BullMQ stress test (burst de N jobs, mede throughput)
- **WebSocket**: N conexões simultâneas com medição de latência
- **Multi-node**: Socket.IO Redis adapter implementado (`SOCKET_IO_REDIS_ENABLED`)

### 4. CI/CD
- **RLS modes tests**: integrados ao job `tenant-isolation`
- **RLS readiness**: executado no CI (continue-on-error)
- **Deploy gates**: tenant-isolation + security + backend + frontend

## Env vars novas

| Variável | Default | Descrição |
|----------|---------|-----------|
| `RLS_DRY_RUN` | `false` | Modo auditoria RLS (sem bloqueio) |
| `SOCKET_IO_REDIS_ENABLED` | `false` | Redis adapter para Socket.IO multi-node |

## Riscos residuais

1. **RLS não ativo em produção**: intencional — seguir plano gradual
2. **Pre-existing TS error**: `test/security-hardening.e2e-spec.ts:64` — type cast issue, fora do escopo
3. **Load tests não executados automaticamente**: requerem k6 instalado + tenant real
4. **Sentry não configurado**: requer `SENTRY_DSN` — funcional quando configurado

## Instruções de deploy seguro

1. Merge `sprint-5-production-readiness` na `main`
2. CI executa automaticamente: build, tests, tenant-isolation, security
3. Deploy automático para staging após CI passar
4. Verificar `/health/ready` no staging
5. Se OK, promover para produção

## Instruções de rollback

- **RLS**: `RLS_ENABLED=false` + `RLS_DRY_RUN=false` + restart
- **Socket.IO Redis**: `SOCKET_IO_REDIS_ENABLED=false` + restart
- **Deploy completo**: `bash scripts/rollback.sh --force`

## Arquivos criados/modificados

### Criados
- `src/common/middleware/request-id.middleware.ts`
- `src/common/monitoring/events.ts`
- `src/common/adapters/redis-io.adapter.ts`
- `src/common/tenant/tests/rls-modes.spec.ts`
- `scripts/rls-readiness.ts`
- `scripts/load-test/http-load.js`
- `scripts/load-test/queue-stress.ts`
- `scripts/load-test/websocket-stress.ts`
- `docs/observability.md`
- `docs/load-testing.md`
- `docs/production-db-checklist.md`
- `docs/production-readiness.md`

### Modificados
- `src/app.module.ts` — NestModule, RequestIdMiddleware, RLS_DRY_RUN, SOCKET_IO_REDIS_ENABLED
- `src/main.ts` — RedisIoAdapter conditional setup
- `src/common/tenant/tenant-rls.middleware.ts` — DRY-RUN mode, risk logging
- `src/common/tenant/tenant-logging.interceptor.ts` — requestId in logs
- `src/common/monitoring/sentry-exception.filter.ts` — requestId, role, 409 filter
- `src/health/health.controller.ts` — BullMQ check, RLS check, new feature flags
- `.github/workflows/ci.yml` — RLS modes test, rls:readiness
- `backend/package.json` — new scripts, socket.io-client devDep
