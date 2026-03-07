# Auditoria Geral — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura completa do repositorio (backend, frontend, infra, docs, CI/CD)
**Regra:** Baseado APENAS no que existe no codigo. Nada inventado.
**Arquivos lidos:** 31 entities, 19 modules, 6 docker-compose, 5 Dockerfiles, CI/CD, 22 frontend services, 30+ rotas, toda documentacao

---

## Indice de Problemas

| Severidade | Qtd | Descricao |
|-----------|-----|-----------|
| **P0 — Critico** | 12 | Seguranca comprometida, dados em risco |
| **P1 — Alto** | 16 | Funcionalidade comprometida, bugs latentes |
| **P2 — Medio** | 11 | Qualidade, organizacao, divergencias |
| **P3 — Baixo** | 7 | Melhorias, limpeza, otimizacao |
| **Total** | **46** | — |

---

## 1. Arquitetura

### 1.1 Visao Real

```
Internet
  ├── pubsystem.com.br → Cloudflare CNAME → Vercel
  │     Next.js 16.1.6 / React 19 / Tailwind 4
  │
  └── api.pubsystem.com.br → Cloudflare A (Proxy) → 134.65.248.235
        Oracle VM E2.1.Micro (1 vCPU, 1GB RAM, Ubuntu 22.04)
        ├── Nginx (host) :80 → proxy_pass :3000
        ├── Docker: pub-backend (NestJS mix v10/v11) :3000 [512MB]
        ├── Docker: pub-postgres (PG 17) :5432 [volume]
        └── Docker: watchtower (auto-update 24h) [64MB]
```

### 1.2 Stack Real

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | Next.js | 16.1.6 |
| Frontend | React | 19.1.0 |
| Frontend | Tailwind CSS | 4 |
| Frontend | Radix UI / shadcn | Varias |
| Backend | @nestjs/common | ^10.0.0 (MISMATCH) |
| Backend | @nestjs/core | ^11.1.16 |
| Backend | TypeORM | ^0.3.27 |
| Backend | Socket.IO | ^4.7.4 |
| Banco | PostgreSQL (prod) | 17 |
| Banco | PostgreSQL (dev) | 15-alpine |
| Auth | Passport + JWT + bcrypt | — |
| Cache (dev) | Redis 7 | Alpine |
| Cache (prod) | In-memory | Sem Redis |
| Upload | Google Cloud Storage | 7.19.0 |
| Testes | Jest (BE) + Playwright (FE) | — |

### 1.3 URLs

| Ambiente | Frontend | Backend |
|----------|----------|---------|
| Producao | https://pubsystem.com.br | https://api.pubsystem.com.br |
| Dev | http://localhost:3001 | http://localhost:3000 |

### 1.4 Custo Mensal

Oracle VM + Vercel + Cloudflare = **~R$3,33/mes** (tudo gratuito exceto dominio).

### Problemas — Arquitetura

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| A01 | P0 | NestJS version mismatch: @nestjs/common@10 + @nestjs/core@11 | backend/package.json |
| A02 | P1 | Sem Redis em producao — cache perde tudo a cada restart | docker-compose.micro.yml |
| A03 | P2 | Comentarios no app.module.ts referenciam Neon Cloud (obsoleto) | app.module.ts:152-175 |
| A04 | P3 | next.config.ts output: 'standalone' desnecessario (Vercel) | next.config.ts:5 |

---

## 2. Backend

### 2.1 Estrutura (19 modulos de negocio + infra)

```
backend/src/
├── main.ts                 # Bootstrap: Helmet, CORS, ValidationPipe, Swagger
├── app.module.ts           # Root: Joi validation, TypeORM, guards globais
├── auth/                   # JWT, refresh tokens, sessoes, super-admin setup
├── cache/                  # Redis/in-memory config
├── common/
│   ├── tenant/             # Guard, Interceptor, Context, Repository, Gateway
│   ├── logger/             # Winston structured logging
│   ├── guards/             # CustomThrottlerGuard
│   ├── interceptors/       # Logging, Timeout
│   ├── filters/            # AllExceptionsFilter
│   └── decorators/         # @Public, @Roles, @CurrentUser, @SkipTenantGuard
├── database/               # DataSource, Seeder, Migrations
├── health/                 # GET /health (Terminus)
├── jobs/                   # BackupCheckJob, Schedulers
├── shared/storage/         # GCS upload
└── modulos/                # 19 modulos de negocio
    ├── ambiente/           ├── analytics/      ├── audit/
    ├── avaliacao/          ├── caixa/          ├── cliente/
    ├── comanda/            ├── empresa/        ├── estabelecimento/
    ├── evento/             ├── funcionario/    ├── medalha/
    ├── mesa/               ├── pagina-evento/  ├── payment/
    ├── pedido/             ├── plan/           ├── ponto-entrega/
    ├── produto/            └── turno/
```

### 2.2 API: ~130 endpoints

- **~25 publicos**: login, registro, cardapio, mesas livres, pedido cliente, avaliacoes
- **~105 protegidos**: CRUD completo de todos modulos
- **~15 super-admin**: gestao de tenants, planos, metricas
- **28 controllers**, **7 modulos com FeatureGuard**

### 2.3 Guards Globais (ordem de execucao)

1. `JwtAuthGuard` — valida JWT (exceto @Public)
2. `TenantGuard` — resolve e valida tenant
3. `TenantRateLimitGuard` — rate limit por plano
4. `CustomThrottlerGuard` — rate limit global

### 2.4 Bootstrap (main.ts)

1. Helmet (CSP em prod, desabilitado em dev)
2. cookieParser
3. LoggingInterceptor
4. AllExceptionsFilter
5. Static assets (/public/)
6. CORS (whitelist + regex subdomains)
7. JSON limit 10MB
8. ValidationPipe (whitelist, forbidNonWhitelisted, transform)
9. Swagger (apenas dev)
10. Seeder
11. Listen :3000

### 2.5 WebSocket

| Gateway | Namespace | Eventos |
|---------|-----------|---------|
| PedidosGateway | `/` | novo_pedido, status_atualizado, comanda_atualizada, caixa_atualizado |
| TurnoGateway | `/turnos` | turno_atualizado |

Ambos herdam BaseTenantGateway (rooms por tenant).

### 2.6 Cron Jobs

| Job | Frequencia | Arquivo |
|-----|-----------|---------|
| QuaseProntoScheduler | 15s | pedido/quase-pronto.scheduler.ts |
| MedalhaScheduler | 5min | medalha/medalha.scheduler.ts |
| ResetMedalhasDiarias | 00:00 | medalha/medalha.scheduler.ts |
| BackupCheckJob | 08:00 | jobs/backup-check.job.ts |

### 2.7 Seeder

Cria automaticamente na primeira inicializacao: 5 ambientes preparo, 3 atendimento, 22 mesas, 42 produtos, 5 clientes, 5 comandas. Requer DEFAULT_TENANT_ID.

### Problemas — Backend

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| B01 | P0 | QuaseProntoScheduler usa @InjectRepository direto — sem filtro tenant | quase-pronto.scheduler.ts:32-33 |
| B02 | P0 | MedalhaScheduler usa @InjectRepository(Funcionario) direto — busca ALL tenants | medalha.scheduler.ts:18-19 |
| B03 | P0 | RefreshToken.validateRefreshToken pula check cross-tenant se tenantId undefined | refresh-token.service.ts:89 |
| B04 | P1 | typeorm em devDependencies — falha em --only=production | backend/package.json |
| B05 | P1 | start:prod path incorreto: `dist/main` deveria ser `dist/src/main` | backend/package.json |
| B06 | P1 | npm install --force mascara NestJS mismatch | backend/Dockerfile |
| B07 | P1 | DB_SYNC env var pode ativar synchronize em prod | app.module.ts:151 |
| B08 | P1 | Funcionario.@BeforeInsert hashPassword COMENTADO | funcionario.entity.ts:77-80 |
| B09 | P2 | Rate limits hardcoded como "dev" values (30/s) em app.module | app.module.ts:127 |
| B10 | P2 | Stale Neon Cloud comments/config in TypeORM setup | app.module.ts:152-175 |
| B11 | P3 | Swagger tags nao cobrem todos os 19 modulos | main.ts:151-157 |
| B12 | P3 | Funcionario.empresaId legado coexiste com tenant_id | funcionario.entity.ts:57-62 |

---

## 3. Frontend

### 3.1 Stack

| Pacote | Versao |
|--------|--------|
| next | ^16.1.6 |
| react | 19.1.0 |
| tailwindcss | ^4 |
| @tanstack/react-query | ^5.90.6 |
| @tanstack/react-table | ^8.21.3 |
| axios | ^1.11.0 |
| socket.io-client | ^4.8.1 |
| react-hook-form | ^7.62.0 |
| zod | ^4.1.5 |
| lucide-react | ^0.542.0 |
| @playwright/test | ^1.57.0 |

### 3.2 Rotas (30+)

```
(auth)/login
(protected)/
  dashboard/  (admin, cardapio, comandas, configuracoes, cozinha, gestaopedidos, mapa, operacional, perfil, relatorios)
  caixa/      (terminal, comandas-abertas, gestao, clientes, relatorios, historico, [id])
  garcom/     (mapa, mapa-visual, novo-pedido, qrcode-comanda, ranking)
  cozinha/
  mesas/
  super-admin/ (tenants, planos, pagamentos, configuracoes)
(public)/ (publico)/ (cliente)/
comanda/[id]  evento/[id]  entrada/[id]  t/[slug]  api/
```

### 3.3 Services (22)

ambienteService, analyticsService, authService, avaliacaoService, caixaService,
clienteService, comandaService, empresaService, eventoService, firstAccessService,
funcionarioService, mapaService, mesaService, paginaEventoService, paymentService,
pedidoService, planService, pontoEntregaService, produtoService, rankingService,
superAdminService, turnoService

Base: `api.ts` com Axios, interceptor JWT, refresh automatico, retry exponencial.

### 3.4 Middleware Multi-Tenant

Detecta subdominio e reescreve: `casarao-pub.pubsystem.com.br/` → `/t/casarao-pub`

### 3.5 Redirect por Role

| Role | Destino |
|------|---------|
| ADMIN/GERENTE | /dashboard |
| GARCOM | /garcom |
| CAIXA | /caixa |
| COZINHEIRO | /cozinha |

### Problemas — Frontend

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| F01 | P1 | next.config ignoreBuildErrors: true para ESLint E TypeScript | next.config.ts:9,13 |
| F02 | P1 | Dockerfile dev instala Cypress mas projeto usa Playwright (+500MB) | frontend/Dockerfile |
| F03 | P2 | publicApi envia slug como X-Tenant-ID (nao UUID) — backend espera UUID | api.ts:231-233 |
| F04 | P2 | authToken em localStorage (XSS attack vector) | api.ts:59 |
| F05 | P3 | next.config images permite hostname 'backend' (Docker interno) | next.config.ts:62-65 |

---

## 4. Banco de Dados

### 4.1 Configuracao

| Item | Dev | Prod |
|------|-----|------|
| Engine | PostgreSQL 15-alpine | PostgreSQL 17 |
| Container | pub_system_db | pub-postgres |
| Porta | 5432 (exposta) | 5432 (interna) |
| SSL | Nao | Nao |
| Extensoes | uuid-ossp | uuid-ossp |

### 4.2 Tabelas (31 entities → ~30 tabelas)

**Com tenant_id (25):** ambientes, avaliacoes, abertura_caixa, clientes, comandas, comanda_agregados, empresas, eventos, funcionarios, item_pedido, layouts_estabelecimento, medalhas, medalha_funcionario, mesas, paginas_evento, pagina_evento_media, pedidos, pontos_entrega, produtos, subscription, payment_transactions, turnos, audit_logs, sangrias, movimentacao_caixa

**Globais (4):** tenants, plans, payment_configs, refresh_tokens

**Sistema:** migrations

### 4.3 TypeORM Config

- Entities: glob `**/*.entity.{ts,js}`
- Migrations: `database/migrations/**/*.{ts,js}`
- synchronize: `process.env.DB_SYNC === 'true'` (PERIGO)
- migrationsRun: false (script separado)
- SSL condicional via DB_SSL

### Problemas — Banco

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| D01 | P0 | tenant_id **nullable: true** em 25 tabelas — INSERT sem tenant e permitido | Todas entities |
| D02 | P0 | **Zero FKs** tenant_id → tenants(id) — DELETE tenant nao limpa dados | Banco |
| D03 | P0 | Migration MakeTenantIdNotNull em migrations_backup/ — **NUNCA executada** | migrations_backup/ |
| D04 | P1 | Cliente.cpf UNIQUE **global** — impede mesmo CPF em tenants diferentes | cliente.entity.ts:24 |
| D05 | P1 | TenantAwareEntity (classe base correta) existe mas **ninguem herda** | tenant-aware.entity.ts |
| D06 | P1 | Faltam indices compostos (tenant_id + status + data) em 7 tabelas | Banco |
| D07 | P1 | PG 15 no dev/CI vs PG 17 em prod — comportamento pode divergir | docker-compose files |
| D08 | P2 | Funcionario.empresaId legado coexiste com tenant_id | funcionario.entity.ts |
| D09 | P2 | PontoEntrega provavelmente tem empresaId legado tambem | ponto-entrega.entity.ts |
| D10 | P2 | 10 scripts SQL soltos na raiz sem controle | Raiz do projeto |
| D11 | P3 | typeorm em devDeps — falha em npm ci --only=production | backend/package.json |

---

## 5. Infraestrutura

### 5.1 Oracle VM

| Item | Valor |
|------|-------|
| Shape | E2.1.Micro (Always Free) |
| vCPU | 1 (AMD EPYC) |
| RAM | 1GB |
| Disco | 47GB |
| IP | 134.65.248.235 |
| Portas | 22 (SSH), 80 (HTTP) |

### 5.2 Docker (6 compose files, 5 Dockerfiles)

| Arquivo | Usado | Status |
|---------|-------|--------|
| docker-compose.yml (raiz) | **DEV** | OK |
| docker-compose.micro.yml (raiz) | **PROD** | Sem PG local, sem Redis |
| docker-compose.prod.yml (raiz) | Nao | Obsoleto |
| infra/docker-compose.yml | Nao | Duplicata |
| infra/docker-compose.prod.yml | Nao | Duplicata divergente |
| infra/docker-compose.micro.yml | Nao | Duplicata |

| Dockerfile | Usado |
|-----------|-------|
| backend/Dockerfile | DEV |
| backend/Dockerfile.micro | **PROD** |
| backend/Dockerfile.prod | Nao |
| frontend/Dockerfile | DEV |
| frontend/Dockerfile.prod | Nao |

### 5.3 Cloudflare

DNS: A record `api` → VM IP (proxied). CNAME `@` e `www` → Vercel.
SSL: **Flexivel** (HTTPS ate Cloudflare, HTTP ate servidor).

### 5.4 Nginx

Producao: config simples HTTP :80 → proxy_pass :3000.
Template: nginx/nginx.conf com SSL completo — **NAO usado em prod**.

### Problemas — Infraestrutura

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| I01 | P1 | 6 docker-compose files (3 duplicados em infra/) | raiz + infra/ |
| I02 | P1 | docker-compose.prod.yml env_file path errado (./backend/.env) | docker-compose.prod.yml |
| I03 | P1 | NEXT_PUBLIC_API_URL: http://backend:3000 (nome Docker) | docker-compose.prod.yml |
| I04 | P2 | nginx.conf template com SSL — prod usa HTTP simples | nginx/nginx.conf |
| I05 | P2 | SSL Flexivel — trafego nao criptografado CF→servidor | Cloudflare |
| I06 | P2 | Watchtower sem controle de rollback | docker-compose.micro.yml |
| I07 | P3 | frontend/Dockerfile.prod nunca usado (Vercel) | frontend/Dockerfile.prod |
| I08 | P3 | backend/Dockerfile.prod nunca usado (micro e usado) | backend/Dockerfile.prod |

---

## 6. Deploy

### 6.1 Frontend

Push `main` → Vercel auto-deploy. Variaveis: NEXT_PUBLIC_API_URL, API_URL_SERVER.

### 6.2 Backend

Manual: SSH → `~/pub-system` → `./scripts/deploy.sh`

deploy.sh: pre-checks → backup PG → git pull → docker build --no-cache → docker up → health check → rollback se falhar.

### 6.3 Scripts

| Script | Funcao |
|--------|--------|
| scripts/deploy.sh | Deploy seguro com backup e rollback |
| scripts/backup.sh | Backup PG (deploy/daily/weekly) |
| scripts/rollback.sh | Rollback codigo e/ou banco |
| scripts/backup-db.sh | Backup PG simples |
| scripts/restore-db.sh | Restore PG |
| scripts/health-monitor.sh | Monitoramento continuo |

### Problemas — Deploy

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| DP01 | P1 | Deploy backend e 100% manual — sem automacao CI/CD | — |
| DP02 | P2 | 9 scripts duplicados na raiz vs scripts/ | Raiz |
| DP03 | P3 | Watchtower pode atualizar imagem sem testes | docker-compose.micro.yml |

---

## 7. CI/CD

### 7.1 Pipeline (.github/workflows/ci.yml)

| Job | Trigger | Status |
|-----|---------|--------|
| backend | push/PR main | **Funciona** (lint + build + migrations + test) |
| frontend | push/PR main | **Funciona** (lint + build) |
| security | apos backend+frontend | **Inutil** (npm audit \|\| true) |
| deploy-staging | push main | **QUEBRADO** (PM2, path errado) |

### Problemas — CI/CD

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| C01 | P0 | Deploy job usa PM2 — servidor usa Docker | ci.yml:deploy-staging |
| C02 | P0 | Path `dist/main.js` errado — real e `dist/src/main.js` | ci.yml |
| C03 | P1 | continue-on-error: true esconde falhas do deploy | ci.yml |
| C04 | P1 | npm audit \|\| true — security audit nunca falha | ci.yml |
| C05 | P2 | Nao faz backup pre-deploy no CI | ci.yml |
| C06 | P2 | Health check com apenas 1 tentativa (5s sleep) | ci.yml |

---

## 8. Seguranca

### 8.1 Autenticacao

- Login: bcrypt validate → JWT access_token (1h) + refresh_token (httpOnly cookie, 7d)
- JWT payload: `{ sub, email, cargo, tenantId }`
- JWT_SECRET: minimo 32 chars (Joi validation)
- Refresh: rotacao automatica, sessoes multiplas, revogacao
- Swagger: desabilitado em producao

### 8.2 Autorizacao

Roles: SUPER_ADMIN, ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO, COZINHA, BARTENDER
Guards: JwtAuthGuard → TenantGuard → TenantRateLimitGuard → CustomThrottlerGuard
Decorators: @Public, @Roles, @RequireFeature, @SkipTenantGuard, @SkipRateLimit

### 8.3 Rate Limiting

Global: 30 req/s, 200 req/10s, 1000 req/min (valores "dev" — em prod deveriam ser menores)
Per-endpoint: @ThrottleLogin (5/min), @ThrottleAPI (30/min), @ThrottleStrict (3/min)
Per-tenant: TenantRateLimitGuard (FREE 20/min, BASIC 60/min, PRO 100/min, ENTERPRISE 500/min)

### 8.4 Headers

Helmet: CSP em prod, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
next.config: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

### 8.5 Validacao

ValidationPipe: whitelist, forbidNonWhitelisted, forbidUnknownValues, transform.
disableErrorMessages em producao. JSON limit 10MB.

### 8.6 CORS

Origens: FRONTEND_URL, localhost:3001, pub-system.vercel.app, pubsystem.com.br, *.pubsystem.com.br, *.vercel.app, *.pubsystem.test.

**Nota:** `*.vercel.app` e muito permissivo — qualquer app Vercel e aceita.

### 8.7 Auditoria

Modulo audit/ registra: CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAILED.
Endpoints de consulta, relatorios, estatisticas.

### Problemas — Seguranca

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| S01 | P0 | Credenciais expostas no Git: JWT Secret, DB Password, IP, Admin creds | DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md |
| S02 | P0 | SSH key no historico Git (removida do HEAD, presente no history) | Git history |
| S03 | P0 | JWT Secret provavelmente previsivel em prod (`pub-system-jwt-secret-2024-production`) | .env prod |
| S04 | P1 | CORS aceita *.vercel.app — qualquer app Vercel pode acessar API | main.ts:84 |
| S05 | P1 | authToken em localStorage — vulneravel a XSS | frontend/api.ts:59 |
| S06 | P1 | Rate limits globais com valores "dev" em producao (30/s) | app.module.ts:127 |
| S07 | P2 | publicApi envia slug como X-Tenant-ID — pode confundir backend | api.ts:233 |
| S08 | P2 | DB_SYNC env var pode ativar synchronize acidentalmente | app.module.ts:151 |
| S09 | P3 | Funcionario.hashPassword @BeforeInsert esta COMENTADO | funcionario.entity.ts:77-80 |

---

## 9. Multi-Tenant

### 9.1 Modelo

Banco compartilhado, schema compartilhado. Coluna `tenant_id` (UUID) em 25 tabelas.
Isolamento via camada de aplicacao (BaseTenantRepository, REQUEST-scoped).

### 9.2 Camadas de Protecao ATIVAS

| Camada | Componente | Status |
|--------|-----------|--------|
| HTTP | TenantInterceptor (global) | ATIVO |
| HTTP | TenantGuard (global) | ATIVO |
| Query | BaseTenantRepository (REQUEST-scoped) | ATIVO |
| WebSocket | BaseTenantGateway (rooms) | ATIVO |
| Context | TenantContextService (REQUEST-scoped, imutavel) | ATIVO |
| Auth | tenantId no JWT | ATIVO |
| Cache | Chaves com prefixo tenant | ATIVO |
| Rate limit | TenantRateLimitGuard (por plano) | ATIVO |
| Feature | FeatureGuard (por plano) | ATIVO |

### 9.3 Camadas AUSENTES

| Camada | O que falta |
|--------|-----------|
| Banco — NOT NULL | tenant_id nullable em 25 tabelas |
| Banco — FKs | Zero FKs tenant_id → tenants(id) |
| Banco — RLS | Sem Row Level Security |
| Banco — Indices | Sem indices compostos tenant_id + filtros |

### 9.4 Resolucao de Tenant (prioridade)

1. Subdomain (casarao-pub.pubsystem.com.br)
2. Header X-Tenant-Slug
3. JWT tenantId
4. Header X-Tenant-ID (se UUID)

### 9.5 Planos e Features

| Plano | Features |
|-------|----------|
| FREE | empresa, ambiente, mesa, funcionario, comanda, pedido, produto |
| BASIC | FREE + CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES |
| PRO | BASIC + ANALYTICS, TURNOS, MEDALHAS |
| ENTERPRISE | PRO + tudo, limites expandidos |

### 9.6 Repositories Tenant-Aware (17 corretos)

AmbienteRepository, MesaRepository, ProdutoRepository, ComandaRepository,
PedidoRepository, ItemPedidoRepository, ClienteRepository, FuncionarioRepository,
CaixaRepository, EventoRepository, AvaliacaoRepository, TurnoRepository,
MedalhaRepository, MedalhaGarcomRepository, PontoEntregaRepository,
AuditLogRepository, EmpresaRepository

### 9.7 Bypasses de Tenant (2 problematicos)

| Uso | Arquivo | Problema |
|-----|---------|---------|
| @InjectRepository(ItemPedido) | quase-pronto.scheduler.ts | Query global cross-tenant |
| @InjectRepository(Funcionario) | medalha.scheduler.ts | Query global cross-tenant |

### Problemas — Multi-Tenant

| ID | Sev | Problema | Onde |
|----|-----|---------|------|
| M01 | P0 | tenant_id nullable em 25 tabelas — banco permite INSERT sem tenant | Todas entities |
| M02 | P0 | Zero FKs tenant_id → tenants(id) — sem integridade referencial | Banco |
| M03 | P0 | QuaseProntoScheduler processa dados cross-tenant | quase-pronto.scheduler.ts |
| M04 | P0 | MedalhaScheduler processa dados cross-tenant | medalha.scheduler.ts |
| M05 | P0 | RefreshToken cross-tenant bypass quando tenantId undefined | refresh-token.service.ts:89 |
| M06 | P1 | Migration NOT NULL existe mas nunca executada (migrations_backup/) | migrations_backup/ |
| M07 | P1 | BaseTenantGateway aceita fallback sem JWT (query param) | base-tenant.gateway.ts |
| M08 | P1 | Cliente.cpf UNIQUE global — conflito entre tenants | cliente.entity.ts:24 |
| M09 | P1 | TenantAwareEntity existe mas nenhuma entity herda | tenant-aware.entity.ts |
| M10 | P2 | empresaId legado em funcionarios e pontos_entrega | Entities |

---

## 10. Divergencias Documentacao vs Codigo

| Documento | Diz | Realidade |
|-----------|-----|-----------|
| README.md | `docker compose -f infra/docker-compose.yml` | `docker compose up` (raiz) |
| README.md | Next.js 15, NestJS 10 | Next.js 16.1.6, NestJS mix 10/11 |
| docs/current/DEPLOY.md | PM2, Neon Cloud | Docker, PG 17 local |
| docs/current/ARQUITETURA.md | PG 15, NestJS 10, Next.js 15 | PG 17, NestJS 10/11, Next.js 16 |
| docs/current/SEGURANCA.md | Rate limit 3/s, 20/10s, 100/min | Codigo: 30/s, 200/10s, 1000/min |
| docs/current/SETUP_LOCAL.md | `infra/docker-compose.yml` | `docker-compose.yml` (raiz) |
| DEPLOY_HIBRIDO.md | Neon + Cloudflare Tunnel | PG Docker + CF Flexivel |
| GUIA_RAPIDO_SERVIDORES.md | docker-compose.micro.yml (Neon) | PG Docker local |
| docs/current/TROUBLESHOOTING.md | `pm2 status` | `docker ps` |

### Documentos Corretos (conferidos com codigo)

docs/current/API.md, docs/current/REGRAS_NEGOCIO.md, docs/current/PERMISSOES.md,
docs/current/ENV_VARS.md, docs/backend/multitenancy.md, docs/backend/cache.md,
docs/backend/rate-limit.md

---

## 11. Catalogo Completo de Problemas

### P0 — Critico (12)

| ID | Area | Problema |
|----|------|---------|
| S01 | Seguranca | Credenciais expostas no Git (JWT, DB, IP, Admin) |
| S02 | Seguranca | SSH key no historico Git |
| S03 | Seguranca | JWT Secret previsivel em producao |
| A01 | Backend | NestJS @nestjs/common@10 vs @nestjs/core@11 mismatch |
| C01 | CI/CD | Deploy job usa PM2 — servidor usa Docker |
| C02 | CI/CD | Path dist/main.js errado — real e dist/src/main.js |
| M01 | Multi-tenant | tenant_id nullable em 25 tabelas |
| M02 | Multi-tenant | Zero FKs tenant_id → tenants(id) |
| M03 | Multi-tenant | QuaseProntoScheduler cross-tenant |
| M04 | Multi-tenant | MedalhaScheduler cross-tenant |
| M05 | Multi-tenant | RefreshToken bypass cross-tenant |
| D03 | Banco | Migration NOT NULL nunca executada |

### P1 — Alto (16)

| ID | Area | Problema |
|----|------|---------|
| A02 | Infra | Sem Redis em producao |
| B04 | Backend | typeorm em devDependencies |
| B05 | Backend | start:prod path incorreto |
| B06 | Backend | npm install --force mascara mismatch |
| B07 | Backend | DB_SYNC pode ativar synchronize em prod |
| B08 | Backend | hashPassword @BeforeInsert comentado |
| C03 | CI/CD | continue-on-error: true |
| C04 | CI/CD | npm audit \|\| true |
| D04 | Banco | Cliente.cpf UNIQUE global |
| D05 | Banco | TenantAwareEntity nao usada |
| D06 | Banco | Faltam 7 indices compostos |
| D07 | Banco | PG 15 dev vs PG 17 prod |
| F01 | Frontend | ignoreBuildErrors: true |
| F02 | Frontend | Dockerfile instala Cypress (usa Playwright) |
| I01 | Infra | 6 docker-compose duplicados |
| S04 | Seguranca | CORS aceita *.vercel.app |

### P2 — Medio (11)

| ID | Area | Problema |
|----|------|---------|
| A03 | Backend | Comentarios Neon obsoletos |
| B09 | Backend | Rate limits "dev" em prod |
| B10 | Backend | Stale Neon config |
| C05 | CI/CD | Sem backup pre-deploy |
| C06 | CI/CD | Health check 1 tentativa |
| D08 | Banco | empresaId legado |
| D10 | Banco | 10 SQL soltos na raiz |
| F03 | Frontend | publicApi envia slug como X-Tenant-ID |
| F04 | Frontend | authToken em localStorage |
| I04 | Infra | nginx.conf nao usado em prod |
| I05 | Infra | SSL Flexivel (HTTP CF→servidor) |

### P3 — Baixo (7)

| ID | Area | Problema |
|----|------|---------|
| A04 | Arquitetura | output: standalone desnecessario |
| B11 | Backend | Swagger tags incompletos |
| B12 | Backend | empresaId legado em entity |
| D11 | Banco | typeorm em devDeps |
| F05 | Frontend | images hostname 'backend' |
| I07 | Infra | frontend/Dockerfile.prod nao usado |
| S09 | Seguranca | hashPassword comentado |

---

## 12. Proximos Passos Recomendados

### Semana 1 — Seguranca (URGENTE)

1. Rotacionar JWT Secret em producao
2. Rotacionar DB Password em producao
3. Executar BFG Repo-Cleaner para credenciais
4. Corrigir schedulers (filtrar por tenant)
5. Tornar tenantId obrigatorio em validateRefreshToken
6. Rejeitar WebSocket sem JWT valido
7. Alinhar @nestjs/common para v11

### Semana 2 — Banco

8. Verificar e limpar dados orfaos (tenant_id IS NULL)
9. Migration: tenant_id NOT NULL em 25 tabelas
10. Migration: FKs tenant_id → tenants(id) CASCADE
11. Migration: 7 indices compostos
12. Migration: Cliente.cpf UNIQUE [cpf, tenant_id]
13. Herdar TenantAwareEntity em todas entities

### Semana 3 — Infraestrutura

14. Deletar pasta infra/ e docker-compose.prod.yml
15. Alinhar PG v17 no dev
16. Adicionar Redis ao docker-compose.micro.yml
17. Reescrever CI/CD deploy (Docker em vez de PM2)
18. Remover continue-on-error e \|\| true
19. Mover 29 arquivos soltos da raiz

### Semana 4 — Documentacao e Testes

20. Atualizar README, DEPLOY, ARQUITETURA, SETUP_LOCAL
21. Deletar DEPLOY_HIBRIDO.md e GUIA_RAPIDO (credenciais)
22. Escrever testes para schedulers e refresh token
23. Deploy final na VM
