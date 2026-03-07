# Relatorio de Auditoria Geral — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura completa do repositorio (backend, frontend, infra, docs, CI/CD)
**Regra:** Baseado APENAS no que existe no codigo

---

## 1. Escopo da Auditoria

| Area | Arquivos lidos | Status |
|------|---------------|--------|
| Backend (NestJS) | app.module, main.ts, 19 modulos, auth, tenant, schedulers | Completo |
| Frontend (Next.js) | middleware, 30+ rotas, 22 services, package.json | Completo |
| Banco de dados | 31 entity files, data-source.ts, migrations | Completo |
| Infraestrutura | 6 docker-compose, 5 Dockerfiles, nginx, CI/CD | Completo |
| Documentacao | README, docs/current/*, docs/architecture/*, docs/audits/* | Completo |
| Deploy | scripts/, DEPLOY_HIBRIDO.md, GUIA_RAPIDO, ci.yml | Completo |

---

## 2. Resumo Executivo

O Pub System e um SaaS multi-tenant funcional com ~130 endpoints, 30 tabelas, frontend Next.js 16 e backend NestJS. O sistema opera em producao (Vercel + Oracle VM + Docker).

**Porem, possui vulnerabilidades criticas que comprometem seguranca, isolamento de dados e confiabilidade do deploy.**

### Contagem de Problemas

| Severidade | Quantidade | Exemplos |
|-----------|-----------|----------|
| **P0 — Critico** | 10 | Credenciais expostas, tenant_id nullable, schedulers cross-tenant |
| **P1 — Alto** | 15 | NestJS mismatch, typeorm em devDeps, 6 docker-compose duplicados |
| **P2 — Medio** | 8 | Scripts duplicados, nginx nao usado, docs contraditorios |
| **Total** | **33** | — |

---

## 3. Arquitetura Real

```
Frontend: Vercel → pubsystem.com.br (Next.js 16.1.6, React 19)
    ↓ HTTPS
Cloudflare: DNS + SSL Flexivel → api.pubsystem.com.br
    ↓ HTTP
Oracle VM: Nginx :80 → Docker pub-backend :3000 → Docker PG 17 :5432
```

| Componente | Documentacao antiga | Realidade |
|-----------|-------------------|-----------|
| Frontend | Next.js 15 | **Next.js 16.1.6** |
| Backend | NestJS 10 | **Mix @nestjs/common@10 + @nestjs/core@11** |
| Banco | PostgreSQL 15 / Neon Cloud | **PostgreSQL 17 Docker local** |
| Deploy | PM2 / systemd | **Docker (docker-compose.micro.yml)** |
| Cache prod | Redis | **In-memory (sem Redis)** |
| SSL | Cloudflare Tunnel / Let's Encrypt | **Cloudflare modo Flexivel** |

---

## 4. Problemas Criticos (P0)

### 4.1 Credenciais expostas no Git

**Arquivos:** `DEPLOY_HIBRIDO.md`, `GUIA_RAPIDO_SERVIDORES.md`

Dados expostos em plaintext no repositorio versionado:
- JWT Secret: `pub-system-jwt-secret-2024-production`
- DB Password Neon: `npg_AiCeM9ju7rLT`
- IP servidor: `134.65.248.235`
- Admin: `admin@admin.com / admin123`
- SSH key path

**Impacto:** Qualquer pessoa com acesso ao repo pode comprometer todo o sistema.

### 4.2 SSH key no historico Git

Arquivo `ssh-key-2025-12-11.key` removido do HEAD mas presente no historico. Nao foi executado `bfg` ou `git filter-repo`.

### 4.3 tenant_id nullable em 24 tabelas

Todas as 24 tabelas operacionais tem `tenant_id` com `nullable: true`. O banco permite INSERT sem tenant, quebrando o isolamento.

### 4.4 Zero FKs de tenant_id → tenants

Nenhuma tabela tem FK para `tenants(id)`. Deletar um tenant NAO limpa dados orfaos.

### 4.5 Migration NOT NULL nao executada

`MakeTenantIdNotNull` existe em `migrations_backup/` mas NUNCA foi executada em producao.

### 4.6 Schedulers processam dados cross-tenant

| Scheduler | Frequencia | Problema |
|----------|-----------|---------|
| `QuaseProntoScheduler` | 15 segundos | `@InjectRepository(ItemPedido)` direto — sem filtro tenant |
| `MedalhaScheduler` | 5 minutos | `@InjectRepository(Funcionario)` direto — busca TODOS garcons |

Ambos bypassam `BaseTenantRepository`, processando dados de TODOS os tenants juntos.

### 4.7 CI/CD deploy NUNCA funciona

```yaml
# ci.yml usa:
pm2 restart pub-backend || pm2 start dist/main.js
# Servidor real usa:
docker compose -f docker-compose.micro.yml up -d
```

Path tambem errado: `dist/main.js` vs real `dist/src/main.js`.

### 4.8 NestJS version mismatch

`@nestjs/common@10` misturado com `@nestjs/core@11`. Incompatibilidade de runtime.

### 4.9 Sem Redis em producao

`docker-compose.micro.yml` nao inclui Redis. Cache e in-memory — perde tudo a cada restart.

### 4.10 RefreshToken cross-tenant bypass

```typescript
// refresh-token.service.ts:89
if (tenantId && refreshToken.tenantId && refreshToken.tenantId !== tenantId) {
```

Se `tenantId` for undefined (nao enviado), a validacao e PULADA. Um token de tenant A pode ser usado no tenant B.

---

## 5. Problemas Altos (P1)

| # | Problema | Arquivo |
|---|---------|---------|
| 1 | 6 docker-compose duplicados e divergentes | raiz + infra/ |
| 2 | typeorm em devDependencies | backend/package.json |
| 3 | WebSocket aceita conexao sem JWT verificado | base-tenant.gateway.ts |
| 4 | Cliente.cpf UNIQUE global (deveria [cpf, tenant_id]) | cliente.entity.ts |
| 5 | 29 arquivos soltos na raiz | Raiz do projeto |
| 6 | Frontend Dockerfile instala Cypress (usa Playwright) | frontend/Dockerfile |
| 7 | npm install --force mascara mismatch | backend/Dockerfile |
| 8 | PostgreSQL 15 (dev/CI) vs 17 (prod) | docker-compose files |
| 9 | docker-compose.prod.yml env_file errado | docker-compose.prod.yml |
| 10 | NEXT_PUBLIC_API_URL com nome Docker interno | docker-compose.prod.yml |
| 11 | package.json fantasma na raiz | package.json |
| 12 | empresaId legado coexiste com tenant_id | funcionario, ponto_entrega |
| 13 | Faltam 7 indices compostos criticos | Banco de dados |
| 14 | start:prod path incorreto | backend/package.json |
| 15 | TenantAwareEntity existe mas ninguem herda | Entities |

---

## 6. Divergencias Documentacao vs Codigo

| Documento | Afirmacao | Realidade |
|-----------|----------|-----------|
| README.md | `docker compose -f infra/docker-compose.yml` | Deve ser `docker compose up` (raiz) |
| README.md | Next.js 15, NestJS 10 | Next.js 16.1.6, NestJS mix 10/11 |
| docs/current/DEPLOY.md | PM2, Neon Cloud | Docker, PG 17 local |
| docs/current/ARQUITETURA.md | PG 15, NestJS 10 | PG 17, NestJS mix 10/11 |
| docs/current/SEGURANCA.md | Rate limit 3/s | Codigo: 3 req/seg (correto mas doc confusa) |
| docs/current/SETUP_LOCAL.md | `infra/docker-compose.yml` | Deve ser `docker-compose.yml` (raiz) |
| DEPLOY_HIBRIDO.md | Neon + Cloudflare Tunnel | PG Docker + Cloudflare Flexivel |
| docs/current/TROUBLESHOOTING.md | `pm2 status` para verificar prod | Docker (`docker ps`) |

### Documentos Corretos (conferidos com codigo)

| Documento | Status |
|-----------|--------|
| docs/current/API.md | Correto — ~130 endpoints conferem |
| docs/current/REGRAS_NEGOCIO.md | Correto |
| docs/current/PERMISSOES.md | Correto |
| docs/current/ENV_VARS.md | Correto |
| docs/backend/multitenancy.md | Correto |
| docs/backend/cache.md | Correto |
| docs/backend/rate-limit.md | Correto |

---

## 7. Saude por Area

| Area | Nota | Justificativa |
|------|------|--------------|
| **Backend (logica)** | B | Modulos bem estruturados, 130 endpoints, WebSocket funcional |
| **Multi-tenant** | D | Isolamento via app OK, banco sem enforcement nenhum |
| **Banco** | D | tenant_id nullable, sem FKs, sem indices compostos |
| **Infraestrutura** | C | Funciona em prod mas 6 compose duplicados, sem Redis |
| **CI/CD** | F | Deploy automatico NUNCA funciona |
| **Seguranca** | D | Credenciais expostas, JWT fraco, cross-tenant bypass |
| **Frontend** | B+ | Bem organizado, 22 services, rotas por role |
| **Documentacao** | D | 60% obsoleta ou contradictoria |
| **Deploy** | C | Manual via SSH, sem rollback automatizado ate agora |

---

## 8. Proximos Passos

As auditorias detalhadas estao nos relatorios especificos:

| Relatorio | Conteudo |
|-----------|---------|
| `RELATORIO_MULTITENANT.md` | Isolamento, schedulers, refresh token, banco |
| `RELATORIO_BANCO.md` | 30 tabelas, nullable, FKs, indices, migrations |
| `RELATORIO_INFRA.md` | Docker, CI/CD, Nginx, deploy, Cloudflare |
| `RELATORIO_REFATORACAO.md` | Plano de correcoes priorizado por semana |
