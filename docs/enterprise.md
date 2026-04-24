# Sprint 4 — Maturidade & Enterprise

**Branch:** `sprint-4-enterprise`
**Data:** 2026-04-24

---

## Arquitetura Final

```
                    ┌──────────────────────────────────┐
                    │         Load Balancer            │
                    │    (api.pubsystem.com.br)        │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │      NestJS Backend              │
                    │  ┌────────────────────────────┐  │
                    │  │  TenantInterceptor         │  │ ← Resolve tenant (subdomain/JWT)
                    │  │  TenantRlsMiddleware       │  │ ← SET app.current_tenant_id
                    │  │  TenantGuard               │  │ ← Bloqueia cross-tenant
                    │  │  TenantRateLimitGuard      │  │ ← Rate limit por plano
                    │  │  FeatureGuard              │  │ ← Feature gating por plano
                    │  │  SentryExceptionFilter     │  │ ← Error tracking
                    │  └────────────────────────────┘  │
                    └────┬──────────┬──────────┬───────┘
                         │          │          │
              ┌──────────▼──┐  ┌───▼────┐  ┌──▼──────────┐
              │ PostgreSQL  │  │ Redis  │  │   BullMQ    │
              │  + RLS      │  │ Cache  │  │   Queues    │
              │             │  │ Rate   │  │  (audit)    │
              └─────────────┘  └────────┘  └─────────────┘
```

---

## 1. Row Level Security (RLS)

### O que é
PostgreSQL RLS é uma camada de segurança no nível do banco de dados que filtra automaticamente as linhas retornadas por qualquer query. Mesmo que um bug na aplicação esqueça de filtrar por `tenant_id`, o PostgreSQL **nunca** retornará dados de outro tenant.

### Implementação

**Migration:** `1745520000000-EnableRowLevelSecurity`
- Habilita RLS em **25 tabelas** com `tenant_id`
- Cria policy `tenant_isolation_policy` em cada tabela
- Policy verifica `current_setting('app.current_tenant_id')`

**Subscriber:** `TenantRlsSubscriber`
- Seta `SET LOCAL app.current_tenant_id` antes de INSERT/UPDATE/DELETE
- Registrado automaticamente no DataSource

**Middleware:** `TenantRlsMiddleware`
- Seta `app.current_tenant_id` no início de cada requisição HTTP
- Cobre operações de SELECT (que o subscriber não cobre)
- **Feature-flagged:** só ativa quando `RLS_ENABLED=true`

### Tabelas protegidas
```
funcionarios, empresas, ambientes, mesas, produtos, clientes,
comandas, comanda_agregados, pedidos, itens_pedido, retirada_itens,
eventos, paginas_evento, pontos_entrega, avaliacoes, medalhas,
medalhas_garcom, turnos_funcionario, aberturas_caixa,
fechamentos_caixa, sangrias, movimentacoes_caixa, audit_logs,
refresh_tokens, layouts_estabelecimento
```

### Política RLS
```sql
CREATE POLICY tenant_isolation_policy ON "tabela"
  AS PERMISSIVE FOR ALL
  USING (
    -- Sem tenant setado = acesso total (compatibilidade)
    current_setting('app.current_tenant_id', true) IS NULL
    OR current_setting('app.current_tenant_id', true) = ''
    -- Filtro por tenant
    OR tenant_id::text = current_setting('app.current_tenant_id', true)
    -- Dados sem tenant (SUPER_ADMIN, globais)
    OR tenant_id IS NULL
  )
```

### Ativação gradual
1. **Fase 1 (atual):** Migration criada, RLS habilitado nas tabelas, mas middleware desativado (`RLS_ENABLED=false`). Policies permitem tudo quando `app.current_tenant_id` está vazio.
2. **Fase 2:** Ativar `RLS_ENABLED=true` em staging. Validar com testes E2E.
3. **Fase 3:** Ativar em produção. Monitorar logs por 48h.
4. **Fase 4:** Ativar `FORCE ROW LEVEL SECURITY` (descomentando na migration) para que nem o owner do banco bypasse RLS.

### Rollback
```bash
# Desativar middleware (sem alterar banco)
RLS_ENABLED=false

# OU reverter migration (remove policies + desabilita RLS)
npm run typeorm:migration:revert
```

---

## 2. Segurança Multi-Tenant — 4 Camadas

| Camada | Componente | Proteção |
|---|---|---|
| **L1: Aplicação** | `TenantGuard` | JWT.tenantId ≠ contexto → 403 |
| **L2: Repositório** | `BaseTenantRepository` | WHERE tenant_id = :current filtrado |
| **L3: Banco** | RLS Policies | PostgreSQL filtra automaticamente |
| **L4: Rate Limit** | `TenantRateLimitGuard` | Limites por plano (FREE→ENTERPRISE) |

### Cenários de ataque bloqueados
1. **JWT forjado com outro tenantId** → Bloqueado por L1 (TenantGuard compara JWT vs subdomain)
2. **Query sem filtro de tenant** → Bloqueado por L2 (BaseTenantRepository) e L3 (RLS)
3. **SQL injection com tenant_id** → Bloqueado por L3 (RLS usa session variable, não query param)
4. **DDoS por tenant** → Mitigado por L4 (rate limit por plano)
5. **Usuário sem tenantId** → Bloqueado por L1 (403 USER_WITHOUT_TENANT)

---

## 3. CI/CD Pipeline

### Jobs (5 total)
```
┌──────────┐   ┌──────────────────┐   ┌──────────┐
│ Backend  │──▶│ Tenant Isolation │   │ Frontend │
│ lint+    │   │ unit + E2E       │   │ lint+    │
│ build+   │   │ (RLS_ENABLED)    │   │ build    │
│ test     │   └────────┬─────────┘   └────┬─────┘
└────┬─────┘            │                  │
     │            ┌─────▼──────┐           │
     └───────────▶│  Security  │◀──────────┘
                  │  Audit     │
                  └─────┬──────┘
                        │
                  ┌─────▼──────┐
                  │   Deploy   │
                  │  Staging   │
                  └────────────┘
```

### Tenant Isolation Job
- PostgreSQL + Redis services
- `RLS_ENABLED=true`
- Roda: `tenant-isolation.spec.ts` + `tenant-isolation.e2e-spec.ts`
- Roda: `auth.e2e-spec.ts` + `gerente-permissions.e2e-spec.ts`
- **Obrigatório** para deploy (deploy-staging depende deste job)

### Deploy Flow
1. Build Docker image **no runner CI** (7GB RAM, nunca na VM)
2. `docker save | gzip | scp` para VM Oracle
3. Restart container com `--no-deps`
4. Health check (90s timeout, 9 retries)
5. Rollback automático se health check falhar

---

## 4. Monitoramento

### Sentry (Error Tracking)
- **Pacotes:** `@sentry/node`, `@sentry/nestjs`
- **Feature-flagged:** Ativo somente quando `SENTRY_DSN` definido
- **Filtros:** Ignora erros esperados (401, 403, 400, 404, 429)
- **Contexto:** `tenantId` como tag, user info (email, id)
- **Exception Filter:** `SentryExceptionFilter` captura 5xx e envia ao Sentry

### Health Checks
| Endpoint | Auth | Checks |
|---|---|---|
| `GET /health` | Público | DB + Memory heap/RSS |
| `GET /health/live` | Público | Processo vivo + uptime |
| `GET /health/ready` | Público | DB + Redis |
| `GET /health/metrics` | JWT | Memory, CPU, Node info, features |

### Feature Flags no /health/metrics
```json
{
  "features": {
    "rls": true,
    "sentry": true,
    "redis": true,
    "bullmq": true
  }
}
```

### Logs Estruturados
- **Produção:** JSON puro (console + arquivos rotativos)
- **Desenvolvimento:** Console colorido com `[tenant:xxxxxxxx]`
- **Campos:** `tenantId`, `method`, `url`, `duration`, `status`
- **Rotação:** app-YYYY-MM-DD.log (14d), error-YYYY-MM-DD.log (30d)

---

## 5. Testes Críticos

### Suite completa
| Arquivo | Tipo | O que testa |
|---|---|---|
| `tenant-isolation.spec.ts` | Unit | TenantContext isolamento, TenantGuard cross-tenant, JWT payload, cache keys, rate-limit keys, cenários de invasão |
| `tenant-isolation.e2e-spec.ts` | E2E | Login scoped, cross-tenant 403, dados isolados por tenant |
| `auth.e2e-spec.ts` | E2E | Login, refresh, logout, sessions, setup protection |
| `gerente-permissions.e2e-spec.ts` | E2E | ADMIN cria GERENTE, permissões por role, multi-tenant |

### Cenários de invasão testados
1. **JWT forjado com tenantId de outro tenant** → 403
2. **Requisição sem JWT com tenant context** → 403
3. **empresaId como fallback (legado)** → 403 (não aceita)
4. **Login em tenant errado** → 401
5. **Listagem cross-tenant** → dados filtrados

---

## 6. Variáveis de Ambiente

### Novas neste sprint
| Variável | Default | Descrição |
|---|---|---|
| `RLS_ENABLED` | `false` | Ativa middleware RLS (PostgreSQL Row Level Security) |
| `SENTRY_DSN` | — | DSN do projeto Sentry (opcional) |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Taxa de amostragem de traces (0-1) |

### Todas as variáveis críticas
```env
# Obrigatórias
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=pubuser
DB_PASSWORD=***
DB_DATABASE=pubsystem
JWT_SECRET=***
FRONTEND_URL=https://pub-system.vercel.app

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Enterprise (Sprint 4)
RLS_ENABLED=true
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## 7. Operação

### Ativar RLS em produção
```bash
# 1. Deploy com migration (RLS habilitado nas tabelas, middleware off)
# 2. Validar que tudo funciona normalmente
# 3. Ativar middleware:
echo "RLS_ENABLED=true" >> ~/pub-system/.env
docker restart pub-backend
# 4. Monitorar logs por 48h
docker logs -f pub-backend 2>&1 | grep -i "rls\|tenant"
```

### Ativar Sentry
```bash
# 1. Criar projeto em sentry.io
# 2. Adicionar DSN ao .env
echo "SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx" >> ~/pub-system/.env
docker restart pub-backend
# 3. Verificar no log: "🔍 Sentry inicializado"
```

### Rollback de emergência
| Problema | Solução |
|---|---|
| RLS bloqueando queries | `RLS_ENABLED=false` + restart |
| Sentry overhead | Remover `SENTRY_DSN` + restart |
| Migration RLS falhou | `npm run typeorm:migration:revert` |
| Deploy quebrou | CI executa `scripts/rollback.sh --force` automaticamente |

---

## 8. Próximos Passos

1. **FORCE RLS** — Ativar `ALTER TABLE FORCE ROW LEVEL SECURITY` após validação
2. **Sentry Profiling** — Ativar profiling para identificar gargalos
3. **Bull Board** — Dashboard visual para filas BullMQ
4. **PgBouncer** — Connection pooling na frente do PostgreSQL
5. **Horizontal Scaling** — Redis adapter para Socket.IO + load balancer
6. **SOC 2 Compliance** — Audit trail completo, encryption at rest
