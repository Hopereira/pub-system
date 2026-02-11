# Auditoria Final — Código vs Documentação

**Data:** 2026-02-11  
**Executor:** Equipe sênior de engenharia (auditoria automatizada)  
**Escopo:** Backend completo, frontend completo, infra, docs

---

## 1. Sumário Executivo

### Maturidade do Sistema
- **Backend:** Maduro. 20 módulos NestJS, 130+ endpoints, multi-tenancy funcional, WebSocket, cache Redis, auditoria, rate limiting.
- **Frontend:** Funcional. Next.js 15, ~30 rotas, services espelham backend, WebSocket integrado.
- **Infra:** Produção ativa. Vercel + Oracle VM + Neon + Cloudflare. Custo ~R$3/mês.
- **Documentação (antes):** Caótica. 198 arquivos, 80%+ obsoletos, duplicados ou contraditórios.
- **Documentação (depois):** 8 arquivos em `docs/current/`. Zero duplicata. Zero contradição.

### Riscos Técnicos Ativos

| Prioridade | Risco | Arquivo |
|-----------|-------|---------|
| P0 | SSH key privada commitada no repo | `ssh-key-2025-12-11.key` |
| P0 | `/setup/super-admin` público sem auth | `backend/src/auth/create-super-admin.controller.ts` |
| P0 | TenantRateLimitGuard desabilitado | `backend/src/app.module.ts:198-203` |
| P1 | Role GERENTE no enum mas sem uso em @Roles() | `cargo.enum.ts` |
| P1 | REDIS_HOST/PORT não validados por Joi | `app.module.ts` |
| P2 | Swagger exposto em produção se NODE_ENV não setado | `main.ts` |

---

## 2. Divergências Detectadas (Código vs Docs Antigas)

| Tema | Código Real | Docs Antigas | Ação Tomada |
|------|------------|-------------|-------------|
| Roles | 8 roles (ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO, COZINHA, BARTENDER, SUPER_ADMIN) | Docs citavam 5 roles | Corrigido em ARQUITETURA.md |
| Endpoints | ~130 endpoints reais | Docs citavam ~50 | Mapeamento completo em API.md |
| Redis | Obrigatório (CacheModule) | Não mencionado em setup | Documentado em SETUP_LOCAL.md e ENV_VARS.md |
| Multi-tenancy | Implementado com TenantGuard, TenantInterceptor, FeatureGuard | Docs parciais e espalhados | Consolidado em ARQUITETURA.md e SEGURANCA.md |
| Feature flags | 7 features controladas por plano | Não documentado | Documentado em ARQUITETURA.md |
| Refresh tokens | Implementado com entidade RefreshToken, revogação, sessões | Não documentado | Documentado em SEGURANCA.md |
| Rate limiting | 3 tiers (short/medium/long) + decorators customizados | Não documentado | Documentado em SEGURANCA.md |
| WebSocket | 7 eventos server→client, 2 client→server, isolamento por tenant | Docs incompletos | Documentado em ARQUITETURA.md |
| Módulo Payment | Controller com 9 endpoints, webhooks, assinaturas | Não documentado | Documentado em API.md |
| Módulo Plan | Controller com 7 endpoints, CRUD de planos | Não documentado | Documentado em API.md |
| Módulo Audit | Controller com 6 endpoints, logs automáticos | Não documentado | Documentado em API.md e SEGURANCA.md |
| Módulo Turno | Controller com 6 endpoints + TurnoGateway | Não documentado | Documentado em API.md |
| Módulo Medalha | Controller com 3 endpoints, gamificação | Não documentado | Documentado em API.md |
| Docker services | 5 serviços (backend, frontend, db, redis, pgadmin) | Docs citavam 4 (sem redis) | Corrigido em SETUP_LOCAL.md |
| Frontend routes | ~30 rotas reais | Docs citavam ~15 | Documentado em ARQUITETURA.md |
| Cloudflare DNS | Automação de subdomínios via API | Não documentado | Documentado em DEPLOY.md |
| Seeder | 5 clientes, 5 comandas, 22 mesas, 42 produtos | Dados inconsistentes entre docs | Corrigido em REGRAS_NEGOCIO.md |

---

## 3. Endpoints Reais (Gerados do Código)

Mapeamento completo em `docs/current/API.md`. Resumo:

### Auth (6 endpoints)
`POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`  
`GET /auth/sessions`, `DELETE /auth/sessions/:id`

### Operações do Pub (90+ endpoints)
- `/empresa` (3) — CRUD empresa
- `/ambientes` (6) — CRUD ambientes + debug
- `/funcionarios` (12) — CRUD + perfil + foto + registro público
- `/mesas` (10) — CRUD + mapa visual + batch posições
- `/clientes` (6) — CRUD + busca pública
- `/comandas` (13) — CRUD + busca + fechamento + QR Code
- `/pedidos` (12) — CRUD + status item + retirada + entrega
- `/produtos` (6) — CRUD + cardápio público
- `/caixa` (12) — abertura/fechamento + sangria/suprimento + relatórios
- `/pontos-entrega` (10) — CRUD + toggle + mapa
- `/eventos` (8) — CRUD + upload + públicos
- `/paginas-evento` (8) — CRUD + upload + públicas
- `/avaliacoes` (4) — criação pública + estatísticas
- `/turnos` (6) — check-in/out + estatísticas

### Auditoria (6 endpoints)
`GET /audit`, `/audit/entity/:name/:id`, `/audit/user/:id`, `/audit/report`, `/audit/statistics`, `/audit/failed-logins`

### WebSocket (2 gateways)
- PedidosGateway: 7 eventos server→client, 2 client→server
- TurnoGateway: eventos de turno isolados por tenant

### Analytics (7 endpoints)
Relatórios, tempos, performance garçons/ambientes, ranking, mais vendidos.

### Plataforma (20+ endpoints)
- `/super-admin/*` (13) — gestão de tenants
- `/registro` (4) — registro público de pubs
- `/plan/*` (9) — features e planos
- `/payments/*` (9) — pagamentos e assinaturas
- `/health` (1) — health check

---

## 4. Segurança — Validação

| Aspecto | Status | Evidência |
|---------|--------|-----------|
| JWT auth | ✅ Implementado | `auth/strategies/jwt.strategy.ts` |
| Refresh tokens | ✅ Implementado | `auth/refresh-token.service.ts`, entidade `RefreshToken` |
| Sessões revogáveis | ✅ Implementado | `GET/DELETE /auth/sessions` |
| Rate limiting global | ✅ Implementado | ThrottlerModule com 3 tiers |
| Rate limiting por tenant | ❌ DESABILITADO | `app.module.ts:198-203` comentado |
| Multi-tenant isolation | ✅ Implementado | TenantGuard + TenantInterceptor globais |
| Tenant suspension | ✅ Implementado | TenantGuard rejeita tenants não-ATIVO |
| Feature guard | ✅ Implementado | FeatureGuard + @RequireFeature |
| Input validation | ✅ Implementado | ValidationPipe global com whitelist |
| Helmet headers | ✅ Implementado | `main.ts:23-28` |
| CORS | ✅ Implementado | `main.ts:44-74` com whitelist |
| Audit logging | ✅ Implementado | AuditModule com 5 tipos de ação |
| Bcrypt passwords | ✅ Implementado | `funcionario.service.ts` |
| SSH key exposed | ❌ VULNERÁVEL | `ssh-key-2025-12-11.key` na raiz |
| Super admin público | ❌ VULNERÁVEL | `POST /setup/super-admin` sem auth |

---

## 5. Setup Real Validado

Passo a passo funcional documentado em `docs/current/SETUP_LOCAL.md`:

```
1. git clone → cd pub-system
2. cp .env.example .env → editar JWT_SECRET (min 32 chars)
3. docker compose up -d
4. Aguardar healthcheck de db e redis
5. Backend inicia, roda migrations, executa seeder
6. Acessar http://localhost:3001 → admin@admin.com / admin123
```

Variáveis obrigatórias: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, JWT_SECRET.  
Variáveis injetadas pelo docker-compose: REDIS_HOST, REDIS_PORT, DATABASE_URL, API_URL_SERVER.

---

## 6. Top 10 Problemas do Sistema

| # | Problema | Severidade | Ação Recomendada |
|---|---------|-----------|-----------------|
| 1 | SSH key privada no repositório | CRÍTICO | Remover do repo + histórico git. Revogar chave. |
| 2 | `/setup/super-admin` público | CRÍTICO | Remover controller ou proteger com env flag |
| 3 | TenantRateLimitGuard desabilitado | ALTO | Resolver DI e reativar |
| 4 | REDIS_HOST/PORT sem validação Joi | MÉDIO | Adicionar ao schema Joi em app.module.ts |
| 5 | Role GERENTE sem uso | BAIXO | Remover do enum ou implementar permissões |
| 6 | Swagger exposto se NODE_ENV não setado | MÉDIO | Forçar check explícito |
| 7 | localStorage para tokens (XSS risk) | MÉDIO | Migrar para httpOnly cookies |
| 8 | Sem testes automatizados | ALTO | Implementar testes e2e nos fluxos críticos |
| 9 | Sem backup automatizado do Neon | MÉDIO | Configurar pg_dump periódico |
| 10 | Sem CI/CD pipeline | MÉDIO | GitHub Actions para lint, test, deploy |

---

## 7. Recomendações de Próximas Melhorias

1. **Segurança imediata:** Resolver os 3 problemas P0 (SSH key, super-admin, rate limit)
2. **Testes:** Implementar testes e2e com Jest/Supertest nos fluxos: login → pedido → fechamento
3. **CI/CD:** GitHub Actions com lint + build + test + deploy automático
4. **Monitoramento:** Health check periódico + alertas (UptimeRobot gratuito)
5. **Backup:** Cron job para pg_dump do Neon
6. **Auth:** Migrar tokens de localStorage para httpOnly cookies
7. **Observabilidade:** Structured logging com correlação de request ID
8. **Performance:** Ativar TenantRateLimitGuard após resolver DI
9. **Documentação:** Manter `docs/current/` atualizado a cada PR significativo
10. **Código morto:** Remover role GERENTE ou implementar permissões específicas
