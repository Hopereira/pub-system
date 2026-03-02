# Correções Executadas — Auditoria de Segurança

**Data:** 2026-02-11  
**Escopo:** P0 (crítico), P1 (alto), P2 (produção)

---

## P0 — Correções Críticas

### 1. SSH Key privada removida do repositório

| Campo | Detalhe |
|-------|---------|
| **Erro** | Chave SSH privada (`ssh-key-2025-12-11.key`) commitada na raiz do repo |
| **Risco** | Acesso não autorizado ao servidor Oracle VM |
| **Solução** | Arquivo deletado do repo + `.gitignore` atualizado com `*.key`, `*.pem`, `*.p12`, `*.pfx`, `id_rsa*`, `ssh-key*` |
| **Arquivos** | `.gitignore` (editado), `ssh-key-2025-12-11.key` (deletado) |
| **Impacto** | Nenhuma regressão. Chave ainda no histórico git (ver Pendências). |

### 2. Endpoint /setup/super-admin protegido

| Campo | Detalhe |
|-------|---------|
| **Erro** | `POST /setup/super-admin` público, sem autenticação — qualquer pessoa podia criar SUPER_ADMIN |
| **Risco** | Takeover completo da plataforma |
| **Solução** | Protegido com dupla verificação: `ENABLE_SETUP=true` (env var) + `SETUP_TOKEN` (token no body). Retorna 404 quando desabilitado. |
| **Arquivos** | `backend/src/auth/create-super-admin.controller.ts` (reescrito) |
| **Impacto** | Em produção, endpoint retorna 404 por padrão. Para setup inicial: setar `ENABLE_SETUP=true` e `SETUP_TOKEN=<token>` temporariamente. |

### 3. TenantRateLimitGuard reativado

| Campo | Detalhe |
|-------|---------|
| **Erro** | Guard comentado no `app.module.ts` com nota "problemas de DI" |
| **Causa raiz** | O guard já estava registrado corretamente dentro do `TenantModule` (onde tem acesso a `CACHE_MANAGER` e `TenantContextService`). O código no `app.module.ts` era uma **duplicata** que causava conflito de DI. |
| **Solução** | Removido código morto e comentário enganoso do `app.module.ts`. Guard ativo via `TenantModule`. |
| **Arquivos** | `backend/src/app.module.ts` (editado — removido import e código comentado) |
| **Impacto** | Rate limiting por tenant agora ativo: FREE=20req/min, BASIC=60, PRO=100, ENTERPRISE=500. Headers `X-RateLimit-*` retornados. |

---

## P1 — Correções de Alta Prioridade

### 4. Validação Joi completa de env vars

| Campo | Detalhe |
|-------|---------|
| **Erro** | `NODE_ENV` tinha default (não obrigatório), `REDIS_HOST/PORT` não validados, `ENABLE_SETUP` não existia |
| **Solução** | Schema Joi atualizado: `NODE_ENV` obrigatório, `REDIS_HOST/PORT` com defaults, `DB_SSL`, `DATABASE_URL`, `ENABLE_SETUP`, `SETUP_TOKEN` adicionados |
| **Arquivos** | `backend/src/app.module.ts` (schema Joi), `backend/.env.example` (atualizado) |
| **Impacto** | Backend não inicia sem `NODE_ENV` explícito. Previne deploy com configuração incompleta. |

### 5. Swagger protegido em produção

| Campo | Detalhe |
|-------|---------|
| **Status** | Já implementado — `main.ts:91` verifica `!isProduction` antes de montar Swagger |
| **Solução** | Nenhuma alteração necessária. Documentado. |
| **Impacto** | Zero. |

### 6. Refresh token migrado para httpOnly cookie

| Campo | Detalhe |
|-------|---------|
| **Erro** | Refresh token retornado no body JSON e armazenado em `localStorage` (vulnerável a XSS) |
| **Solução** | Backend agora seta refresh token como cookie `httpOnly`, `Secure` (prod), `SameSite=Lax/None`, `Path=/auth`, `MaxAge=7d`. Endpoints `/auth/refresh` e `/auth/logout` leem do cookie (com fallback body para backward compat). |
| **Arquivos** | `backend/src/auth/auth.controller.ts` (reescrito), `backend/src/main.ts` (cookie-parser adicionado) |
| **Dependências** | `cookie-parser` + `@types/cookie-parser` instalados |
| **Impacto** | Frontend precisa ser atualizado para: (1) não armazenar refresh_token em localStorage, (2) usar `credentials: 'include'` nas chamadas a `/auth/*`. Access token continua no body (armazenado em memória JS). |

---

## P2 — Melhorias de Produção

### 7. Script de backup PostgreSQL

| Campo | Detalhe |
|-------|---------|
| **Solução** | Script `scripts/backup-db.sh` — pg_dump comprimido com gzip, limpeza automática de backups antigos |
| **Uso** | `./scripts/backup-db.sh` (requer env vars DB_*) |
| **Arquivos** | `scripts/backup-db.sh` (criado) |

### 8. CI/CD Pipeline GitHub Actions

| Campo | Detalhe |
|-------|---------|
| **Solução** | `.github/workflows/ci.yml` — jobs paralelos para backend (type check + build + test) e frontend (build) |
| **Serviços** | PostgreSQL 15 + Redis 7 no CI |
| **Trigger** | Push/PR para `main` |
| **Arquivos** | `.github/workflows/ci.yml` (criado) |

### 9. Testes E2E de autenticação

| Campo | Detalhe |
|-------|---------|
| **Solução** | `backend/test/auth.e2e-spec.ts` — testes para login (httpOnly cookie), refresh (via cookie), logout (limpa cookie), sessions, e proteção do /setup/super-admin |
| **Arquivos** | `backend/test/auth.e2e-spec.ts` (criado) |

### 10. Observabilidade — Request ID correlation

| Campo | Detalhe |
|-------|---------|
| **Solução** | `LoggingInterceptor` agora gera UUID por requisição, seta header `X-Request-Id`, e inclui `rid:<uuid>` em todos os logs |
| **Arquivos** | `backend/src/common/interceptors/logging.interceptor.ts` (editado) |
| **Impacto** | Permite rastrear uma requisição end-to-end nos logs. Frontend pode enviar `X-Request-Id` para correlação. |

### 11. Frontend: migração para httpOnly cookies

| Campo | Detalhe |
|-------|--------|
| **Erro** | Frontend armazenava access_token em localStorage e não usava cookies para refresh |
| **Solução** | 3 arquivos alterados: |
| | `api.ts` — `withCredentials: true` na instância autenticada + interceptor 401 com auto-refresh transparente + fila de requests pendentes |
| | `authService.ts` — `refreshToken()` e `logoutApi()` com `withCredentials: true` |
| | `AuthContext.tsx` — logout async chama `logoutApi()` no backend + listener `authTokenRefreshed` para sincronizar estado React após refresh transparente |
| **Arquivos** | `frontend/src/services/api.ts`, `frontend/src/services/authService.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/services/__tests__/authService.test.ts` |
| **Impacto** | Refresh token nunca mais toca JavaScript. Auto-refresh transparente no 401. Logout revoga token no backend. |

---

## Documentação Atualizada

| Arquivo | Alterações |
|---------|-----------|
| `docs/current/SEGURANCA.md` | Fluxo de login com httpOnly cookies, TenantRateLimitGuard ativo com tabela de limites, observabilidade, alertas atualizados |
| `docs/current/ENV_VARS.md` | NODE_ENV obrigatório, REDIS validado, ENABLE_SETUP/SETUP_TOKEN, schema Joi atualizado |
| `backend/.env.example` | REDIS_HOST/PORT, ENABLE_SETUP, SETUP_TOKEN adicionados |

---

## Resumo de Arquivos Alterados

| Arquivo | Ação |
|---------|------|
| `.gitignore` | Editado — adicionados padrões *.key, *.pem, etc. |
| `backend/src/auth/create-super-admin.controller.ts` | Reescrito — proteção com ENABLE_SETUP + SETUP_TOKEN |
| `backend/src/auth/auth.controller.ts` | Reescrito — httpOnly cookies para refresh token |
| `backend/src/app.module.ts` | Editado — Joi schema expandido, código morto removido |
| `backend/src/main.ts` | Editado — cookie-parser adicionado |
| `backend/src/common/interceptors/logging.interceptor.ts` | Editado — request ID correlation |
| `backend/.env.example` | Editado — novas variáveis |
| `backend/test/auth.e2e-spec.ts` | Criado — testes e2e auth |
| `scripts/backup-db.sh` | Criado — script de backup |
| `.github/workflows/ci.yml` | Criado — pipeline CI/CD |
| `frontend/src/services/api.ts` | Editado — withCredentials + auto-refresh 401 interceptor |
| `frontend/src/services/authService.ts` | Editado — refreshToken() + logoutApi() |
| `frontend/src/context/AuthContext.tsx` | Editado — async logout + authTokenRefreshed listener |
| `frontend/src/services/__tests__/authService.test.ts` | Editado — withCredentials no expect |
| `docs/current/SEGURANCA.md` | Atualizado |
| `docs/current/ENV_VARS.md` | Atualizado |
| `docs/relatorios/AUDITORIA_FINAL.md` | Atualizado — todos os problemas marcados como resolvidos |
