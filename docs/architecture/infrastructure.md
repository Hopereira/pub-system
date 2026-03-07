# Infraestrutura — Pub System

**Versao:** 1.0
**Atualizado:** 2026-03-06
**Fonte da verdade:** Este documento substitui DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md
**Auditoria:** `docs/audits/infrastructure-audit.md`

---

## 1. Visao Geral

O Pub System usa uma arquitetura hibrida 100% gratuita:

| Componente | Servico | Tecnologia | Custo |
|-----------|---------|------------|-------|
| **Frontend** | Vercel (Hobby) | Next.js 16 / React 19 | Gratuito |
| **Backend** | Oracle Cloud VM | NestJS (Docker) | Gratuito (Always Free) |
| **Banco** | Docker na Oracle VM | PostgreSQL 17 | Gratuito |
| **DNS/SSL** | Cloudflare (Free) | Modo Flexivel | Gratuito |
| **Proxy** | Oracle VM (host) | Nginx | Gratuito |
| **Dominio** | Registro.br | pubsystem.com.br | ~R$40/ano |
| **Cache (prod)** | In-memory | NestJS cache-manager | — |
| **Cache (dev)** | Docker | Redis 7 Alpine | — |

**Custo total: ~R$3,33/mes** (apenas dominio)

---

## 2. Diagrama de Arquitetura

### 2.1 Producao

```
                    ┌─────────────────────────────────────────────┐
                    │              INTERNET                        │
                    └─────────┬───────────────────┬───────────────┘
                              │                   │
                    ┌─────────▼─────────┐ ┌───────▼───────────────┐
                    │   CLOUDFLARE      │ │   VERCEL               │
                    │   DNS + SSL       │ │   Frontend Next.js 16  │
                    │   Modo: Flexivel  │ │   pubsystem.com.br     │
                    │                   │ │   pub-system.vercel.app│
                    │   api.pubsystem   │ │                        │
                    │   .com.br → A     │ │   NEXT_PUBLIC_API_URL  │
                    │   134.65.248.235  │ │   = api.pubsystem      │
                    │   Proxy: ON       │ │     .com.br            │
                    └─────────┬─────────┘ └────────────────────────┘
                              │ HTTP
                    ┌─────────▼──────────────────────────────────┐
                    │   ORACLE VM E2.1.Micro                     │
                    │   Ubuntu 22.04 — 1 OCPU, 1GB RAM           │
                    │   IP: 134.65.248.235                       │
                    │                                            │
                    │   ┌──────────────────────────────────┐     │
                    │   │  Nginx (systemd no host)         │     │
                    │   │  :80 → proxy_pass :3000          │     │
                    │   │  /etc/nginx/sites-available/api  │     │
                    │   └──────────────┬───────────────────┘     │
                    │                  │                          │
                    │   ┌──────────────▼───────────────────┐     │
                    │   │  Docker: pub-backend              │     │
                    │   │  NestJS :3000                     │     │
                    │   │  Dockerfile.micro                 │     │
                    │   │  512MB RAM limit                  │     │
                    │   │  Cache: in-memory                 │     │
                    │   └──────────────┬───────────────────┘     │
                    │                  │ TypeORM                  │
                    │   ┌──────────────▼───────────────────┐     │
                    │   │  Docker: pub-postgres             │     │
                    │   │  PostgreSQL 17                    │     │
                    │   │  Volume: postgres_data            │     │
                    │   │  (NÃO exposto externamente)      │     │
                    │   └──────────────────────────────────┘     │
                    │                                            │
                    │   ┌──────────────────────────────────┐     │
                    │   │  Docker: watchtower               │     │
                    │   │  Auto-update a cada 24h           │     │
                    │   │  64MB RAM limit                   │     │
                    │   └──────────────────────────────────┘     │
                    └────────────────────────────────────────────┘
```

### 2.2 Desenvolvimento Local

```
┌──────────────────────────────────────────────────────────┐
│  Docker Compose (docker-compose.yml)                      │
│                                                           │
│  ┌────────────────┐  ┌────────────────┐                  │
│  │ pub_system_     │  │ pub_system_     │                  │
│  │ backend :3000   │  │ frontend :3001  │                  │
│  │ NestJS (watch)  │  │ Next.js (turbo) │                  │
│  │ 1.5GB RAM       │  │ 2.5GB RAM       │                  │
│  └───────┬─────────┘  └─────────────────┘                 │
│          │                                                │
│  ┌───────▼─────────┐  ┌────────────────┐                  │
│  │ pub_system_db   │  │ pub_system_     │                  │
│  │ PG 15 :5432     │  │ redis :6379     │                  │
│  │ 512MB RAM       │  │ 256MB RAM       │                  │
│  └─────────────────┘  └────────────────┘                  │
│                                                           │
│  ┌────────────────┐                                       │
│  │ pub_system_     │                                       │
│  │ pgadmin :8080   │                                       │
│  └────────────────┘                                       │
│                                                           │
│  Rede: pub_network (bridge)                               │
│  Volume: postgres_data                                    │
│  Total RAM: ~5GB                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Detalhados

### 3.1 Frontend — Vercel

| Item | Valor |
|------|-------|
| **URL producao** | https://pubsystem.com.br |
| **URL Vercel** | https://pub-system.vercel.app |
| **Framework** | Next.js 16.1.6 (App Router + Turbopack) |
| **React** | 19.1.0 |
| **Deploy** | Automatico via Git push para `main` |
| **Build** | `npm run build` (Turbopack) |
| **Node.js** | 20 |

**Variaveis de ambiente (Vercel Dashboard):**

| Variavel | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pubsystem.com.br` |
| `API_URL_SERVER` | `https://api.pubsystem.com.br` (SSR fallback) |

### 3.2 Backend — Oracle VM + Docker

| Item | Valor |
|------|-------|
| **Docker Compose** | `docker-compose.micro.yml` (raiz) |
| **Dockerfile** | `backend/Dockerfile.micro` (multi-stage, ~150MB) |
| **Container** | `pub-backend` |
| **Framework** | NestJS (mix @nestjs/common@10 + @nestjs/core@11) |
| **Porta** | 3000 |
| **RAM limite** | 512MB |
| **CPU limite** | 0.8 |
| **Node.js** | 20-alpine |
| **Heap max** | 384MB (`--max-old-space-size=384`) |
| **Startup** | `node dist/src/main.js` |
| **Health** | `GET /health` (cada 30s) |

**Variaveis de ambiente (.env na VM):**

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Minimo 32 caracteres |
| `BACKEND_URL` | `https://api.pubsystem.com.br` |
| `FRONTEND_URL` | `https://pubsystem.com.br` |
| `NODE_ENV` | `production` |
| `GCS_BUCKET_NAME` | (opcional) |
| `CLOUDFLARE_API_TOKEN` | (para DNS automatico) |
| `CLOUDFLARE_ZONE_ID` | (para DNS automatico) |

### 3.3 Banco de Dados — PostgreSQL 17 (Docker)

| Item | Valor |
|------|-------|
| **Container** | `pub-postgres` |
| **Imagem** | postgres:17 |
| **Porta** | 5432 (apenas interna ao Docker) |
| **Volume** | `postgres_data` (persistente) |
| **Schema** | `public` |
| **Extensoes** | `uuid-ossp` |
| **Tabelas** | 30 (ver `docs/database/schema.md`) |

**IMPORTANTE:** O banco roda localmente na Oracle VM, NAO no Neon Cloud (apesar do que documentos antigos dizem).

### 3.4 Nginx — Proxy Reverso

| Item | Valor |
|------|-------|
| **Instalacao** | systemd no host Ubuntu |
| **Config** | `/etc/nginx/sites-available/api` |
| **Porta** | 80 |
| **Proxy** | `proxy_pass http://localhost:3000` |
| **WebSocket** | Headers Upgrade/Connection configurados |

**Config real em producao (simplificada):**
```nginx
server {
    listen 80;
    server_name api.pubsystem.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nota:** O `nginx/nginx.conf` do repositorio e um template com SSL Let's Encrypt que NAO e usado em producao. A config real no servidor e simples HTTP porque Cloudflare Flexivel termina o SSL.

### 3.5 Cloudflare — DNS + SSL

| Item | Valor |
|------|-------|
| **Dominio** | pubsystem.com.br |
| **SSL/TLS** | Modo **Flexivel** |
| **CDN** | Ativado para assets estaticos |

**DNS Records:**

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| A | `api` | 134.65.248.235 | Ativado (nuvem laranja) |
| CNAME | `@` | cname.vercel-dns.com | DNS only |
| CNAME | `www` | cname.vercel-dns.com | DNS only |
| A | `*.pubsystem.com.br` | 134.65.248.235 | Ativado (multi-tenant) |

**Modo Flexivel significa:**
```
Usuario ──HTTPS──▶ Cloudflare ──HTTP──▶ Oracle VM (Nginx :80)
```
Cloudflare termina o SSL. A Oracle VM NAO precisa de certificado.

### 3.6 Oracle VM — Configuracao

| Item | Valor |
|------|-------|
| **Shape** | E2.1.Micro (Always Free) |
| **vCPU** | 1 (AMD ou ARM) |
| **RAM** | 1GB |
| **Disco** | ~50GB boot volume |
| **OS** | Ubuntu 22.04 |
| **IP** | 134.65.248.235 |
| **SSH** | Chave privada (NAO expor) |

**Portas abertas (Security List + iptables):**

| Porta | Protocolo | Servico |
|-------|-----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | Nginx (HTTP) |

**Nota:** A porta 3000 NAO precisa estar aberta externamente. Nginx faz proxy interno.

---

## 4. Docker Compose Files

### 4.1 Arquivo ATIVO para producao

**`docker-compose.micro.yml` (raiz)**

| Servico | Imagem | RAM | Funcao |
|---------|--------|-----|--------|
| backend | Dockerfile.micro | 512MB | API NestJS |
| watchtower | containrrr/watchtower | 64MB | Auto-update 24h |

**Total RAM: ~576MB** (de 1GB disponivel)

### 4.2 Arquivo ATIVO para desenvolvimento

**`docker-compose.yml` (raiz)**

| Servico | Imagem | RAM | Porta | Funcao |
|---------|--------|-----|-------|--------|
| backend | Dockerfile | 1.5GB | 3000 | API NestJS (watch) |
| frontend | frontend/Dockerfile | 2.5GB | 3001 | Next.js (turbo) |
| db | postgres:15-alpine | 512MB | 5432 | PostgreSQL |
| redis | redis:7-alpine | 256MB | 6379 | Cache |
| pgadmin | dpage/pgadmin4 | — | 8080 | DB admin UI |

**Total RAM: ~5GB+**

### 4.3 Arquivos NAO usados (devem ser removidos)

| Arquivo | Motivo |
|---------|--------|
| `docker-compose.prod.yml` (raiz) | Frontend vai pro Vercel, nao Docker |
| `infra/docker-compose.yml` | Duplicata exata da raiz |
| `infra/docker-compose.prod.yml` | Duplicata divergente (PG 17 vs 15) |
| `infra/docker-compose.micro.yml` | Duplicata divergente (sem Cloudflare vars) |

---

## 5. CI/CD

### 5.1 GitHub Actions (`.github/workflows/ci.yml`)

| Job | Trigger | O que faz | Status |
|-----|---------|-----------|--------|
| **backend** | push/PR main | lint + build + migrations + tests | Funciona |
| **frontend** | push/PR main | lint + build | Funciona |
| **security** | apos backend+frontend | npm audit (cosmético) | Inutil (|| true) |
| **deploy-staging** | push main | SSH → git pull → PM2 restart | **QUEBRADO** |

### 5.2 Problema do Deploy

O job `deploy-staging` executa:
```bash
pm2 restart pub-backend || pm2 start dist/main.js --name pub-backend
```

Mas o servidor usa Docker. O correto seria:
```bash
docker compose -f docker-compose.micro.yml up -d --build
```

Alem disso, o path `dist/main.js` esta errado — o real e `dist/src/main.js`.

### 5.3 Deploy Real (Manual)

```bash
# Na Oracle VM via SSH
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build
docker logs pub-backend -f  # verificar
```

### 5.4 Deploy Frontend (Automatico)

Push para `main` → Vercel detecta e faz deploy automatico.

---

## 6. Dependencias Criticas

### 6.1 Backend (backend/package.json)

| Pacote | Versao | Problema |
|--------|--------|----------|
| `@nestjs/common` | ^10.0.0 | **MISMATCH** — core e v11 |
| `@nestjs/core` | ^11.1.16 | OK |
| `typeorm` | ^0.3.27 | **Em devDeps** — falha em prod build |
| `pg` | ^8.11.3 | OK |
| `socket.io` | ^4.7.4 | OK |
| `redis` | ^4.6.10 | OK (mas nao usado em prod) |

### 6.2 Frontend (frontend/package.json)

| Pacote | Versao | Status |
|--------|--------|--------|
| `next` | ^16.1.6 | OK |
| `react` | 19.1.0 | OK |
| `tailwindcss` | ^4 | OK |
| `@playwright/test` | ^1.57.0 | OK |

### 6.3 Raiz (package.json) — REMOVER

Tem dependencias de frontend que nao deviam estar na raiz do monorepo.

---

## 7. Comandos Operacionais

### 7.1 Producao (Oracle VM)

```bash
# Conectar via SSH
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235

# Ver status
docker ps
sudo systemctl status nginx

# Atualizar backend
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build

# Ver logs
docker logs pub-backend -f
docker logs pub-backend --tail 100

# Reiniciar
docker compose -f docker-compose.micro.yml restart
sudo systemctl restart nginx

# Monitorar recursos
docker stats
htop
df -h

# Health check
curl http://localhost:3000/health
curl https://api.pubsystem.com.br/health
```

### 7.2 Desenvolvimento Local

```bash
# Iniciar tudo
docker compose up -d

# Ver logs
docker compose logs -f backend

# Rebuild apos mudanca em Dockerfile
docker compose up -d --build

# Reset completo (apaga banco)
docker compose down -v
docker compose up -d

# Acessar shell do backend
docker compose exec backend sh

# Acessar PostgreSQL
docker compose exec db psql -U postgres -d pub_system_db

# Parar tudo
docker compose down
```

### 7.3 URLs

| Ambiente | Frontend | Backend | Swagger |
|----------|----------|---------|---------|
| **Dev** | http://localhost:3001 | http://localhost:3000 | http://localhost:3000/api |
| **Prod** | https://pubsystem.com.br | https://api.pubsystem.com.br | — (desabilitado) |
| **PgAdmin (dev)** | http://localhost:8080 | — | — |

### 7.4 Credenciais de Desenvolvimento

| Servico | Email/User | Senha |
|---------|-----------|-------|
| Sistema (admin) | `admin@admin.com` | `admin123` |
| PgAdmin | `admin@admin.com` | `admin` |
| PostgreSQL | `postgres` | Definido no `.env` |

**NUNCA versionar credenciais de producao.** Usar `.env` local + secrets do GitHub Actions.

---

## 8. Variaveis de Ambiente

Para lista completa, ver `docs/current/ENV_VARS.md`.

### 8.1 Obrigatorias (todos ambientes)

| Variavel | Exemplo Dev | Exemplo Prod |
|----------|-------------|-------------|
| `NODE_ENV` | development | production |
| `DB_HOST` | db | localhost (Docker interno) |
| `DB_PORT` | 5432 | 5432 |
| `DB_USER` | postgres | (configurar) |
| `DB_PASSWORD` | admin | (forte, nunca expor) |
| `DB_DATABASE` | pub_system_db | pub_system_db |
| `JWT_SECRET` | (32+ chars) | (32+ chars, nunca expor) |
| `FRONTEND_URL` | http://localhost:3001 | https://pubsystem.com.br |
| `BACKEND_URL` | http://localhost:3000 | https://api.pubsystem.com.br |

### 8.2 Docker-only

| Variavel | Descricao |
|----------|-----------|
| `REDIS_HOST` | `redis` (nome do servico Docker) |
| `REDIS_PORT` | `6379` |
| `POSTGRES_USER` | User para container PG |
| `POSTGRES_PASSWORD` | Senha para container PG |
| `POSTGRES_DB` | DB inicial do container PG |

### 8.3 Producao-only

| Variavel | Descricao |
|----------|-----------|
| `DB_SSL` | `true` (se usar Neon/cloud DB) |
| `CLOUDFLARE_API_TOKEN` | DNS automatico multi-tenant |
| `CLOUDFLARE_ZONE_ID` | Zone do dominio |
| `CLOUDFLARE_BASE_DOMAIN` | `pubsystem.com.br` |
| `CLOUDFLARE_TARGET_IP` | IP da Oracle VM |

---

## 9. Vulnerabilidades Conhecidas

| # | Problema | Severidade | Detalhes em |
|---|---------|-----------|-------------|
| 1 | Credenciais expostas no Git | CRITICO | `docs/audits/infrastructure-audit.md` §3.1 |
| 2 | CI/CD deploy quebrado | CRITICO | `docs/audits/infrastructure-audit.md` §3.2 |
| 3 | NestJS version mismatch | CRITICO | `docs/audits/infrastructure-audit.md` §3.3 |
| 4 | 6 docker-compose duplicados | CRITICO | `docs/audits/infrastructure-audit.md` §3.4 |
| 5 | Sem Redis em producao | CRITICO | `docs/audits/infrastructure-audit.md` §3.5 |
| 6 | typeorm em devDependencies | ALTO | `docs/audits/infrastructure-audit.md` §7.2 |
| 7 | 29 arquivos soltos na raiz | ALTO | `docs/audits/infrastructure-audit.md` §4.7 |

---

## 10. Arquivos de Infraestrutura — Mapa

```
pub-system/
├── docker-compose.yml              # DEV — USAR ESTE
├── docker-compose.micro.yml        # PROD — USAR ESTE
├── docker-compose.prod.yml         # NAO USADO — remover
├── env.micro.example               # Template .env para prod
├── .env                            # Config local (gitignored)
│
├── backend/
│   ├── Dockerfile                  # DEV
│   ├── Dockerfile.prod             # NAO USADO (Vercel faz frontend)
│   ├── Dockerfile.micro            # PROD — USAR ESTE
│   └── .env                        # Config backend (gitignored)
│
├── frontend/
│   ├── Dockerfile                  # DEV
│   └── Dockerfile.prod             # NAO USADO (frontend no Vercel)
│
├── nginx/
│   └── nginx.conf                  # TEMPLATE — config real esta no servidor
│
├── infra/                          # DUPLICATAS — remover pasta inteira
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── docker-compose.micro.yml
│
├── .github/workflows/
│   └── ci.yml                      # CI/CD (deploy QUEBRADO)
│
├── scripts/
│   ├── deploy/                     # Setup, docker start/rebuild
│   ├── db/                         # SQL scripts
│   ├── maintenance/                # Reset, expiracao
│   ├── tests/                      # Scripts de teste
│   ├── backup-db.sh                # Backup PostgreSQL
│   ├── restore-db.sh               # Restore PostgreSQL
│   └── health-monitor.sh           # Monitor de saude
│
└── docs/
    ├── architecture/
    │   └── infrastructure.md       # ESTE DOCUMENTO (fonte da verdade)
    ├── audits/
    │   └── infrastructure-audit.md # Relatorio de auditoria
    └── current/
        ├── DEPLOY.md               # DESATUALIZADO — usar este doc
        ├── ENV_VARS.md             # Variaveis de ambiente (atualizado)
        └── SETUP_LOCAL.md          # Setup local (parcialmente correto)
```
