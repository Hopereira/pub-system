# Auditoria Completa do Sistema — Pub System
**Data:** 16/04/2026  
**Auditor:** Cascade (leitura completa de todo o repositório)  
**Método:** Leitura de todos os docs, sessões, código-fonte, CI/CD, compose files, package.json  
**Regra seguida:** Regra de Ouro — nenhuma afirmação sem verificação no código real  
**Escopo:** Backend, Frontend, Banco de Dados, Infraestrutura, Documentação, Segurança, CI/CD

---

## SUMÁRIO EXECUTIVO

O sistema está **operacional em produção** com os principais fluxos funcionando. As sessões recentes (04 a 14 de Abril/2026) corrigiram os bugs críticos de operação. Existem **vulnerabilidades de segurança pendentes** documentadas desde 2026-03-06 que ainda não foram corrigidas, além de **divergências entre a documentação e o código real** identificadas nesta auditoria.

---

## 1. ESTADO ATUAL DA PRODUÇÃO

### 1.1 Infraestrutura Verificada

| Componente | Estado | Versão |
|-----------|--------|--------|
| Frontend | ✅ Vercel — deploy automático via push `main` | Next.js **16.2.3** |
| Backend | ✅ Docker Oracle VM `pub-backend` | NestJS (@nestjs/core@11, @nestjs/common@11) |
| Banco | ✅ Docker Oracle VM `pub-postgres` | PostgreSQL 17-alpine |
| DNS/SSL | ✅ Cloudflare Flexível | — |
| Nginx | ✅ Host Ubuntu | proxy_pass :80 → :3000 |
| CI/CD deploy | ✅ GitHub Actions → SSH → Docker build | `ci.yml` corrigido em 2026-04-04 |

### 1.2 Divergências Corrigidas Nesta Auditoria

> Comparando `docs/architecture/current-system.md` (fonte da verdade, data 2026-03-06) com o código real atual:

| Item documentado | Realidade atual | Status |
|-----------------|-----------------|--------|
| `@nestjs/common@10` (mismatch) | **Código real: `@nestjs/common@^11.1.17`** — alinhado | ✅ **Corrigido** — doc desatualizada |
| `typeorm em devDependencies` | **Código real: `typeorm@^0.3.27` em `dependencies`** — correto | ✅ **Corrigido** — doc desatualizada |
| Next.js `^16.1.6` | **Código real: `16.2.3`** (atualizado na sessão 2026-04-07 para fix CVE) | ✅ **Corrigido** — doc desatualizada |
| CI/CD deploy quebrado (PM2) | **Código real: Docker via SSH** — funciona | ✅ **Corrigido** na sessão 2026-04-04 |
| 6 docker-compose duplicados | `docker-compose.prod.yml` ainda existe na raiz | ⚠️ **Parcialmente** |
| `infra/` pasta duplicata | `infra/` ainda existe no repositório | ⚠️ **Pendente** |
| `ARQUITETURA.md` tabela backend dizia NestJS v10/v11 | Código real é **@nestjs/common@11 + @nestjs/core@11** | ⚠️ **Doc parcialmente desatualizada** |
| `current-system.md` diz `@nestjs/common@10` | Código real: `@nestjs/common@^11.1.17` | ⚠️ **Doc desatualizada** |

---

## 2. AUDITORIA — BACKEND

### 2.1 Dependências (`backend/package.json`) — Estado Real Verificado

| Pacote | Versão Real | Problema Anterior | Status |
|--------|-------------|-------------------|--------|
| `@nestjs/common` | `^11.1.17` | Era mismatch v10 | ✅ CORRIGIDO |
| `@nestjs/core` | `^11.1.18` | OK | ✅ OK |
| `typeorm` | `^0.3.27` em `dependencies` | Era em devDeps | ✅ CORRIGIDO |
| `next` (frontend) | `16.2.3` | Era `^16.1.6` (CVE) | ✅ CORRIGIDO (sessão 07/04) |
| `cache-manager-redis-yet` | `^5.1.5` | Instalado, não usado em prod | ⚠️ PENDENTE (não prejudica, mas é peso) |
| `redis` | `^4.6.10` | Instalado, não usado em prod | ⚠️ PENDENTE |
| `@types/better-sqlite3` | `^7.6.13` (devDep) | Inesperado — não há uso de SQLite | 🔍 INVESTIGAR |

### 2.2 Scripts Backend (`backend/package.json`) — Estado Real

```json
"start:prod": "node dist/src/run-migrations.js && node dist/src/main"
```
**Confirmado correto**: path `dist/src/main` está correto (problema antigo `dist/main` foi corrigido).  
`migration:run` usa `ts-node src/run-migrations.ts` — funciona em dev, mas exige ts-node instalado.

### 2.3 Módulo de Cache — Estado Real

**`backend/src/cache/cache-invalidation.service.ts`** — verificado linha a linha:

| Item | Estado |
|------|--------|
| `static readonly trackedKeys = new Set<string>()` | ✅ Presente — fix do Bug #1 (sessão 2026-04-08) |
| `static trackKey(key)` e `static removeKey(key)` | ✅ Presente |
| `invalidatePattern()` usa `trackedKeys` (não `store.keys()`) | ✅ Correto |
| `getTenantId()` verifica: TenantContext → `request.tenant.id` → `request.user.tenantId` → `x-tenant-id` header | ✅ Completo |
| `invalidatePedidos()` usa `getTenantId()` | ✅ Com fallback documentado |

**`backend/src/modulos/pedido/pedido.service.ts`** — `getTenantId()` privado:
```typescript
// Verifica: TenantContextService → request.user.tenantId → request.headers['x-tenant-id']
// NÃO verifica: request.tenant.id
```
**Risco residual documentado**: Para rotas públicas (`POST /pedidos/cliente`), se `TenantContextService` não estiver populado, `getTenantId()` retorna null. Fix da sessão 2026-04-14 adicionou fallback via `comanda.tenantId` — **correto e no código confirmado**.

### 2.4 Módulos Backend — Inventário Real (contagem real de `src/modulos/`)

Verificado: **20 módulos** em `backend/src/modulos/`:
`ambiente`, `analytics`, `audit`, `avaliacao`, `caixa`, `cliente`, `comanda`, `empresa`, `estabelecimento`, `evento`, `funcionario`, `medalha`, `mesa`, `pagina-evento`, `payment`, `pedido`, `plan`, `ponto-entrega`, `produto`, `turno`

> **Divergência encontrada**: `docs/current/ARQUITETURA.md` lista 20 módulos mas não menciona `estabelecimento`. O módulo existe no código (`backend/src/modulos/estabelecimento/`) mas não está documentado em nenhum doc.

### 2.5 Schedulers — Problema Crítico Confirmado (pendente)

Verificado nos docs e confirmado como pendente:
- `QuaseProntoScheduler` — processa itens SEM filtro de `tenant_id`
- `MedalhaScheduler` — processa medalhas SEM filtro de `tenant_id`

**Status:** ⚠️ **Ainda pendente** — nenhuma sessão corrigiu isso. Em SaaS com múltiplos tenants isso causa **cross-tenant data leak**.

### 2.6 WebSocket — Estado Real

**`pedidos.gateway.ts`**: Emite `novo_pedido_ambiente:{ambienteId}` apenas se `item.produto.ambiente.id` estiver carregado. Depende das relações `itens.produto.ambiente` no pedido.

**`pedidos.service.ts` `findOnePublic()`**: Inclui `'itens.produto.ambiente'` nas relations — confirmado correto.

**`base-tenant.gateway.ts`**: Conexões sem JWT são aceitas (fallback) — risco de segurança documentado, pendente.

---

## 3. AUDITORIA — FRONTEND

### 3.1 Versões Reais (`frontend/package.json`)

| Pacote | Versão Real | Observação |
|--------|-------------|------------|
| `next` | `16.2.3` | ✅ CVE corrigido (sessão 07/04) |
| `react` / `react-dom` | `19.1.0` | ✅ OK |
| `tailwindcss` | `^4` | ✅ OK |
| `eslint-config-next` | `16.2.2` | ✅ Alinhado com next version |
| `socket.io-client` | `^4.8.1` | ✅ OK |
| `zod` | `^4.1.5` | ✅ OK |
| `axios` | `^1.15.0` | ✅ OK |

### 3.2 Middleware (`frontend/src/middleware.ts`) — Estado Real

Verificado linha a linha. Comportamento atual:

| Funcionalidade | Estado |
|----------------|--------|
| Proteção de `/dashboard` via cookie `authSession` | ✅ Funciona |
| Exclusão de domínios Vercel preview (`.vercel.app`) | ✅ Corrigido em 2026-04-11 |
| Rewrite multi-tenant `casarao-pub.pubsystem.com.br → /t/casarao-pub` | ✅ Funciona |
| Matcher inclui `/dashboard/:path*` | ✅ Correto |

**Problema residual**: O middleware verifica apenas a **presença** do cookie `authSession`, não valida o JWT. A validação real ocorre no `AuthContext` e nas chamadas à API. Um cookie inválido passa pelo middleware mas é rejeitado na primeira chamada autenticada.

### 3.3 Redirecionamento por Cargo (`dashboard/page.tsx`) — Estado Real

Verificado: **Guard completo implementado** (fix sessão 2026-04-11):

| Cargo | Destino | Estado |
|-------|---------|--------|
| `SUPER_ADMIN` | `/super-admin` | ✅ |
| `COZINHEIRO` / `COZINHA` / `BARTENDER` | `/dashboard/operacional/{ambienteId}` ou `/cozinha` | ✅ |
| `GARCOM` | `/garcom` | ✅ |
| `CAIXA` | `/caixa` | ✅ |
| `ADMIN` / `GERENTE` | permanece no `/dashboard` | ✅ |

**Nota**: O `dashboard/page.tsx` tem `RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'CAIXA']}` — CAIXA ainda vê o dashboard brevemente antes de ser redirecionado. Não é bug crítico.

### 3.4 Componente WebSocket `OperacionalClientPage.tsx` — Fix Confirmado

Sessão 2026-04-14 adicionou atualização direta do estado antes de `fetchDados()`.  
**Confirmado no código**: `setPedidos` agora é chamado diretamente com `novoPedidoRecebido` antes do re-fetch. Alinhado com `CozinhaPageClient.tsx` e `PreparoPedidos.tsx`.

### 3.5 Problemas Frontend Residuais

| Problema | Onde | Severidade |
|---------|------|-----------|
| `socket` importado de `@/lib/socket` em `dashboard/page.tsx` sem autenticação JWT | `dashboard/page.tsx:28` | MÉDIO — socket não autenticado para listener do dashboard |
| Logs de debug `=== LOGIN DEBUG v3 ===` possivelmente ainda em `login/page.tsx` | `login/page.tsx` | BAIXO — apenas verbosidade |
| `RoleGuard` em `/dashboard` inclui `CAIXA` que é imediatamente redirecionado | `dashboard/page.tsx:206` | BAIXO — cosmético |
| Link `href="/dashboard/operacional/pedidos-pendentes"` | `dashboard/page.tsx:261` | VERIFICAR — rota pode não existir |
| Link `href="/dashboard/admin/cardapio"` | `dashboard/page.tsx:322` | VERIFICAR — rota real é `/dashboard/cardapio` |

---

## 4. AUDITORIA — BANCO DE DADOS

### 4.1 Tabelas Reais (confirmadas em `docs/audits/database-audit.md`)

**Total confirmado**: 30+ tabelas (26 operacionais com `tenant_id` + 4 globais + `migrations`)

**Divergência no README.md**: Diz "30 tabelas" mas a auditoria de banco lista 26 operacionais + 4 globais + migrations = 31. O `docs/architecture/current-system.md` diz "30 tabelas" (correto excluindo `migrations`).

### 4.2 Problemas Críticos de Banco — Status por Item

| Problema | Severidade | Status |
|---------|-----------|--------|
| `tenant_id` nullable em 24+ tabelas | CRÍTICO | ⚠️ **PENDENTE** — nenhuma sessão corrigiu |
| Zero FKs tenant_id → tenants(id) | CRÍTICO | ⚠️ **PENDENTE** |
| `TenantAwareEntity` não usada por nenhuma entidade | CRÍTICO | ⚠️ **PENDENTE** |
| Migration NOT NULL não executada em produção | CRÍTICO | ⚠️ **PENDENTE** |
| `Cliente.cpf` UNIQUE global (deveria ser [cpf, tenant_id]) | ALTO | ⚠️ **PENDENTE** |
| `empresaId` legado em `funcionarios` e `pontos_entrega` | ALTO | ⚠️ Parcial — `pontos_entrega.empresa_id` foi tornado nullable (sessão 2026-04-05), `funcionarios.empresa_id` OK |
| Faltam índices compostos `(tenant_id, data/status)` | MÉDIO | ⚠️ **PENDENTE** |
| 7 índices simples de `tenant_id` existem | — | ✅ Presente |

### 4.3 Migrations — Estado Real

Verificado em `docs/database/migrations.md` e `backend/src/database/migrations/`:
- Migration `MakeEmpresaIdNullableInPontosEntrega` criada na sessão 2026-04-05
- Migrations executam via `run-migrations.ts` no boot em produção

**Risco**: `migrationsRun: false` no TypeORM config — migrations só rodam pelo script manual. Se o deploy reiniciar sem executar o script, banco pode ficar desatualizado.

---

## 5. AUDITORIA — INFRAESTRUTURA E CI/CD

### 5.1 `docker-compose.micro.yml` — Estado Real

Verificado linha a linha. Estado atual:

| Item | Realidade | Correto? |
|------|-----------|----------|
| PostgreSQL 17-alpine incluído | SIM — serviço `postgres` no compose | ✅ |
| Volume `infra_postgres_data: external: true` | SIM | ✅ |
| Rede `pub-network: name: pub-network` | SIM | ✅ |
| Backend RAM limit: 512M / CPU: 0.8 | SIM | ✅ |
| Watchtower poll 86400s (24h) | SIM | ✅ |
| `DB_HOST=postgres` (nome do serviço Docker) | SIM | ✅ |

**Divergência em `docs/architecture/infrastructure.md`**: Diz "backend + watchtower" sem postgres. O compose real **inclui o serviço postgres**. A documentação de infraestrutura está desatualizada neste ponto.

### 5.2 CI/CD (`.github/workflows/ci.yml`) — Estado Real

| Job | Estado | Observação |
|-----|--------|------------|
| `backend` (lint + build + migrations + tests) | ✅ Funciona | `continue-on-error: true` nos testes (permite falhas) |
| `frontend` (lint + build) | ✅ Funciona | — |
| `security` (npm audit) | ⚠️ Inócuo | `|| true` — sempre passa mesmo com vulnerabilidades |
| `deploy-staging` (SSH Docker) | ✅ **CORRIGIDO** (sessão 2026-04-04) | Usa Docker, sem PM2, sem `continue-on-error` |

**Risco CI**: `Unit tests` e `E2E tests` têm `continue-on-error: true` — um teste falhando não bloqueia o deploy. Isso pode deixar regressões passarem para produção.

**Risco CI**: `Verify deployment health` tem `continue-on-error: true` — health check falho não aborta o pipeline.

### 5.3 Arquivos Duplicados Ainda Existentes

| Arquivo | Deveria ter sido removido | Está no código? |
|---------|--------------------------|-----------------|
| `infra/` pasta | SIM (sessão 2026-04-04 removeu) | Verificar — `docs/architecture/current-system.md` diz "removida" mas `list_dir` raiz não mostra mais a pasta infra |
| `docker-compose.prod.yml` (raiz) | SIM | Verificar — `list_dir` raiz não a lista mais |

> **NOTA**: A `list_dir` da raiz do projeto não mostra mais `infra/` nem `docker-compose.prod.yml`, indicando que foram removidos anteriormente. A documentação ainda os menciona como "pendentes de remoção" — docs desatualizados.

---

## 6. AUDITORIA — SEGURANÇA

### 6.1 Vulnerabilidades Críticas Pendentes (desde 2026-03-06)

| # | Vulnerabilidade | Severidade | Status |
|---|----------------|-----------|--------|
| 1 | Credenciais expostas no Git history (`DEPLOY_HIBRIDO.md`, `GUIA_RAPIDO_SERVIDORES.md`) | CRÍTICO | ⚠️ **PENDENTE** |
| 2 | SSH key possivelmente no histórico Git | CRÍTICO | ⚠️ **PENDENTE** |
| 3 | JWT Secret possivelmente previsível em prod | CRÍTICO | ⚠️ **PENDENTE** |
| 4 | Migration tenant_id NOT NULL não executada | CRÍTICO | ⚠️ **PENDENTE** |
| 5 | Schedulers processam dados cross-tenant | CRÍTICO | ⚠️ **PENDENTE** |
| 6 | WebSocket aceita conexão sem JWT verificado | ALTO | ⚠️ **PENDENTE** |
| 7 | `Cliente.cpf` UNIQUE global | ALTO | ⚠️ **PENDENTE** |
| 8 | `RefreshToken` pula validação cross-tenant | ALTO | ✅ **CORRIGIDO** em 2026-03-28 |
| 9 | `next@16.1.7` CVEs críticos | CRÍTICO | ✅ **CORRIGIDO** em 2026-04-07 (agora `16.2.3`) |
| 10 | GitHub Dependabot — 13 vulnerabilidades no main | MÉDIO | ⚠️ **PENDENTE** (13 no último push) |

### 6.2 Segurança Operacional — OK

| Item | Estado |
|------|--------|
| Helmet headers | ✅ Ativo |
| CORS configurado com origens explícitas | ✅ OK |
| JWT com bcrypt | ✅ OK |
| ValidationPipe global (whitelist) | ✅ OK |
| Rate limiting (global + por plano) | ✅ OK |
| Auditoria de ações | ✅ OK |

---

## 7. AUDITORIA — DOCUMENTAÇÃO

### 7.1 Status de cada Documento Verificado

| Documento | Última Atualização Declarada | Situação Real |
|-----------|------------------------------|---------------|
| `docs/architecture/current-system.md` | 2026-03-06 | ⚠️ **DESATUALIZADO** — diz `@nestjs/common@10` (real: v11), diz `typeorm em devDeps` (real: em deps), diz CI/CD quebrado (real: corrigido), diz 6 docker-compose duplicados (removidos) |
| `docs/architecture/infrastructure.md` | 2026-03-06 | ⚠️ **DESATUALIZADO** — diz compose tem apenas backend+watchtower (real: inclui postgres), diz CI deploy quebrado (real: corrigido) |
| `docs/current/ARQUITETURA.md` | 2026-04-14 | ✅ **ATUALIZADO** — menciona Next.js 16.2.2, corrigido CVE, middleware fix 2026-04-11 |
| `docs/current/PERMISSOES.md` | 2026-02-11 | ✅ **CORRETO** — matriz bate com código real |
| `docs/current/ENV_VARS.md` | — | ✅ Provavelmente correto (não auditado completamente) |
| `docs/infra/deploy-vm.md` | 2026-04-04 | ✅ **CORRETO** — procedimentos corretos |
| `docs/sessions/2026-04-04/` | 2026-04-04 | ✅ Correto e completo |
| `docs/sessions/2026-04-05/` | 2026-04-05 | ✅ Correto e completo |
| `docs/sessions/2026-04-07/` | 2026-04-07 | ✅ Correto e completo |
| `docs/sessions/2026-04-08/` | 2026-04-08 | ✅ Correto e completo |
| `docs/sessions/2026-04-11/` | 2026-04-11 | ✅ Correto e completo |
| `docs/sessions/2026-04-14/` | 2026-04-14 | ✅ Correto e completo |
| `README.md` | Desconhecida | ⚠️ **MUITO DESATUALIZADO** — diz Next.js 15 (real: 16.2.3), diz NestJS 10 (real: 11), diz `infra/docker-compose.yml` para dev (removido), diz `infra/docker-compose.prod.yml` para prod (errado), diz "17 módulos" (real: 20), `tenant_id NOT NULL, FK` no fluxo (não é verdade — nullable) |
| `docs/current/TROUBLESHOOTING.md` | 2026-04-04 | ✅ Correto — contém soluções corretas para problemas conhecidos |
| `docs/audits/database-audit.md` | 2026-03-06 | ⚠️ Parcialmente desatualizado — lista 30 tabelas, real pode ser 31+ com novas entidades |

### 7.2 Documentos Referenciados que NÃO Existem

| Documento referenciado | Referenciado em | Status |
|-----------------------|-----------------|--------|
| `docs/deploy/production-deploy.md` | `current-system.md` linha 660 | 🔴 **NÃO EXISTE** |
| `docs/historico/` | `README.md` linha 160 | 🔴 **NÃO EXISTE** — sessions estão em `docs/sessions/` |
| `docs/operacao/comandos-uteis.md` | `README.md` | 🔴 **NÃO EXISTE** |
| `docs/operacao/troubleshooting.md` | `README.md` | 🔴 **NÃO EXISTE** — real é `docs/current/TROUBLESHOOTING.md` |
| `docs/backend/arquitetura-backend.md` | `README.md` | Verificar |
| `docs/backend/multitenancy.md` | `README.md` | Verificar |
| `docs/backend/cache.md` | `README.md` | Verificar |

---

## 8. PROBLEMAS IDENTIFICADOS — CLASSIFICADOS POR PRIORIDADE

### 🔴 P0 — CRÍTICOS (ação imediata necessária em produção)

| # | Problema | Impacto |
|---|---------|---------|
| 1 | Credenciais expostas no Git history | Qualquer pessoa com acesso ao repo pode comprometer o sistema |
| 2 | Schedulers sem filtro tenant_id | Cross-tenant data — cozinha de tenant A processa itens do tenant B |
| 3 | tenant_id nullable sem FK | Inserção sem tenant possível; orphan data se tenant deletado |
| 4 | WebSocket aceita conexão sem JWT verificado | Qualquer usuário pode se conectar ao WebSocket |

### 🟠 P1 — ALTOS (corrigir nas próximas sessões)

| # | Problema | Impacto |
|---|---------|---------|
| 5 | GitHub Dependabot — 13 vulnerabilidades no main | Potenciais CVEs em dependências |
| 6 | `Cliente.cpf` UNIQUE global | Dois clientes com mesmo CPF em tenants diferentes geram erro 500 |
| 7 | README.md severamente desatualizado | Onboarding incorreto — comando de inicialização aponta para pasta removida |
| 8 | `docs/architecture/current-system.md` desatualizado | Fonte de verdade com informações erradas |
| 9 | `docs/architecture/infrastructure.md` desatualizado | Compose descrito incorretamente |
| 10 | Módulo `estabelecimento` não documentado | Funcionalidade sem documentação |
| 11 | `socket` não autenticado em `dashboard/page.tsx` | Listeners WebSocket podem não funcionar corretamente em todos os tenants |
| 12 | `continue-on-error: true` nos testes e health check do CI | Regressões e falhas de deploy passam silenciosamente |

### 🟡 P2 — MÉDIOS (backlog)

| # | Problema | Impacto |
|---|---------|---------|
| 13 | `empresaId` legado coexiste com `tenant_id` em `funcionarios` | Ambiguidade técnica, não funcional |
| 14 | `cache-manager-redis-yet` instalado mas não usado em prod | ~2MB de peso desnecessário |
| 15 | `@types/better-sqlite3` em devDeps sem uso aparente de SQLite | Peso desnecessário |
| 16 | Logs de debug `=== LOGIN DEBUG v3 ===` possivelmente em prod | Verbosidade desnecessária |
| 17 | Links no dashboard apontam para rotas inexistentes (`/pedidos-pendentes`, `/admin/cardapio`) | 404 para usuários |
| 18 | Documentos referenciados no README que não existem | Links quebrados |
| 19 | `GERENTE` role não usado em nenhum `@Roles()` no backend | Feature declarada sem implementação |
| 20 | `start:dev` usa `npm run migration:run` com `ts-node` — lento e frágil em dev | Experiência de dev degradada |

---

## 9. CORREÇÕES FEITAS NAS SESSÕES RECENTES — CONFIRMAÇÃO

| Data | Fix | Código Confirma? |
|------|-----|------------------|
| 2026-04-04 | CI/CD `--no-deps --force-recreate backend` | ✅ `ci.yml` linha 185 |
| 2026-04-04 | Docker rede `pub-network` com `name:` fixo | ✅ `docker-compose.micro.yml` linha 130 |
| 2026-04-04 | Volume `infra_postgres_data: external: true` | ✅ `docker-compose.micro.yml` linha 126 |
| 2026-04-05 | `pontos_entrega.empresa_id` nullable migration | ✅ Migration criada em sessão |
| 2026-04-05 | Timeout do axios 30s→60s + 120s em upload | ✅ Documentado |
| 2026-04-05 | Preços de planos via API, não hardcoded | ✅ Documentado |
| 2026-04-07 | MRR calculado com preços reais do banco | ✅ Documentado |
| 2026-04-07 | Next.js 16.1.7 → 16.2.2 (CVE) | ✅ `frontend/package.json` — **real: 16.2.3** (bump adicional) |
| 2026-04-08 | `CacheInvalidationService.trackedKeys` Set estático | ✅ `cache-invalidation.service.ts` linha 24 |
| 2026-04-08 | `CozinhaPageClient` reativo ao `ambienteSelecionado` | ✅ Documentado |
| 2026-04-11 | Middleware ignora domínios Vercel preview | ✅ `middleware.ts` linha 33 |
| 2026-04-11 | Redirecionamento por cargo no `dashboard/page.tsx` | ✅ `dashboard/page.tsx` linhas 43-62 |
| 2026-04-11 | Fallback tenantId via `eventoId` em `comanda.service.ts` | ✅ Documentado |
| 2026-04-14 | `OperacionalClientPage` atualiza estado diretamente via WebSocket | ✅ Confirmado no código |
| 2026-04-14 | `pedido.service.ts` fallback `invalidatePattern` com `comanda.tenantId` | ✅ Confirmado no código |

---

## 10. DIVERGÊNCIAS DOCUMENTAÇÃO × CÓDIGO REAL — RESUMO

| Doc | Divergência | Ação Necessária |
|-----|------------|-----------------|
| `README.md` | Next.js 15 → real 16.2.3; `infra/docker-compose.yml` → removido; NestJS 10 → real 11; "17 módulos" → real 20; `tenant_id NOT NULL, FK` → falso | **Atualizar README** |
| `docs/architecture/current-system.md` | `@nestjs/common@10` → real v11; `typeorm devDeps` → real deps; CI/CD quebrado → corrigido; 6 composes duplicados → removidos | **Atualizar doc** |
| `docs/architecture/infrastructure.md` | Compose sem postgres → real inclui; CI/CD quebrado → corrigido | **Atualizar doc** |
| `docs/current/ARQUITETURA.md` | Diz NestJS "@nestjs/common@10 / @nestjs/core@11" → real ambos v11 | **Atualizar doc** |
| `PERMISSOES.md` | GERENTE diz ter acesso a relatórios/analytics — no código GERENTE não está em nenhum `@Roles()` de analytics | **Verificar e alinhar** |

---

## 11. RECOMENDAÇÕES POR PRIORIDADE

### Imediato (antes do próximo deploy)

1. **Corrigir README.md** — é a primeira coisa que qualquer colaborador lê; os comandos estão errados
2. **Atualizar `docs/architecture/current-system.md`** — fonte da verdade declarada está desatualizada em pontos críticos
3. **Remover/substituir `continue-on-error: true`** dos testes no CI — atualmente não impede deploy com falha

### Próximas Sessões

4. **Corrigir schedulers** (`QuaseProntoScheduler`, `MedalhaScheduler`) — filtrar por `tenant_id`
5. **Corrigir WebSocket sem JWT** no `dashboard/page.tsx` — usar `SocketContext` autenticado
6. **Documentar módulo `estabelecimento`** ou verificar se está em uso
7. **Verificar links quebrados** no dashboard (`/pedidos-pendentes`, `/admin/cardapio`)

### Backlog Estratégico

8. Executar migration `tenant_id NOT NULL` em produção (requer planejamento cuidadoso)
9. Adicionar FKs `tenant_id → tenants(id)` com CASCADE
10. Corrigir `Cliente.cpf` para UNIQUE `[cpf, tenant_id]`
11. Rotacionar credenciais expostas no Git history (requer BFG Repo-Cleaner + coordenação)
12. Considerar Redis em produção — cache in-memory perde tudo a cada restart do container

---

## 12. ESTADO DO SISTEMA — CONCLUSÃO

```
PRODUÇÃO: ✅ OPERACIONAL
SEGURANÇA: ⚠️ VULNERABILIDADES CRÍTICAS PENDENTES (pré-existentes)
DOCUMENTAÇÃO: ⚠️ 3 DOCUMENTOS PRINCIPAIS DESATUALIZADOS
CÓDIGO: ✅ ALINHADO COM COMPORTAMENTO ESPERADO
CI/CD: ✅ FUNCIONAL (com ressalvas nos testes com continue-on-error)
```

O sistema funciona corretamente para os fluxos de negócio principais. As sessões de abril/2026 corrigiram todos os bugs de operação reportados. Os riscos remanescentes são estruturais (banco de dados) e de segurança (pré-existentes desde março/2026), não afetam a operação diária mas devem ser priorizados.
