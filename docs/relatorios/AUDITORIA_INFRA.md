# Auditoria de Infraestrutura — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura linha-a-linha de todos docker-compose, Dockerfiles, CI/CD, nginx, deploy scripts, docs, package.json, arquivos soltos
**Regra:** Baseado APENAS no que existe no codigo. Nada inventado.

---

## Indice de Problemas

| Severidade | Qtd | Descricao |
|-----------|-----|-----------|
| **P0 — Critico** | 8 | Credenciais expostas, deploy quebrado, seguranca |
| **P1 — Alto** | 14 | Duplicacoes, divergencias, configs erradas |
| **P2 — Medio** | 11 | Limpeza, organizacao, obsolescencia |
| **Total** | **33** | — |

---

## 1. Arquitetura Real de Producao (Confirmada)

```
                        ┌──────────────────────────────────┐
                        │         CLOUDFLARE               │
                        │  DNS + SSL (modo Flexivel)       │
                        │                                  │
                        │  pubsystem.com.br → CNAME Vercel │
                        │  api.pubsystem.com.br → A Record │
                        └──────┬──────────────┬────────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼───────────────────┐
                    │   VERCEL    │    │  ORACLE VM E2.1.Micro    │
                    │  Frontend   │    │  1 vCPU / 1GB RAM        │
                    │  Next.js    │    │  IP: 134.65.248.235      │
                    │  16.1.6     │    │                          │
                    └─────────────┘    │  ┌─ Nginx (host) :80    │
                                       │  │   proxy_pass :3000    │
                                       │  │                       │
                                       │  ├─ pub-backend (Docker) │
                                       │  │   NestJS :3000        │
                                       │  │   512MB limit         │
                                       │  │   Dockerfile.micro    │
                                       │  │                       │
                                       │  ├─ Watchtower (Docker)  │
                                       │  │   Auto-update 24h     │
                                       │  │   64MB limit          │
                                       │  │                       │
                                       │  └─ (SEM PostgreSQL      │
                                       │      no micro.yml raiz!) │
                                       └──────────────────────────┘
```

### Componentes Confirmados

| Componente | Tecnologia | Onde | Deploy |
|-----------|-----------|------|--------|
| **Frontend** | Next.js 16.1.6, React 19.1 | Vercel | Automatico (git push main) |
| **Backend** | NestJS (mix v10/v11), Node 20 | Oracle VM Docker | Manual via scripts/deploy.sh |
| **Banco** | PostgreSQL 17 Docker LOCAL | Oracle VM | Persistente (volume) |
| **Proxy** | Nginx no host Ubuntu | Oracle VM | Raramente muda |
| **DNS/SSL** | Cloudflare modo Flexivel | Cloud | Auto-gerenciado |
| **Cache** | In-memory (SEM Redis em prod) | Backend process | Perde ao restart |
| **Auto-update** | Watchtower (poll 24h) | Oracle VM | Automatico |

### Discrepancia Importante: Banco de Dados

| O que a infra DIZ | O que a infra USA |
|-------------------|-------------------|
| `docker-compose.micro.yml` (raiz): referencia "Neon PostgreSQL (cloud)" | Banco local Docker PG 17 |
| `docker-compose.micro.yml` (raiz): NAO tem servico postgres | `infra/docker-compose.micro.yml` tambem NAO tem postgres |
| `infra/docker-compose.prod.yml`: tem postgres:17-alpine | Este compose provavelmente e o usado em prod |
| Comentarios "Neon" em multiplos arquivos | Banco real e local (confirmado por docs operacionais) |

**Conclusao:** O banco roda localmente via Docker na VM. Os compose micro.yml NAO incluem o servico PostgreSQL — o banco ou foi criado manualmente ou usa o compose.prod do infra/.

---

## 2. Inventario Completo

### 2.1 Docker Compose Files (6 — 3 pares duplicados)

| # | Arquivo | Servicos | PG Version | Network | env_file | Status |
|---|---------|----------|-----------|---------|----------|--------|
| 1 | `docker-compose.yml` (raiz) | backend, redis, db, pgadmin, frontend | **15**-alpine | pub_network | `./.env` | Dev |
| 2 | `docker-compose.prod.yml` (raiz) | backend, frontend, postgres | **15**-alpine | pub-network | `./backend/.env` | Nao usado |
| 3 | `docker-compose.micro.yml` (raiz) | backend, watchtower | — | — | `./.env` | Prod (parcial) |
| 4 | `infra/docker-compose.yml` | backend, redis, db, pgadmin, frontend | **15**-alpine | pub_network | `./.env` | **DUPLICATA #1** |
| 5 | `infra/docker-compose.prod.yml` | backend, frontend, postgres | **17**-alpine | pub-network | `./backend/.env` | Prod (real?) |
| 6 | `infra/docker-compose.micro.yml` | backend, watchtower | — | — | `./.env.micro` | Prod (alternativo) |

### 2.2 Divergencias Entre Compose Files

| Aspecto | raiz/docker-compose.yml | raiz/docker-compose.prod.yml | infra/docker-compose.prod.yml |
|---------|------------------------|------------------------------|-------------------------------|
| PG version | 15-alpine | **15-alpine** | **17-alpine** |
| Network name | pub_network | pub-network | pub-network |
| env_file backend | `./.env` | `./backend/.env` | `./backend/.env` |
| Container names | pub_system_* | pub-* | pub-* |
| Redis | Sim | Nao | Nao |
| PGAdmin | Sim | Nao | Nao |
| Frontend | Sim | Sim | Sim |
| `version` key | Ausente | `'3.8'` | `'3.8'` |

| Aspecto | raiz/micro.yml | infra/micro.yml |
|---------|---------------|-----------------|
| env_file | `./.env` | `./.env.micro` |
| Cloudflare vars | Sim (CLOUDFLARE_*) | Nao |
| DNS config | `8.8.8.8`, `1.1.1.1` | Nao |
| Database comment | "Neon PostgreSQL" | "PostgreSQL 17 local" |
| GCS credentials path | `./gcs-credentials.json` | `./gcs-credentials.json` |

### 2.3 Dockerfiles (5)

| # | Arquivo | Base | Proposito | Tamanho Est. | Problemas |
|---|---------|------|----------|-------------|-----------|
| 1 | `backend/Dockerfile` | node:20-alpine | Dev | ~500MB | `npm install --force` mascara erros |
| 2 | `backend/Dockerfile.prod` | node:20-alpine (multi-stage) | Prod | ~200MB | `npm ci --only=production` pode falhar (typeorm em devDeps) |
| 3 | `backend/Dockerfile.micro` | node:20-alpine (multi-stage) | Prod micro | ~150MB | OK — prune production funciona |
| 4 | `frontend/Dockerfile` | node:20 (Debian) | Dev | ~2GB | Instala Cypress deps (+500MB) mas usa Playwright |
| 5 | `frontend/Dockerfile.prod` | node:20-alpine (multi-stage) | Prod | ~300MB | Assume output: 'standalone' no next.config |

### 2.4 Entrypoints Divergentes

| Dockerfile | CMD | Problema |
|-----------|-----|---------|
| backend/Dockerfile | `npm run start:dev` | OK (dev) |
| backend/Dockerfile.prod | `npm run start:prod` → `node dist/run-migrations.js && node dist/main` | `dist/main` ou `dist/src/main`? |
| backend/Dockerfile.micro | `node dist/src/main.js` | **Correto** — path real |
| frontend/Dockerfile | `npm run dev` | OK (dev) |
| frontend/Dockerfile.prod | `node server.js` | Requer `output: 'standalone'` |

**P0: Dockerfile.prod usa `dist/main` via npm script, mas Dockerfile.micro usa `dist/src/main.js`. O path correto e `dist/src/main.js`.**

### 2.5 CI/CD Pipeline (ci.yml — 4 jobs)

| Job | Nome | O que faz | Problemas |
|-----|------|----------|-----------|
| 1 | `backend` | lint + build + test + migrations | PG 15, Redis 7 |
| 2 | `frontend` | lint + build | OK |
| 3 | `security` | npm audit (backend + frontend) | `\|\| true` silencia tudo |
| 4 | `deploy-staging` | SSH → Oracle VM → git pull + PM2 restart | **QUEBRADO** |

### 2.6 Problema Critico do CI/CD Deploy

```yaml
# ci.yml:174 — Job deploy-staging
pm2 restart pub-backend || pm2 start dist/main.js --name pub-backend
```

**Problemas:**
1. Servidor usa **Docker**, nao PM2 — comando nunca funciona
2. Path `dist/main.js` errado — real e `dist/src/main.js`
3. `continue-on-error: true` (linha 180) silencia a falha
4. Rollback (linha 202-207) tambem usa PM2 — nunca funcionaria

### 2.7 Nginx Config

| Aspecto | Valor | Status |
|---------|-------|--------|
| Arquivo | `nginx/nginx.conf` | Template, **NAO e o nginx real em prod** |
| SSL | Let's Encrypt certs | Prod usa **Cloudflare Flexivel** (sem certs locais) |
| Upstream backend | `server backend:3000` | Nome Docker — prod usa `localhost:3000` |
| Upstream frontend | `server frontend:3000` | Frontend esta no Vercel, nao em Docker |
| Wildcard subdomain | `*.pubsystem.com.br` | Correto para multi-tenancy |
| WebSocket | `/socket.io/` proxy | OK |
| Gzip | Habilitado | OK |
| Security headers | X-Frame-Options, X-XSS-Protection | OK |

**Resumo:** O `nginx.conf` no repo e um template para cenario "tudo em Docker". Em prod, o Nginx no host faz apenas `:80 → proxy_pass :3000` (backend). Frontend nao passa pelo Nginx.

### 2.8 Deploy Scripts

| Script | Funcao | Linhas | Qualidade |
|--------|--------|--------|-----------|
| `scripts/deploy.sh` | Deploy seguro (7 steps) | 383 | **Bom** — backup, health check, rollback |
| `scripts/rollback.sh` | Rollback (3 modos) | 326 | **Bom** — db-only, code-only, full |
| `scripts/backup.sh` | Backup PG (3 tipos) | 166 | **Bom** — deploy, daily, weekly |
| `scripts/restore-db.sh` | Restore de backup | ~80 | OK |
| `scripts/health-monitor.sh` | Monitor continuo | 108 | OK — Slack webhook opcional |
| `scripts/test-backup-restore.sh` | Testa backup/restore | ~60 | OK |

**Nota positiva:** Os scripts de deploy sao bem escritos, com error handling, rollback automatico, e health checks.

---

## 3. Credenciais Expostas no Git

### 3.1 Credenciais em Plaintext (CONFIRMADAS no HEAD)

| Arquivo | O que expoe | Severidade |
|---------|-----------|-----------|
| `DEPLOY_HIBRIDO.md:36-41` | Neon DB: host, user, **password** (`npg_AiCeM9ju7rLT`) | **P0** |
| `DEPLOY_HIBRIDO.md:89` | JWT_SECRET: `pub-system-jwt-secret-2024-production` | **P0** |
| `DEPLOY_HIBRIDO.md:92-93` | Admin: `admin@admin.com / admin123` | **P0** |
| `DEPLOY_HIBRIDO.md:62` | SSH: `ubuntu@134.65.248.235` | P1 |
| `GUIA_RAPIDO_SERVIDORES.md:17` | Login: `admin@admin.com / admin123` | **P0** |
| `GUIA_RAPIDO_SERVIDORES.md:26` | SSH: `ubuntu@134.65.248.235` | P1 |
| `docs/infra/banco-de-dados.md:23` | DATABASE_URL com senha `SenhaForte123` | P1 |
| `docs/infra/banco-de-dados.md:36` | POSTGRES_PASSWORD: `SenhaForte123` | P1 |
| `docs/historico/ARCHITECTURE.md:22` | DATABASE_URL: `pubuser:SenhaForte123` | P1 |
| `docs/relatorios/RELATORIO_BANCO.md:22` | Password: `pubpass123` | P1 |
| Multiplos docs em `docs/infra/` | `pubuser` username repetido | P2 |

### 3.2 Credenciais no Historico Git

| Item | Status |
|------|--------|
| SSH key | Removida do HEAD, presente no **historico** |
| Todas as senhas acima | Presente no HEAD e no historico |
| Solucao necessaria | BFG Repo-Cleaner ou git filter-repo |

---

## 4. Versoes Inconsistentes

### 4.1 PostgreSQL

| Ambiente | Versao | Fonte |
|----------|--------|-------|
| docker-compose.yml (dev) | **15**-alpine | raiz + infra/ |
| docker-compose.prod.yml (raiz) | **15**-alpine | raiz |
| docker-compose.prod.yml (infra) | **17**-alpine | infra/ |
| CI/CD (ci.yml) | **15**-alpine | .github/workflows/ |
| Producao real | **17** | Confirmado por docs operacionais |

**3 versoes diferentes:** Dev/CI usam PG 15, prod.yml raiz usa PG 15, prod.yml infra usa PG 17 (correto).

### 4.2 NestJS (Mismatch Critico)

| Pacote | Versao | Arquivo |
|--------|--------|---------|
| @nestjs/common | ^**10**.0.0 | backend/package.json:32 |
| @nestjs/core | ^**11**.1.16 | backend/package.json:34 |
| @nestjs/platform-express | ^**11**.1.16 | backend/package.json:38 |
| @nestjs/platform-socket.io | ^**11**.1.16 | backend/package.json:39 |
| @nestjs/schedule | ^**6**.1.1 | backend/package.json:40 |
| @nestjs/swagger | ^**11**.2.6 | backend/package.json:41 |
| @nestjs/terminus | ^**11**.0.0 | backend/package.json:42 |
| @nestjs/throttler | ^**6**.5.0 | backend/package.json:43 |
| @nestjs/typeorm | ^**11**.0.0 | backend/package.json:44 |
| @nestjs/websockets | ^**11**.1.16 | backend/package.json:45 |
| @nestjs/cli (dev) | ^**11**.0.11 | backend/package.json:67 |
| @nestjs/schematics (dev) | ^**10**.0.0 | backend/package.json:68 |
| @nestjs/testing (dev) | ^**11**.1.16 | backend/package.json:69 |

**@nestjs/common@10 vs @nestjs/core@11 — major version mismatch.** `npm install --force` no Dockerfile.dev mascara este erro.

### 4.3 TypeORM em devDependencies

```json
// backend/package.json:92
"devDependencies": {
  "typeorm": "^0.3.27"
}
```

TypeORM esta em **devDependencies**, nao em dependencies. O `Dockerfile.prod` faz `npm ci --only=production` que **NAO instala devDependencies**. Em runtime, TypeORM e necessario. O `Dockerfile.micro` contorna isso com `npm prune --production --force` apos o build (copia node_modules do build stage).

### 4.4 Frontend

| Pacote | Versao |
|--------|--------|
| next | ^16.1.6 |
| react | 19.1.0 |
| react-dom | 19.1.0 |
| tailwindcss | ^4.1.10 |
| typescript | ^5 |

Frontend sem problemas de versao significativos.

---

## 5. Duplicacoes

### 5.1 Docker Compose (3 pares identicos/quase identicos)

| Par | raiz/ | infra/ | Diferenca |
|-----|-------|--------|-----------|
| Dev | `docker-compose.yml` | `infra/docker-compose.yml` | **Identico** (129 linhas) |
| Prod | `docker-compose.prod.yml` | `infra/docker-compose.prod.yml` | PG 15 vs PG 17 |
| Micro | `docker-compose.micro.yml` | `infra/docker-compose.micro.yml` | env_file, Cloudflare vars, comments |

**3 duplicatas, sendo 1 identica e 2 divergentes.**

### 5.2 Arquivos Soltos na Raiz (43 arquivos)

| Categoria | Arquivos | Deveriam Estar |
|-----------|----------|---------------|
| SQL scripts (8) | add-ordem-column.sql, check-*.sql, create-*.sql, rename-*.sql, test-*.sql | `scripts/db/` (ja existem copias la) |
| PS1 scripts (10) | docker-*.ps1, executar-*.ps1, test-*.ps1, instalar-*.ps1, etc. | `scripts/deploy/` ou `scripts/tests/` |
| JSON test data (7) | test_ambientes.json, test_mesas.json, test_produtos*.json, login.json | `scripts/tests/` (ja existem copias la) |
| Docs obsoletos (3) | DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md, RELATORIO-*.md | `docs/historico/` ou deletar |
| Debug files (1) | debug-token.html | Deletar |
| Package managers (3) | package.json, package-lock.json, yarn.lock | Raiz do monorepo? |
| Config files (3) | docker-compose*.yml (3) | Manter apenas os necessarios |
| Example files (1) | env.micro.example | OK |
| README (1) | README.md | OK |

**Total de 43 arquivos na raiz. Deveriam ser ~5 (README, docker-compose.yml, .gitignore, package.json, env.micro.example).**

### 5.3 Scripts Duplicados (raiz vs scripts/)

| Arquivo na raiz | Copia em scripts/ | Status |
|----------------|-------------------|--------|
| docker-rebuild.ps1 | scripts/deploy/docker-rebuild.ps1 | Duplicado |
| docker-start.ps1 | scripts/deploy/docker-start.ps1 | Duplicado |
| instalar-dependencias.ps1 | scripts/deploy/instalar-dependencias.ps1 | Duplicado |
| setup.ps1 | scripts/deploy/setup.ps1 | Duplicado |
| verify-setup.ps1 | scripts/deploy/verify-setup.ps1 | Duplicado |
| test-cache-validation.ps1 | scripts/tests/test-cache-validation.ps1 | Duplicado |
| test-invalidacao-cache-demo.ps1 | scripts/tests/test-invalidacao-cache-demo.ps1 | Duplicado |
| test-medalhas.ps1 | scripts/tests/test-medalhas.ps1 | Duplicado |
| test-sprint-2-1.ps1 | scripts/tests/test-sprint-2-1.ps1 | Duplicado |
| test-sprint-2-2-cache-invalidation.ps1 | scripts/tests/test-sprint-2-2-cache-invalidation.ps1 | Duplicado |
| test-sprint-3-4-completo.ps1 | scripts/tests/test-sprint-3-4-completo.ps1 | Duplicado |
| reset-sistema.ps1 | scripts/maintenance/reset-sistema.ps1 | Duplicado |
| aplicar-expiracao-4h.ps1 | scripts/maintenance/aplicar-expiracao-4h.ps1 | Duplicado |
| executar-migration-avaliacao.ps1 | scripts/db/executar-migration-avaliacao.ps1 | Duplicado |
| executar-migration-tempo.ps1 | scripts/db/executar-migration-tempo.ps1 | Duplicado |

**15 scripts duplicados** entre raiz e scripts/.

### 5.4 SQL Duplicados

| Arquivo na raiz | Copia em scripts/db/ | Status |
|----------------|---------------------|--------|
| add-ordem-column.sql | scripts/db/add-ordem-column.sql | Duplicado |
| check-ambiente.sql | scripts/db/check-ambiente.sql | Duplicado |
| check-pedido.sql | scripts/db/check-pedido.sql | Duplicado |
| check-users.sql | scripts/db/check-users.sql | Duplicado |
| create-admin.sql | scripts/db/create-admin.sql | Duplicado |
| create-agregados-table.sql | scripts/db/create-agregados-table.sql | Duplicado |
| rename-agregados.sql | scripts/db/rename-agregados.sql | Duplicado |
| test-quase-pronto.sql | scripts/db/test-quase-pronto.sql | Duplicado |

**8 SQL duplicados.**

### 5.5 JSON Test Data Duplicados

| Arquivo na raiz | Copia em scripts/tests/ | Status |
|----------------|------------------------|--------|
| test_ambientes.json | scripts/tests/test_ambientes.json | Duplicado |
| test_mesas.json | scripts/tests/test_mesas.json | Duplicado |
| test_produtos.json | scripts/tests/test_produtos.json | Duplicado |
| test_produtos_1.json | scripts/tests/test_produtos_1.json | Duplicado |
| test_produtos_2.json | scripts/tests/test_produtos_2.json | Duplicado |
| test_produtos_page2.json | scripts/tests/test_produtos_page2.json | Duplicado |
| test_produtos_preco.json | scripts/tests/test_produtos_preco.json | Duplicado |

**7 JSON duplicados.**

---

## 6. Configs Divergentes Detalhadas

### 6.1 env_file Paths

| Compose | env_file do backend | Funciona? |
|---------|-------------------|-----------|
| docker-compose.yml (raiz) | `./.env` | Sim (dev) |
| docker-compose.prod.yml (raiz) | `./backend/.env` | **Errado** — .env fica na raiz, nao em backend/ |
| docker-compose.micro.yml (raiz) | `./.env` | Sim |
| infra/docker-compose.yml | `./.env` | Erro — roda de infra/, .env esta na raiz |
| infra/docker-compose.prod.yml | `./backend/.env` | **Errado** — mesmo problema |
| infra/docker-compose.micro.yml | `./.env.micro` | Arquivo nao existe (env.micro.example existe) |

### 6.2 NEXT_PUBLIC_API_URL

| Compose | Valor | Funciona em prod? |
|---------|-------|-------------------|
| docker-compose.yml (dev) | `http://localhost:3000` | OK (dev) |
| docker-compose.prod.yml | `http://backend:3000` | **NAO** — nome Docker, nao acessivel do browser |
| docker-compose.micro.yml | Nao definido | Frontend no Vercel usa variavel propria |

### 6.3 Network Names

| Compose | Network |
|---------|---------|
| docker-compose.yml (dev) | `pub_network` |
| docker-compose.prod.yml | `pub-network` |
| docker-compose.micro.yml | (nenhum — default) |

Mistura de `pub_network` (underscore) e `pub-network` (hifen).

### 6.4 Container Names

| Compose | Backend | Postgres | Frontend |
|---------|---------|----------|----------|
| docker-compose.yml (dev) | pub_system_backend | pub_system_db | pub_system_frontend |
| docker-compose.prod.yml | pub-backend | pub-postgres | pub-frontend |
| docker-compose.micro.yml | pub-backend | — | — |

---

## 7. CI/CD Detalhado

### 7.1 Fluxo Atual

```
git push main
    │
    ├── Job 1: backend (lint + build + test + migrations) ── PG 15, Redis 7
    ├── Job 2: frontend (lint + build)
    │
    ├── Job 3: security (npm audit || true) ── silencia TUDO
    │
    └── Job 4: deploy-staging ── QUEBRADO
              ├── SSH → Oracle VM
              ├── git pull origin main
              ├── npm ci --legacy-peer-deps
              ├── npm run build
              ├── npm run typeorm:migration:run
              └── pm2 restart pub-backend  ◄── ERRO: servidor usa Docker
```

### 7.2 Problemas do CI/CD

| ID | Problema | Linha | Severidade |
|----|---------|-------|-----------|
| CI01 | Deploy usa PM2 mas servidor usa Docker | 174 | **P0** |
| CI02 | Path `dist/main.js` errado (real: `dist/src/main.js`) | 174 | **P0** |
| CI03 | `continue-on-error: true` no deploy (silencia falha) | 180 | P1 |
| CI04 | `continue-on-error: true` nos E2E tests | 86 | P1 |
| CI05 | `npm audit \|\| true` silencia auditoria de seguranca | 133, 137 | P1 |
| CI06 | PG 15 no CI vs PG 17 em prod | 25 | P1 |
| CI07 | Rollback tambem usa PM2 — nunca funcionaria | 206 | P1 |
| CI08 | Sem cache de Docker layers (rebuild completo sempre) | — | P2 |
| CI09 | `--passWithNoTests` permite CI verde sem testes | 82 | P2 |

### 7.3 Deploy Real (Confirmado)

O deploy real NAO usa CI/CD. Usa:

```bash
ssh ubuntu@134.65.248.235
cd ~/pub-system
./scripts/deploy.sh
```

O `deploy.sh` e bem escrito e funciona. O CI/CD Job 4 e decorativo.

---

## 8. Analise por Dockerfile

### 8.1 backend/Dockerfile (Dev)

```dockerfile
RUN npm install --force  # Mascara NestJS mismatch
```

| Problema | Detalhe |
|---------|---------|
| `--force` | Ignora peer dependency errors do NestJS v10 vs v11 |
| python3 + make + g++ | Necessario para bcrypt nativo — correto |
| Sem .dockerignore | Copia node_modules se existir localmente |

### 8.2 backend/Dockerfile.prod (Prod)

```dockerfile
# Stage 2
RUN npm ci --only=production --legacy-peer-deps
```

| Problema | Detalhe |
|---------|---------|
| `--only=production` | NAO instala typeorm (esta em devDeps) |
| Entrypoint | `npm run start:prod` → `node dist/run-migrations.js && node dist/main` |
| Path `dist/main` | Pode nao existir — Dockerfile.micro usa `dist/src/main.js` |

### 8.3 backend/Dockerfile.micro (Prod — USADO)

```dockerfile
# Stage 1
RUN npm install --legacy-peer-deps --production=false
RUN npm run build
RUN npm prune --production --force

# Stage 2
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/src/main.js"]
```

| Aspecto | Detalhe |
|---------|---------|
| Build strategy | Instala tudo, builda, prune → copia node_modules completo | 
| node_modules | Inteiros copiados do builder (inclui tudo que sobrou do prune) |
| Path | `dist/src/main.js` — **CORRETO** |
| Resultado | Funciona — e o que roda em producao |

### 8.4 frontend/Dockerfile (Dev)

```dockerfile
FROM node:20  # Debian full (nao alpine)
RUN apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev ...  # Cypress deps
```

| Problema | Detalhe |
|---------|---------|
| Instala Cypress deps | Projeto usa **Playwright**, nao Cypress |
| node:20 Debian | +500MB desnecessarios |
| Sem EXPOSE | Nao define porta |

### 8.5 frontend/Dockerfile.prod (Prod — NAO USADO)

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
CMD ["node", "server.js"]
```

NAO E USADO — frontend vai para Vercel. Este Dockerfile esta la "por precaucao".

---

## 9. Variaveis de Ambiente

### 9.1 Variaveis Obrigatorias (Backend)

| Variavel | Usado em | Obrigatorio |
|---------|---------|-------------|
| DB_HOST | data-source.ts | Sim |
| DB_PORT | data-source.ts | Sim (default 5432) |
| DB_USER | data-source.ts | Sim |
| DB_PASSWORD | data-source.ts | Sim |
| DB_DATABASE | data-source.ts | Sim |
| DATABASE_URL | docker-compose.micro.yml | Alternativo (Neon) |
| JWT_SECRET | auth module | Sim (min 32 chars, Joi) |
| FRONTEND_URL | CORS, cookies | Sim |
| BACKEND_URL | Links, webhooks | Sim |
| NODE_ENV | Multiplos | Sim (production) |
| ADMIN_EMAIL | Seeder | Primeiro deploy |
| ADMIN_SENHA | Seeder | Primeiro deploy |

### 9.2 Variaveis Opcionais

| Variavel | Usado em | Default |
|---------|---------|---------|
| DB_SSL | data-source.ts | false |
| DB_SYNC | app.module.ts | **false (PERIGOSO se true)** |
| REDIS_ENABLED | cache.module.ts | false |
| REDIS_HOST | cache.module.ts | localhost |
| REDIS_PORT | cache.module.ts | 6379 |
| GCS_BUCKET_NAME | storage | — |
| CLOUDFLARE_API_TOKEN | DNS automation | — |
| SLACK_WEBHOOK | health-monitor.sh | — |

### 9.3 Problema: DB_SYNC

```typescript
// app.module.ts
synchronize: process.env.DB_SYNC === 'true'
```

Se alguem setar `DB_SYNC=true` no .env, TypeORM vai alterar o schema automaticamente em producao. **Deve ser forcado `false` no codigo, sem env var.**

---

## 10. Catalogo Completo de Problemas

### P0 — Critico (8)

| ID | Problema | Onde |
|----|---------|------|
| P0-01 | JWT_SECRET exposto em plaintext: `pub-system-jwt-secret-2024-production` | DEPLOY_HIBRIDO.md:89 |
| P0-02 | DB Password Neon exposta: `npg_AiCeM9ju7rLT` | DEPLOY_HIBRIDO.md:39 |
| P0-03 | Admin credentials expostas: `admin@admin.com / admin123` | DEPLOY_HIBRIDO.md:92-93, GUIA_RAPIDO.md:17 |
| P0-04 | CI/CD deploy usa PM2 — servidor usa Docker (deploy nunca funciona) | ci.yml:174 |
| P0-05 | CI/CD path errado: `dist/main.js` vs real `dist/src/main.js` | ci.yml:174 |
| P0-06 | Dockerfile.prod `npm ci --only=production` nao instala typeorm (devDeps) | Dockerfile.prod:45 |
| P0-07 | `start:prod` script usa `dist/main` — path pode nao existir | package.json:16 |
| P0-08 | Credenciais no historico Git (mesmo se removidas do HEAD, ficam no history) | Git history |

### P1 — Alto (14)

| ID | Problema | Onde |
|----|---------|------|
| P1-01 | 6 docker-compose files (3 pares duplicados, 2 divergentes) | raiz/ + infra/ |
| P1-02 | PG 15 em dev/CI vs PG 17 em prod | docker-compose, ci.yml |
| P1-03 | NestJS @nestjs/common@10 vs @nestjs/core@11 | package.json |
| P1-04 | env_file `./backend/.env` no prod.yml — arquivo nao existe nesse path | docker-compose.prod.yml:20 |
| P1-05 | NEXT_PUBLIC_API_URL = `http://backend:3000` (nome Docker, nao URL publica) | docker-compose.prod.yml:51 |
| P1-06 | nginx.conf e template, nao e o que roda em prod | nginx/nginx.conf |
| P1-07 | nginx.conf referencia frontend Docker, mas frontend esta no Vercel | nginx.conf:92-101 |
| P1-08 | CI `continue-on-error: true` no deploy e E2E tests | ci.yml:86,180 |
| P1-09 | CI `npm audit \|\| true` silencia auditoria de seguranca | ci.yml:133,137 |
| P1-10 | Sem Redis em producao — cache in-memory perde tudo a cada restart | cache.module.ts |
| P1-11 | DB_SYNC env var pode ativar synchronize em prod | app.module.ts |
| P1-12 | IP publico Oracle exposto em docs versionados | DEPLOY_HIBRIDO.md:62 |
| P1-13 | DATABASE_URL com senhas em docs (SenhaForte123, pubpass123) | docs/infra/*.md |
| P1-14 | Watchtower poll 24h — pode aplicar update nao testado automaticamente | docker-compose.micro.yml:78 |

### P2 — Medio (11)

| ID | Problema | Onde |
|----|---------|------|
| P2-01 | 43 arquivos soltos na raiz (scripts, SQL, JSON, debug) | raiz/ |
| P2-02 | 15 scripts PS1 duplicados (raiz vs scripts/) | raiz/ |
| P2-03 | 8 SQL duplicados (raiz vs scripts/db/) | raiz/ |
| P2-04 | 7 JSON test data duplicados (raiz vs scripts/tests/) | raiz/ |
| P2-05 | Frontend Dockerfile instala Cypress deps, mas usa Playwright | frontend/Dockerfile:6-17 |
| P2-06 | `npm install --force` no Dockerfile dev mascara erros | backend/Dockerfile:17 |
| P2-07 | Comentarios "Neon PostgreSQL" obsoletos em micro.yml raiz | docker-compose.micro.yml:7 |
| P2-08 | `version: '3.8'` nos compose prod (obsoleto no Compose v2) | docker-compose.prod.yml:6 |
| P2-09 | CI `--passWithNoTests` permite pipeline verde sem testes | ci.yml:82 |
| P2-10 | debug-token.html na raiz | raiz/ |
| P2-11 | login.json na raiz (possivel dado sensivel) | raiz/ |

---

## 11. Correcoes Propostas (Prioridade)

### Fase 1 — Seguranca (URGENTE — Semana 1)

| # | Acao | Risco se nao fizer |
|---|------|-------------------|
| 1 | Rotacionar JWT_SECRET em producao (gerar com `openssl rand -base64 64`) | Tokens comprometidos |
| 2 | Rotacionar DB_PASSWORD em producao | Acesso direto ao banco |
| 3 | Alterar senha do admin em producao | Acesso admin por qualquer pessoa |
| 4 | Executar BFG Repo-Cleaner para remover credenciais do historico Git | Credenciais acessiveis mesmo apos remocao |
| 5 | Deletar DEPLOY_HIBRIDO.md e GUIA_RAPIDO_SERVIDORES.md | Credenciais no HEAD |
| 6 | Forcar `synchronize: false` no codigo (remover env var) | Schema corrompido |

### Fase 2 — CI/CD e Docker (Semana 2)

| # | Acao |
|---|------|
| 7 | Corrigir Job 4 deploy: trocar PM2 por Docker (`docker compose -f docker-compose.micro.yml up -d --build`) |
| 8 | Corrigir path: `dist/main.js` → `dist/src/main.js` |
| 9 | Mover typeorm de devDependencies para dependencies |
| 10 | Alinhar @nestjs/common para v11 (resolver mismatch) |
| 11 | Deletar 3 compose duplicados em infra/ (manter apenas raiz/) |
| 12 | Corrigir env_file em docker-compose.prod.yml (`./.env` nao `./backend/.env`) |
| 13 | Corrigir NEXT_PUBLIC_API_URL em docker-compose.prod.yml (URL publica) |
| 14 | Alinhar PG 15 → PG 17 em docker-compose.yml dev e ci.yml |

### Fase 3 — Limpeza (Semana 3)

| # | Acao |
|---|------|
| 15 | Deletar 30+ arquivos duplicados da raiz (manter em scripts/) |
| 16 | Deletar debug-token.html, login.json |
| 17 | Corrigir frontend/Dockerfile: remover Cypress deps, usar alpine |
| 18 | Atualizar nginx.conf para refletir arquitetura real (sem upstream frontend) |
| 19 | Remover comentarios "Neon" obsoletos |
| 20 | Configurar Redis em producao (ou aceitar perdas de cache e documentar) |
| 21 | Adicionar .dockerignore em backend/ e frontend/ |
| 22 | Remover `--passWithNoTests` e `continue-on-error: true` do CI |

---

## 12. Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Credenciais expostas no HEAD | **5+** | **0** |
| Credenciais no historico Git | **5+** | **0** (BFG) |
| Docker compose files | 6 (3 duplicados) | **3** (dev, prod, micro) |
| Arquivos soltos na raiz | **43** | **~5** |
| Scripts duplicados | **30** | **0** |
| CI/CD deploy funciona | **Nao** | **Sim** |
| PG versao alinhada | 15/15/17 | **17 em todos** |
| NestJS versao alinhada | v10/v11 mix | **v11 todos** |
| Redis em producao | Nao | **Sim** (ou documentado) |
| Dockerfile.prod funciona | Nao (typeorm faltando) | **Sim** |

---

## 13. Pontos Positivos

| Item | Detalhe |
|------|---------|
| `scripts/deploy.sh` | Bem escrito: 7 steps, backup, health check, rollback automatico |
| `scripts/rollback.sh` | 3 modos (full, db-only, code-only) |
| `scripts/backup.sh` | 3 tipos de retencao (deploy 72h, daily 7d, weekly 30d) |
| `scripts/health-monitor.sh` | Monitor continuo com Slack webhook |
| Dockerfile.micro | Multi-stage otimizado para 1GB RAM |
| Cloudflare DNS | SSL gratuito, CDN, protecao DDoS |
| Vercel frontend | Deploy zero-config, rollback facil |
| docs/deploy/production-deploy.md | Documentacao de deploy bem estruturada |
