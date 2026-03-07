# Auditoria de Infraestrutura — Pub System

**Data:** 2026-03-06
**Auditor:** Arquiteto de Software (Docker, CI/CD, Cloud, NestJS, Next.js)
**Escopo:** docker-compose files, Dockerfiles, CI/CD, nginx, scripts, docs de deploy, dependencias
**Metodo:** Leitura de todos os 6 docker-compose, 5 Dockerfiles, ci.yml, nginx.conf, package.json, docs de infra

---

## 1. Inventario de Arquivos de Infraestrutura

### 1.1 Docker Compose (6 arquivos — 3 duplicados)

| Arquivo | Localizacao | Servicos | Uso |
|---------|------------|----------|-----|
| `docker-compose.yml` | raiz | backend, redis, db, pgadmin, frontend | **DEV** — usado no dia a dia |
| `docker-compose.prod.yml` | raiz | backend, frontend, postgres | PROD — **NAO usado** |
| `docker-compose.micro.yml` | raiz | backend, watchtower | **PROD REAL** — Oracle VM |
| `docker-compose.yml` | infra/ | **IDENTICO** ao da raiz | **DUPLICATA** |
| `docker-compose.prod.yml` | infra/ | **QUASE IDENTICO** ao da raiz | **DUPLICATA** (PG 17 vs 15) |
| `docker-compose.micro.yml` | infra/ | Variante sem Cloudflare/DNS vars | **DUPLICATA** divergente |

### 1.2 Dockerfiles (5 arquivos)

| Arquivo | Base | Uso | Tamanho Final |
|---------|------|-----|---------------|
| `backend/Dockerfile` | node:20-alpine | DEV (watch mode) | ~1GB |
| `backend/Dockerfile.prod` | node:20-alpine (multi-stage) | PROD (nao usado) | ~200MB |
| `backend/Dockerfile.micro` | node:20-alpine (multi-stage) | **PROD REAL** (Oracle) | ~150MB |
| `frontend/Dockerfile` | node:20 (Debian) | DEV (com Cypress) | ~2GB |
| `frontend/Dockerfile.prod` | node:20-alpine (3-stage) | PROD (nao usado, frontend no Vercel) | ~300MB |

### 1.3 CI/CD

| Arquivo | Descricao |
|---------|-----------|
| `.github/workflows/ci.yml` | Pipeline com 4 jobs: backend, frontend, security, deploy-staging |

### 1.4 Nginx

| Arquivo | Descricao |
|---------|-----------|
| `nginx/nginx.conf` | Proxy reverso com wildcard SSL (Let's Encrypt) |

### 1.5 Scripts (raiz — 17 arquivos soltos)

| Tipo | Quantidade | Exemplos |
|------|-----------|----------|
| PowerShell (.ps1) | 12 | setup.ps1, docker-rebuild.ps1, test-*.ps1 |
| SQL (.sql) | 10 | check-*.sql, create-*.sql |
| JSON (dados teste) | 6 | test_ambientes.json, login.json |
| HTML (debug) | 1 | debug-token.html |
| **Total arquivos soltos na raiz** | **29** | — |

### 1.6 Scripts organizados (scripts/)

| Diretorio | Arquivos | Descricao |
|-----------|---------|-----------|
| scripts/deploy/ | 7 | Setup, docker start/rebuild, SSL local |
| scripts/db/ | 12 | SQL de debug, migrations manuais |
| scripts/maintenance/ | 3 | Reset sistema, expiracao |
| scripts/tests/ | 13 | Testes de cache, sprint, etc |
| scripts/ (raiz) | 5 | Backup, restore, health monitor |

---

## 2. Arquitetura Real de Producao

### 2.1 Componentes

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   VERCEL         │     │   CLOUDFLARE     │     │   ORACLE VM              │
│   Frontend       │     │   DNS + SSL      │     │   E2.1.Micro (1GB RAM)   │
│   Next.js 16     │     │   Modo Flexivel  │     │   134.65.248.235         │
│   pubsystem.com  │     │   Proxy: ON      │     │                          │
└─────────────────┘     └──────────────────┘     │  ┌─────────────────────┐  │
                                                  │  │ Nginx (host)        │  │
                                                  │  │ :80 → :3000         │  │
                                                  │  └──────────┬──────────┘  │
                                                  │             │             │
                                                  │  ┌──────────▼──────────┐  │
                                                  │  │ Docker: pub-backend │  │
                                                  │  │ NestJS :3000        │  │
                                                  │  │ (Dockerfile.micro)  │  │
                                                  │  └──────────┬──────────┘  │
                                                  │             │             │
                                                  │  ┌──────────▼──────────┐  │
                                                  │  │ Docker: pub-postgres│  │
                                                  │  │ PostgreSQL 17       │  │
                                                  │  │ :5432 (local only)  │  │
                                                  │  └─────────────────────┘  │
                                                  └──────────────────────────┘
```

### 2.2 Fluxo de Requisicao

```
Usuario → pubsystem.com.br → Vercel (frontend)
                              ↓ NEXT_PUBLIC_API_URL
                              api.pubsystem.com.br
                              ↓
                              Cloudflare (SSL Flexivel)
                              ↓ HTTP
                              134.65.248.235:80 (Nginx)
                              ↓ proxy_pass
                              localhost:3000 (Docker backend)
                              ↓ TypeORM
                              localhost:5432 (Docker postgres)
```

### 2.3 Componentes Reais vs Documentados

| Componente | Codigo Real | docs/current/DEPLOY.md | docs/current/ARQUITETURA.md | DEPLOY_HIBRIDO.md |
|-----------|-------------|----------------------|---------------------------|-------------------|
| Frontend | Vercel (Next.js 16) | Vercel (Next.js 15) | Vercel (Next.js 15) | Vercel (Next.js 15) |
| Backend | Docker (NestJS mix v10/v11) | PM2 ou Docker | NestJS 10 | Docker micro |
| Banco | PG 17 Docker local | Neon Cloud | PG 15 | Neon Cloud |
| Cache | In-memory (sem Redis prod) | Redis | Redis 7 | — |
| Proxy | Nginx no host | Nginx | — | Cloudflare Tunnel |
| SSL | Cloudflare Flexivel | Cloudflare Flexivel | Cloudflare | Cloudflare Tunnel |
| Deploy | docker-compose.micro.yml | PM2 | Docker | docker-compose.micro.yml |
| CI/CD | GitHub Actions → PM2 (FALHO) | PM2 | — | — |

---

## 3. Problemas Criticos

### 3.1 CRITICO — Credenciais expostas em 2 arquivos versionados

**Arquivos:** `DEPLOY_HIBRIDO.md` e `GUIA_RAPIDO_SERVIDORES.md`

Dados expostos:
- **JWT Secret:** `pub-system-jwt-secret-2024-production`
- **DB Password Neon:** `npg_AiCeM9ju7rLT`
- **DB Host Neon:** `ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech`
- **DB User:** `neondb_owner`
- **IP servidor:** `134.65.248.235`
- **Admin credentials:** `admin@admin.com / admin123`
- **SSH key path:** `~/.ssh/oracle_key`

**Impacto:** Qualquer pessoa com acesso ao repositorio (mesmo forks) tem acesso total ao banco de dados, servidor e painel admin.

**Acao imediata:**
1. Rotacionar todas as credenciais expostas
2. Remover os 2 arquivos do Git history (`git filter-branch` ou BFG)
3. Nunca mais versionar credenciais

### 3.2 CRITICO — CI/CD deploy usa PM2 mas servidor usa Docker

```yaml
# ci.yml:174
pm2 restart pub-backend || pm2 start dist/main.js --name pub-backend
```

O servidor roda Docker (`docker-compose.micro.yml`), mas o CI/CD tenta usar PM2. **O deploy automatico NUNCA funciona.**

Alem disso, o path esta errado: `dist/main.js` vs real `dist/src/main.js`.

### 3.3 CRITICO — NestJS version mismatch

```json
// backend/package.json
"@nestjs/common": "^10.0.0",    // v10
"@nestjs/core": "^11.1.16",     // v11
"@nestjs/platform-express": "^11.1.16",  // v11
```

`@nestjs/common` esta na v10 enquanto `@nestjs/core` esta na v11. Isso causa incompatibilidades em runtime e e um bug de configuracao que deveria impedir o build.

### 3.4 CRITICO — 6 docker-compose duplicados e divergentes

| Diferenca | raiz/ | infra/ |
|-----------|-------|--------|
| `docker-compose.yml` | Identicos | **DUPLICATA EXATA** |
| `docker-compose.prod.yml` | PG `postgres:15-alpine` | PG `postgres:17-alpine` |
| `docker-compose.micro.yml` | Tem Cloudflare vars, env `.env` | Sem Cloudflare, env `.env.micro` |

A pasta `infra/` nao contem mais nada alem dos 3 docker-compose. E uma pasta-lixo.

### 3.5 CRITICO — Sem Redis em producao

O `docker-compose.micro.yml` (usado em prod) NAO inclui Redis. O backend em producao usa cache in-memory. Isso causa:
- Perda de cache a cada restart do container
- Sem invalidacao de cache entre instancias
- Rate limiting apenas em memoria (nao distribuido)

---

## 4. Problemas Altos

### 4.1 ALTO — docker-compose.prod.yml env_file errado

```yaml
# docker-compose.prod.yml (raiz):20
env_file:
  - ./backend/.env
```

Espera `.env` dentro de `backend/`, mas o padrao e `.env` na raiz do projeto. Se usado, o backend nao inicia.

### 4.2 ALTO — docker-compose.prod.yml NEXT_PUBLIC_API_URL errado

```yaml
# docker-compose.prod.yml:51
environment:
  - NEXT_PUBLIC_API_URL=http://backend:3000
```

`NEXT_PUBLIC_API_URL` e uma variavel client-side (browser). O browser nao resolve `backend:3000` (nome interno do Docker network). Deveria ser `https://api.pubsystem.com.br`.

### 4.3 ALTO — Frontend Dockerfile.prod assume standalone mode

```dockerfile
# frontend/Dockerfile.prod:65
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
CMD ["node", "server.js"]
```

Requer `output: 'standalone'` no `next.config.js`. Se nao estiver configurado, o build falha. E irrelevante pois frontend roda no Vercel, mas confuso.

### 4.4 ALTO — Frontend dev Dockerfile instala Cypress desnecessariamente

```dockerfile
# frontend/Dockerfile:6-17
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 libgtk-3-0 libgbm-dev ...
```

Instala ~500MB de dependencias do Cypress no container de dev, mas os testes usam Playwright (nao Cypress). Aumenta tempo de build e tamanho da imagem em 500MB.

### 4.5 ALTO — npm install --force no backend dev

```dockerfile
# backend/Dockerfile:17
RUN npm install --force
```

`--force` ignora conflitos de peer dependencies. Isso mascara o mismatch NestJS v10/v11 e pode causar bugs em runtime.

### 4.6 ALTO — Versao PostgreSQL inconsistente

| Arquivo | Versao |
|---------|--------|
| docker-compose.yml (dev) | `postgres:15-alpine` |
| docker-compose.prod.yml (raiz) | `postgres:15-alpine` |
| infra/docker-compose.prod.yml | `postgres:17-alpine` |
| Producao real | `postgres:17` (container Docker) |
| CI/CD (ci.yml) | `postgres:15-alpine` |

Dev e CI usam PG 15, producao usa PG 17. Pode causar incompatibilidades de SQL.

### 4.7 ALTO — 29 arquivos soltos na raiz do projeto

Arquivos de debug, teste, SQL, JSON e PowerShell poluem a raiz. Devem ser movidos para `scripts/` ou removidos.

### 4.8 ALTO — package.json na raiz do monorepo

```json
// package.json (raiz)
{
  "dependencies": {
    "@radix-ui/react-separator": "^1.1.7",
    "@tanstack/react-table": "^8.21.3",
    ...
  }
}
```

O monorepo raiz tem um `package.json` com dependencias de frontend que nao deviam estar ali. Isso cria um `node_modules` fantasma na raiz.

---

## 5. Problemas Medios

### 5.1 nginx.conf usa Let's Encrypt mas prod usa Cloudflare Flexivel

O `nginx/nginx.conf` referencia certificados Let's Encrypt:
```nginx
ssl_certificate /etc/letsencrypt/live/pubsystem.com.br/fullchain.pem;
```

Mas a producao real usa Cloudflare modo Flexivel (SSL termina no Cloudflare, Nginx recebe HTTP). O nginx.conf nunca e usado em producao.

### 5.2 Watchtower em producao sem controle

```yaml
# docker-compose.micro.yml
watchtower:
  WATCHTOWER_POLL_INTERVAL=86400  # 24h
```

Watchtower atualiza containers automaticamente a cada 24h. Se uma imagem quebrada for publicada, o sistema cai automaticamente sem rollback.

### 5.3 CI/CD Security Audit e inutil

```yaml
# ci.yml:133
run: npm audit --audit-level=critical || true
```

O `|| true` faz o audit SEMPRE passar, mesmo com vulnerabilidades criticas. E um passo cosmético.

### 5.4 Scripts duplicados raiz vs scripts/

| Script na raiz | Copia em scripts/ |
|---------------|-------------------|
| `setup.ps1` | `scripts/deploy/setup.ps1` |
| `docker-rebuild.ps1` | `scripts/deploy/docker-rebuild.ps1` |
| `docker-start.ps1` | `scripts/deploy/docker-start.ps1` |
| `instalar-dependencias.ps1` | `scripts/deploy/instalar-dependencias.ps1` |
| `reset-sistema.ps1` | `scripts/maintenance/reset-sistema.ps1` |
| `verify-setup.ps1` | `scripts/deploy/verify-setup.ps1` |
| `setup-local-hosts.ps1` | `scripts/deploy/setup-local-hosts.ps1` |
| `setup-ssl-mkcert.ps1` | `scripts/deploy/setup-ssl-mkcert.ps1` |
| `aplicar-expiracao-4h.ps1` | `scripts/maintenance/aplicar-expiracao-4h.ps1` |
| SQL files (8) | `scripts/db/` |

**9+ scripts duplicados** entre raiz e `scripts/`.

### 5.5 docs/current/DEPLOY.md inconsistente

| Item | docs/current/DEPLOY.md | Real |
|------|----------------------|------|
| Deploy backend | PM2 | Docker |
| Banco | Neon | PostgreSQL local Docker |
| Update cmd | `pm2 restart pub-system-backend` | `docker compose -f docker-compose.micro.yml up -d --build` |
| Node.js version | 18.x | 20 |
| Frontend URL | pub-system.vercel.app | pubsystem.com.br |

### 5.6 docs/current/ARQUITETURA.md inconsistente

| Item | Documentado | Real |
|------|------------|------|
| NestJS | 10 | Mix 10/11 |
| PostgreSQL | 15 | 17 |
| TypeORM | 0.3.17 | 0.3.27 |
| Next.js | 15.5.2 | 16.1.6 |
| React | 19.1.0 | 19.1.0 (correto) |
| Google Cloud Storage | 7.17.1 | 7.19.0 |

---

## 6. Divergencias Documentacao vs Codigo

### 6.1 DEPLOY_HIBRIDO.md (raiz)

| Divergencia | DEPLOY_HIBRIDO.md | Real |
|-------------|-------------------|------|
| Banco | Neon Cloud | PostgreSQL 17 Docker local |
| SSL | Cloudflare Tunnel (trycloudflare.com) | Cloudflare DNS modo Flexivel |
| Frontend URL | pub-system.vercel.app | pubsystem.com.br |
| NestJS | 10 | Mix 10/11 |
| Credenciais | Expostas em plaintext | — (CRITICO) |

### 6.2 GUIA_RAPIDO_SERVIDORES.md (raiz)

| Divergencia | Guia | Real |
|-------------|------|------|
| Banco | Neon Cloud | PG Docker local |
| Credenciais | Expostas em plaintext | — (CRITICO) |
| Update cmd | `--no-cache --force-recreate` | Excessivo para updates normais |

### 6.3 docs/current/SETUP_LOCAL.md

| Divergencia | Documentado | Real |
|-------------|------------|------|
| PostgreSQL | 15 | dev: 15, prod: 17 |
| Migrations | "executadas automaticamente pelo start:dev" | Correto no codigo (`npm run migration:run && nest start --watch`) |
| Swagger | "apenas dev" | Correto |

---

## 7. Dependencias

### 7.1 Backend — NestJS Version Mismatch

| Pacote | Versao | Deveria ser |
|--------|--------|-------------|
| `@nestjs/common` | ^10.0.0 | ^11.0.0 |
| `@nestjs/core` | ^11.1.16 | ^11.1.16 |
| `@nestjs/platform-express` | ^11.1.16 | ^11.1.16 |
| `@nestjs/schematics` | ^10.0.0 | ^11.0.0 |

### 7.2 Backend — typeorm em devDependencies

```json
"devDependencies": {
  "typeorm": "^0.3.27"
}
```

`typeorm` esta em devDependencies mas e usado em runtime (data-source.ts, migrations). Deveria estar em dependencies. O `Dockerfile.prod` roda `npm ci --only=production` que NAO instala devDeps, causando erro de `typeorm` not found em producao.

**Nota:** O `Dockerfile.micro` copia `node_modules` do builder (que tem devDeps), contornando o problema.

### 7.3 Frontend — Versoes atuais

| Pacote | Versao |
|--------|--------|
| Next.js | 16.1.6 |
| React | 19.1.0 |
| Tailwind CSS | 4 |
| TypeScript | 5 |

### 7.4 Monorepo raiz — package.json fantasma

Dependencias de frontend no package.json da raiz do monorepo. Deve ser removido ou convertido para workspace config.

---

## 8. Resumo de Riscos

### P0 — Criticos (Acao imediata)

| # | Risco | Impacto |
|---|-------|---------|
| 1 | **Credenciais expostas no Git** | Acesso total ao banco, servidor e admin |
| 2 | **CI/CD deploy NUNCA funciona** (PM2 vs Docker) | Zero deploy automatico |
| 3 | **NestJS version mismatch** (v10 vs v11) | Bugs em runtime, incompatibilidades |
| 4 | **6 docker-compose duplicados** | Confusao, divergencias silenciosas |
| 5 | **Sem Redis em producao** | Cache in-memory, perda a cada restart |

### P1 — Altos

| # | Risco | Impacto |
|---|-------|---------|
| 6 | docker-compose.prod.yml env_file errado | Backend nao inicia se usado |
| 7 | NEXT_PUBLIC_API_URL com nome interno Docker | Frontend nao conecta na API |
| 8 | Frontend Dockerfile instala Cypress (usa Playwright) | +500MB, build lento |
| 9 | npm install --force mascara mismatch | Bugs silenciosos |
| 10 | PostgreSQL 15 vs 17 inconsistente | Incompatibilidades SQL |
| 11 | 29 arquivos soltos na raiz | Projeto desorganizado |
| 12 | typeorm em devDependencies | Falha em Dockerfile.prod |

### P2 — Medios

| # | Risco | Impacto |
|---|-------|---------|
| 13 | nginx.conf com SSL nao usado | Confusao, config morta |
| 14 | Watchtower sem controle | Auto-update pode quebrar prod |
| 15 | npm audit || true | Security audit cosmético |
| 16 | 9+ scripts duplicados raiz vs scripts/ | Manutencao duplicada |
| 17 | 3 docs de deploy contraditorios | Dev nao sabe qual seguir |

---

## 9. Plano de Correcao

### Semana 1 — Urgente

1. **Rotacionar TODAS as credenciais** expostas (JWT, DB, Admin)
2. **Remover credenciais do Git history** (BFG Repo-Cleaner)
3. **Corrigir ci.yml** — trocar PM2 por Docker deploy
4. **Alinhar NestJS** — atualizar `@nestjs/common` para v11
5. **Mover typeorm** de devDeps para deps

### Semana 2 — Organizacao

6. **Deletar `infra/`** — pasta duplicada sem valor
7. **Deletar `docker-compose.prod.yml`** da raiz (nao usado)
8. **Mover 29 arquivos** da raiz para `scripts/`
9. **Remover duplicatas** de scripts
10. **Adicionar Redis** ao docker-compose.micro.yml

### Semana 3 — Documentacao

11. **Deletar** `DEPLOY_HIBRIDO.md` e `GUIA_RAPIDO_SERVIDORES.md` (credenciais + obsoleto)
12. **Atualizar** `docs/current/DEPLOY.md` com infra real
13. **Atualizar** `docs/current/ARQUITETURA.md` com versoes reais
14. **Criar** `docs/architecture/infrastructure.md` (fonte da verdade)
15. **Remover Cypress** do frontend/Dockerfile
16. **Alinhar PG version** em todos docker-compose (17)
