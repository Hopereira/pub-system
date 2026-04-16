# Documentacao Real do Sistema — Pub System

**Data:** 2026-04-16 (atualizado; original: 2026-03-06)
**Metodo:** Leitura completa do repositorio (backend, frontend, infra, docs, CI/CD)
**Regra:** Documenta APENAS o que existe no codigo. Nenhuma informacao inventada.
**Status:** FONTE DA VERDADE

---

## 1. Visao Geral

Pub System e um SaaS multi-tenant para gestao de bares, pubs e restaurantes. Permite que multiplos estabelecimentos operem na mesma plataforma com isolamento de dados por `tenant_id`.

### O que o sistema faz

- Gestao de mesas, comandas, pedidos, produtos e cardapio
- Painel de preparo em tempo real (Kanban) com WebSocket
- Caixa financeiro (abertura, vendas, sangrias, fechamento)
- Eventos e paginas de boas-vindas
- Gamificacao com medalhas para garcons
- Analytics e relatorios
- Auto-atendimento via QR Code (cliente faz pedido sem login)
- Planos de assinatura (FREE, BASIC, PRO, ENTERPRISE)

### Stack

| Camada | Tecnologia Real |
|--------|----------------|
| Frontend | Next.js 16.1.6, React 19.1.0, Tailwind CSS 4, shadcn/ui, Radix UI |
| Backend | NestJS (mix @nestjs/common@10 + @nestjs/core@11), TypeORM 0.3.27 |
| Banco | PostgreSQL 17 (Docker container) |
| Tempo real | Socket.IO 4.7.4 |
| Cache (dev) | Redis 7 Alpine |
| Cache (prod) | In-memory (sem Redis) |
| Upload | Google Cloud Storage 7.19.0 |
| Auth | Passport.js + JWT + bcrypt |
| Logging | Winston 3.19.0 |
| Validacao | class-validator + Joi (env vars) |
| Testes | Jest (backend), Playwright (frontend) |

---

## 2. Arquitetura

### 2.1 Producao

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   VERCEL         │     │   CLOUDFLARE     │     │   ORACLE VM E2.1.Micro   │
│   Frontend       │     │   DNS + SSL      │     │   Ubuntu 22.04           │
│   Next.js 16     │     │   Modo: Flexivel │     │   1 vCPU / 1GB RAM       │
│   React 19       │     │                  │     │   134.65.248.235         │
│   pubsystem      │     │   api → A record │     │                          │
│   .com.br        │     │   @ → Vercel     │     │   ┌──────────────────┐   │
│                  │     │   www → Vercel   │     │   │ Nginx (host)     │   │
└─────────────────┘     └──────────────────┘     │   │ :80 → :3000      │   │
                                                  │   └────────┬─────────┘   │
                                                  │            │             │
                                                  │   ┌────────▼─────────┐   │
                                                  │   │ Docker           │   │
                                                  │   │ pub-backend      │   │
                                                  │   │ NestJS :3000     │   │
                                                  │   │ 512MB RAM limit  │   │
                                                  │   └────────┬─────────┘   │
                                                  │            │             │
                                                  │   ┌────────▼─────────┐   │
                                                  │   │ Docker           │   │
                                                  │   │ pub-postgres     │   │
                                                  │   │ PostgreSQL 17    │   │
                                                  │   │ :5432 (interno)  │   │
                                                  │   └──────────────────┘   │
                                                  │                          │
                                                  │   ┌──────────────────┐   │
                                                  │   │ Watchtower       │   │
                                                  │   │ Auto-update 24h  │   │
                                                  │   │ 64MB RAM limit   │   │
                                                  │   └──────────────────┘   │
                                                  └──────────────────────────┘
```

### 2.2 Desenvolvimento Local

```
Docker Compose (docker-compose.yml)
├── pub_system_backend   :3000  NestJS (watch mode)    1.5GB RAM
├── pub_system_frontend  :3001  Next.js (Turbopack)    2.5GB RAM
├── pub_system_db        :5432  PostgreSQL 15          512MB RAM
├── pub_system_redis     :6379  Redis 7                256MB RAM
└── pub_system_pgadmin   :8080  PgAdmin                ~256MB RAM
    Rede: pub_network (bridge)
    Volume: postgres_data
    Total: ~5GB RAM
```

### 2.3 URLs

| Ambiente | Frontend | Backend | Swagger |
|----------|----------|---------|---------|
| Dev | http://localhost:3001 | http://localhost:3000 | http://localhost:3000/api |
| Prod | https://pubsystem.com.br | https://api.pubsystem.com.br | Desabilitado |

---

## 3. Infraestrutura

### 3.1 Componentes Reais

| Componente | Servico | Detalhes |
|-----------|---------|----------|
| **Frontend** | Vercel (Hobby) | Deploy automatico via git push main |
| **Backend** | Docker na Oracle VM | Dockerfile.micro, docker-compose.micro.yml |
| **Banco** | PostgreSQL 17 Docker | Volume persistente postgres_data |
| **Proxy** | Nginx no host Ubuntu | :80 → proxy_pass :3000 |
| **DNS/SSL** | Cloudflare Free | Modo Flexivel (SSL termina no CF) |
| **Auto-update** | Watchtower | Poll a cada 24h, 64MB limit |
| **Cache prod** | In-memory | Sem Redis em producao |
| **Cache dev** | Redis 7 Alpine | docker-compose.yml inclui Redis |

### 3.2 Oracle VM

| Item | Valor |
|------|-------|
| Shape | E2.1.Micro (Always Free) |
| vCPU | 1 |
| RAM | 1GB |
| OS | Ubuntu 22.04 |
| IP | 134.65.248.235 |
| Portas abertas | 22 (SSH), 80 (HTTP) |

### 3.3 Cloudflare DNS

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| A | api | 134.65.248.235 | Ativado |
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |

SSL/TLS: **Flexivel** — Cloudflare→servidor via HTTP, usuario→Cloudflare via HTTPS.

### 3.4 Docker Compose Files

| Arquivo | Usado | Servicos | PostgreSQL |
|---------|-------|----------|-----------|
| `docker-compose.yml` (raiz) | **DEV** | backend, redis, db, pgadmin, frontend | 15-alpine |
| `docker-compose.micro.yml` (raiz) | **PROD** | backend, watchtower | Nenhum (DB local) |
| `docker-compose.prod.yml` (raiz) | Nao usado | backend, frontend, postgres | 15-alpine |
| `infra/docker-compose.yml` | Nao usado | Duplicata exata da raiz | 15-alpine |
| `infra/docker-compose.prod.yml` | Nao usado | Duplicata divergente | **17-alpine** |
| `infra/docker-compose.micro.yml` | Nao usado | Variante sem Cloudflare vars | — |

### 3.5 Dockerfiles

| Arquivo | Base | Usado em | Tamanho Final |
|---------|------|----------|---------------|
| `backend/Dockerfile` | node:20-alpine | Dev | ~1GB |
| `backend/Dockerfile.micro` | node:20-alpine (2-stage) | **Prod** | ~150MB |
| `backend/Dockerfile.prod` | node:20-alpine (2-stage) | Nao usado | ~200MB |
| `frontend/Dockerfile` | node:20 (Debian + Cypress libs) | Dev | ~2GB |
| `frontend/Dockerfile.prod` | node:20-alpine (3-stage) | Nao usado | ~300MB |

### 3.6 Custo Mensal

| Servico | Custo |
|---------|-------|
| Oracle VM (Always Free) | Gratuito |
| Vercel (Hobby) | Gratuito |
| Cloudflare (Free) | Gratuito |
| Dominio (Registro.br) | ~R$40/ano |
| **Total** | **~R$3,33/mes** |

---

## 4. Backend

### 4.1 Estrutura

```
backend/src/
├── main.ts                    # Bootstrap: Helmet, CORS, ValidationPipe, Swagger
├── app.module.ts              # Root module: Joi validation, TypeORM config, global guards
├── auth/                      # JWT, refresh tokens, sessoes, super-admin setup
├── cache/                     # Redis/in-memory cache config
├── common/
│   ├── tenant/                # Multi-tenant: guard, interceptor, context, repository
│   ├── logger/                # Winston structured logging
│   └── decorators/            # @Public, @Roles, @CurrentUser, @SkipTenantGuard
├── database/
│   ├── data-source.ts         # TypeORM DataSource config
│   ├── seeder.service.ts      # Dados de teste (ambientes, mesas, produtos, clientes)
│   └── migrations/            # TypeORM migrations
├── health/                    # GET /health (Terminus)
├── jobs/                      # Cron jobs (ScheduleModule)
├── shared/storage/            # Google Cloud Storage service
└── modulos/
    ├── ambiente/              # Ambientes (PREPARO/ATENDIMENTO)
    ├── analytics/             # Relatorios e metricas (PRO)
    ├── audit/                 # Logs de auditoria
    ├── avaliacao/             # Avaliacoes de clientes (BASIC)
    ├── caixa/                 # Gestao financeira
    ├── cliente/               # CRUD clientes
    ├── comanda/               # Sistema de comandas
    ├── empresa/               # Dados do estabelecimento
    ├── evento/                # Agenda de eventos (BASIC)
    ├── funcionario/           # Gestao de funcionarios/auth
    ├── medalha/               # Gamificacao (PRO)
    ├── mesa/                  # Mesas e mapa visual
    ├── pagina-evento/         # Landing pages de eventos
    ├── payment/               # Pagamentos e assinaturas
    ├── pedido/                # Pedidos e itens
    ├── plan/                  # Planos de assinatura
    ├── ponto-entrega/         # Pontos de entrega (BASIC)
    ├── produto/               # Cardapio e produtos
    └── turno/                 # Check-in/out de funcionarios (PRO)
```

### 4.2 Bootstrap (main.ts)

Ordem de inicializacao real:

1. `app.use(helmet())` — headers de seguranca (CSP condicional em prod)
2. `app.use(cookieParser())` — parsing de cookies (refresh token)
3. `app.useGlobalInterceptors(LoggingInterceptor)` — logging estruturado de requisicoes
4. `app.useGlobalFilters(AllExceptionsFilter)` — error handling global
5. `app.enableCors()` — origens: FRONTEND_URL, localhost:3001, pubsystem.com.br, *.pubsystem.com.br
6. `app.use(json({ limit: '10mb' }))` — limite de payload JSON
7. `app.useGlobalPipes(ValidationPipe)` — whitelist, forbidNonWhitelisted, transform
8. Swagger setup (apenas NODE_ENV !== production)
9. `app.listen(3000)`

### 4.3 Guards Globais (app.module.ts)

Executam em TODA requisicao, nesta ordem:

| Guard | Registrado em | Funcao |
|-------|--------------|--------|
| `JwtAuthGuard` | APP_GUARD | Valida JWT (exceto @Public) |
| `TenantGuard` | APP_GUARD (via TenantModule) | Valida tenant ativo |
| `TenantRateLimitGuard` | APP_GUARD (via TenantModule) | Rate limit por plano |
| `CustomThrottlerGuard` | APP_GUARD | Rate limit global |

### 4.4 Dependencias Reais (backend/package.json)

| Pacote | Versao | Nota |
|--------|--------|------|
| `@nestjs/common` | ^11.1.17 | ✅ Corrigido — alinhado com core v11 |
| `@nestjs/core` | ^11.1.18 | |
| `@nestjs/platform-express` | ^11.1.16 | |
| `@nestjs/platform-socket.io` | ^11.1.16 | |
| `@nestjs/typeorm` | ^11.0.0 | |
| `@nestjs/jwt` | ^10.2.0 | |
| `@nestjs/schedule` | ^6.1.1 | |
| `@nestjs/swagger` | ^11.2.6 | |
| `@nestjs/terminus` | ^11.0.0 | |
| `@nestjs/throttler` | ^6.5.0 | |
| `typeorm` | ^0.3.27 | ✅ Corrigido — em `dependencies` |
| `pg` | ^8.11.3 | |
| `socket.io` | ^4.7.4 | |
| `cache-manager` | ^7.x | Atualizado — PR #272 |
| `cache-manager-redis-yet` | ^5.1.5 | Instalado, nao usado em prod |
| `helmet` | ^8.1.0 | |
| `winston` | ^3.19.0 | |
| `decimal.js` | ^10.6.0 | Calculos monetarios |
| `@google-cloud/storage` | ^7.19.0 | |

### 4.5 API (~130 endpoints)

Fonte: todos os `*.controller.ts` em `backend/src/`.

**Endpoints publicos (~25):** login, refresh, registro tenant, cardapio, mesas livres, criar comanda, fazer pedido, QR code, clientes, avaliacoes.

**Endpoints protegidos (~105):** gestao de ambientes, mesas, produtos, pedidos, comandas, caixa, funcionarios, turnos, eventos, analytics, medalhas, auditoria.

**Super Admin (~15):** gestao de tenants, planos, metricas globais, reset senha.

Referencia completa: `docs/current/API.md` (conferido — correto).

### 4.6 WebSocket (Socket.IO)

| Gateway | Namespace | Eventos principais |
|---------|-----------|-------------------|
| PedidosGateway | `/` | novo_pedido, status_atualizado, comanda_atualizada, caixa_atualizado |
| TurnoGateway | `/turnos` | turno_atualizado |

Ambos herdam `BaseTenantGateway` — isolamento por room `tenant_{tenantId}`.

Autenticacao: JWT no handshake, fallback para query param ou header (risco de seguranca).

### 4.7 Cron Jobs

| Job | Schedule | Funcao | Problema |
|-----|----------|--------|----------|
| QuaseProntoScheduler | A cada 30s | Marca itens quase prontos | **NAO filtra por tenant_id** |
| MedalhaScheduler | A cada 5min | Verifica medalhas garcons | **NAO filtra por tenant_id** |

Ambos usam `@InjectRepository` direto, bypassando `BaseTenantRepository`.

### 4.8 Seeder

Executa automaticamente na primeira inicializacao. Cria:

| Dado | Quantidade |
|------|-----------|
| Ambientes de preparo | 5 (Cozinha, Bar, Pizzaria, etc.) |
| Ambientes de atendimento | 3 (Salao, Varanda, Jardim) |
| Mesas | 22 |
| Produtos | 42 |
| Clientes | 5 |
| Comandas abertas | 5 |

Requer `DEFAULT_TENANT_ID` no .env.

---

## 5. Frontend

### 5.1 Stack Real (frontend/package.json)

| Pacote | Versao |
|--------|--------|
| `next` | 16.2.3 | Atualizado (fix CVE-2025-66478, sessao 2026-04-07) |
| `react` | 19.1.0 |
| `tailwindcss` | ^4 |
| `@radix-ui/*` | Varias (dialog, dropdown, tabs, etc.) |
| `@tanstack/react-query` | ^5.90.6 |
| `@tanstack/react-table` | ^8.21.3 |
| `axios` | ^1.11.0 |
| `socket.io-client` | ^4.8.1 |
| `react-hook-form` | ^7.62.0 |
| `zod` | ^4.1.5 |
| `lucide-react` | ^0.542.0 |
| `sonner` | ^2.0.7 |
| `date-fns` | ^4.1.0 |
| `jwt-decode` | ^4.0.0 |
| `qrcode.react` | ^4.2.0 |
| `@playwright/test` | ^1.57.0 |

### 5.2 Estrutura de Rotas

```
frontend/src/app/
├── (auth)/                        # Login
│   └── login/
├── (protected)/                   # Requer JWT
│   ├── dashboard/                 # Admin/Gerente
│   │   ├── admin/                 # Gestao empresa
│   │   ├── cardapio/              # Gestao produtos
│   │   ├── comandas/              # Gestao comandas
│   │   ├── configuracoes/         # Configuracoes
│   │   ├── cozinha/               # Painel cozinha
│   │   ├── gestaopedidos/         # Gestao pedidos
│   │   ├── mapa/                  # Configurador de mapa
│   │   ├── operacional/           # Paineis operacionais (mesas, caixa, ambientes)
│   │   ├── perfil/                # Perfil usuario
│   │   └── relatorios/            # Analytics
│   ├── caixa/                     # Area do caixa
│   │   ├── terminal/              # Busca e pagamento
│   │   ├── comandas-abertas/      # Lista comandas
│   │   ├── gestao/                # Gestao caixa
│   │   ├── clientes/              # Clientes
│   │   ├── relatorios/            # Relatorios
│   │   └── historico/             # Historico
│   ├── garcom/                    # Area do garcom
│   │   ├── mapa/                  # Mapa configurador
│   │   ├── mapa-visual/           # Mapa visual
│   │   ├── novo-pedido/           # Novo pedido
│   │   ├── qrcode-comanda/        # QR Code
│   │   └── ranking/               # Ranking
│   ├── cozinha/                   # Area da cozinha
│   ├── mesas/                     # Mesas
│   └── super-admin/               # Plataforma
│       ├── tenants/               # Gestao tenants
│       ├── planos/                # Gestao planos
│       ├── pagamentos/            # Pagamentos
│       └── configuracoes/         # Config plataforma
├── (public)/                      # Publico (cardapio)
├── (publico)/                     # Publico (auto-atendimento)
├── (cliente)/                     # Area do cliente
├── comanda/[id]/                  # QR Code comanda
├── evento/[id]/                   # Pagina do evento
├── entrada/[id]/                  # Entrada paga
├── t/[slug]/                      # Rewrite multi-tenant
└── api/                           # API routes Next.js
```

### 5.3 Services (frontend/src/services/)

22 services que mapeiam 1:1 com os modulos do backend:

ambienteService, analyticsService, authService, avaliacaoService, caixaService,
clienteService, comandaService, empresaService, eventoService, firstAccessService,
funcionarioService, mapaService, mesaService, paginaEventoService, paymentService,
pedidoService, planService, pontoEntregaService, produtoService, rankingService,
superAdminService, turnoService

Base: `api.ts` com Axios + interceptor JWT automatico + retry.

### 5.4 Middleware Multi-Tenant

Fonte: `frontend/src/middleware.ts`

Detecta subdominio e reescreve internamente:
```
casarao-pub.pubsystem.com.br/ → /t/casarao-pub
```

Hosts excluidos: localhost, pubsystem.com.br, www, pub-system.vercel.app.
Rotas que NAO sao reescritas: /dashboard, /api, /_next.

### 5.5 Redirecionamento por Role

Apos login, redireciona automaticamente:

| Role | Destino |
|------|---------|
| ADMIN / GERENTE | /dashboard |
| GARCOM | /garcom |
| CAIXA | /caixa |
| COZINHEIRO | /cozinha |

---

## 6. Banco de Dados

### 6.1 Configuracao Real

| Item | Desenvolvimento | Producao |
|------|----------------|----------|
| Imagem | postgres:15-alpine | postgres:17 |
| Container | pub_system_db | pub-postgres |
| Host | db (Docker network) | localhost (Docker interno) |
| Porta | 5432 | 5432 (nao exposta) |
| Volume | postgres_data | postgres_data |
| SSL | Nao | Nao (DB local) |
| Extensoes | uuid-ossp | uuid-ossp |

### 6.2 Tabelas (30 totais)

**Operacionais com tenant_id (24):**
ambientes, avaliacoes, abertura_caixa, clientes, comandas, comanda_agregados,
empresas, eventos, funcionarios, item_pedido, medalhas, medalha_funcionario,
mesas, paginas_evento, pedidos, pontos_entrega, produtos, subscription,
payment_transactions, turnos, audit_logs, pagina_evento_media

**Globais sem tenant_id (4):**
tenants, plans, payment_configs, refresh_tokens

**Tabela de sistema:**
migrations

### 6.3 Problemas Criticos do Banco

| Problema | Detalhe |
|---------|---------|
| tenant_id **nullable: true** em 24 tabelas | Banco permite INSERT sem tenant |
| **Zero FKs** de tenant_id → tenants(id) | Deletar tenant nao limpa dados |
| TenantAwareEntity existe mas **ninguem herda** | Classe base correta nao e usada |
| Migration NOT NULL **nao executada** | Esta em migrations_backup |
| Cliente.cpf UNIQUE **global** | Impede mesmo CPF em tenants diferentes |
| empresaId **legado** | Coexiste com tenant_id em funcionarios e pontos_entrega |
| Faltam **7 indices compostos** | tenant_id + data/status para relatorios |

Documentacao completa: `docs/database/schema.md` (716 linhas, todas 30 tabelas).

### 6.4 TypeORM Config

Fonte: `backend/src/database/data-source.ts`

- Entities: glob `**/*.entity.{ts,js}`
- Migrations: `database/migrations/**/*.{ts,js}`
- `synchronize: false`
- `migrationsRun: false` (migrations rodam via script separado antes do boot)
- SSL condicional: `DB_SSL=true` ativa `{ rejectUnauthorized: false }`

### 6.5 Migrations

Executadas automaticamente no boot via:
```json
"start:dev": "npm run migration:run && nest start --watch"
"start:prod": "node dist/run-migrations.js && node dist/main"
```

O `run-migrations.ts` executa em transacao e aborta o boot se falhar.

---

## 7. Multi-Tenant

### 7.1 Modelo

- Banco compartilhado, schema compartilhado
- Todas as tabelas operacionais tem coluna `tenant_id` (UUID)
- Isolamento via camada de aplicacao (BaseTenantRepository)
- **NAO ha enforcement de banco** (tenant_id nullable, sem FKs)

### 7.2 Camadas de Protecao

| Camada | Componente | Funcao |
|--------|-----------|--------|
| HTTP | TenantInterceptor (global) | Resolve tenant de subdomain/JWT/header |
| HTTP | TenantGuard (global) | Valida tenant ativo, bloqueia cross-tenant |
| Query | BaseTenantRepository | Adiciona WHERE tenant_id em todas queries |
| WebSocket | BaseTenantGateway | Isola por room tenant_{id} |
| Context | TenantContextService | Armazena tenantId por request (request-scoped) |
| Auth | JWT payload | tenantId no token |
| Cache | Chaves com prefixo | `tenant:{id}:recurso:params` |

### 7.3 Resolucao de Tenant

Ordem de prioridade no TenantInterceptor:

1. Subdomain (casarao-pub.pubsystem.com.br)
2. Slug na URL (/t/casarao-pub)
3. tenantId no JWT
4. Header X-Tenant-ID

### 7.4 Planos e Features

| Plano | Features |
|-------|----------|
| FREE | empresa, ambiente, mesa, funcionario, comanda, pedido, produto |
| BASIC | FREE + CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES |
| PRO | BASIC + ANALYTICS, TURNOS, MEDALHAS |
| ENTERPRISE | PRO + tudo, limites expandidos |

FeatureGuard bloqueia endpoints de modulos fora do plano com `@RequireFeature(Feature.X)`.

### 7.5 Rate Limit por Plano

| Plano | req/min | req/hora | burst/seg |
|-------|---------|----------|-----------|
| FREE | 20 | 500 | 5 |
| BASIC | 60 | 2000 | 15 |
| PRO | 100 | 5000 | 30 |
| ENTERPRISE | 500 | 20000 | 100 |

### 7.6 Provisioning

`POST /registro` cria em uma transacao atomica:
Tenant → Empresa → Ambientes padrao → Mesas → Funcionario ADMIN

### 7.7 Vulnerabilidades Multi-Tenant

| Problema | Severidade |
|---------|-----------|
| tenant_id nullable no banco | CRITICO |
| Zero FKs para tabela tenants | CRITICO |
| QuaseProntoScheduler sem filtro tenant | CRITICO |
| MedalhaScheduler sem filtro tenant | CRITICO |
| RefreshToken.validateRefreshToken pula check cross-tenant se tenantId ausente | ALTO |
| BaseTenantGateway aceita conexao sem JWT (fallback query param) | ALTO |
| Cliente.cpf UNIQUE global | ALTO |

---

## 8. Fluxo de Requisicao

### 8.1 HTTP (Producao)

```
1. Browser → pubsystem.com.br
2. Cloudflare resolve DNS → Vercel
3. Vercel serve frontend Next.js 16
4. Frontend faz request → api.pubsystem.com.br
5. Cloudflare resolve → 134.65.248.235 (SSL Flexivel → HTTP)
6. Nginx :80 → proxy_pass localhost:3000
7. Docker pub-backend :3000
8. NestJS pipeline:
   a. Helmet (headers seguranca)
   b. CORS check
   c. JwtAuthGuard (valida token)
   d. TenantGuard (resolve e valida tenant)
   e. TenantRateLimitGuard (rate limit por plano)
   f. CustomThrottlerGuard (rate limit global)
   g. ValidationPipe (valida DTO)
   h. Controller → Service → BaseTenantRepository
   i. TypeORM → PostgreSQL (WHERE tenant_id = ?)
9. Response → JSON
```

### 8.2 WebSocket

```
1. Frontend conecta Socket.IO → api.pubsystem.com.br
2. BaseTenantGateway.handleConnection()
3. Extrai tenantId do JWT no handshake
4. Client entra no room tenant_{tenantId}
5. Eventos emitidos apenas para clients do mesmo tenant
```

### 8.3 Fluxo de Pedido (end-to-end)

```
1. POST /pedidos (garcom) ou POST /pedidos/cliente (publico)
2. Service cria Pedido + ItemPedido com tenantId
3. WebSocket emite: novo_pedido, novo_pedido_ambiente:{ambienteId}
4. Painel de preparo (Kanban) recebe notificacao com som
5. Cozinha/Bar atualiza: PATCH /pedidos/item/:id/status → EM_PREPARO → PRONTO
6. Garcom retira: PATCH /pedidos/item/:id/retirar
7. Entregue: PATCH /pedidos/item/:id/marcar-entregue
8. Comanda fechada: PATCH /comandas/:id/fechar → registra venda + libera mesa
```

---

## 9. Deploy

### 9.1 Frontend (Automatico)

Push para branch `main` → Vercel detecta e faz deploy automatico.

Variaveis no Vercel Dashboard:

| Variavel | Valor |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://api.pubsystem.com.br |
| API_URL_SERVER | https://api.pubsystem.com.br |

### 9.2 Backend (Manual)

```bash
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235
cd ~/pub-system
./scripts/deploy.sh
```

O `scripts/deploy.sh` executa:
1. Pre-flight checks (Docker, disco, .env)
2. Backup do banco (pg_dump)
3. git pull origin main
4. docker compose -f docker-compose.micro.yml build --no-cache
5. docker compose -f docker-compose.micro.yml up -d
6. Health check (60s timeout)
7. Rollback automatico se health falhar

### 9.3 Compose de Producao (docker-compose.micro.yml)

| Servico | Imagem | RAM | Funcao |
|---------|--------|-----|--------|
| backend | Dockerfile.micro | 512MB | API NestJS |
| watchtower | containrrr/watchtower | 64MB | Auto-update 24h |

### 9.4 Dockerfile de Producao (Dockerfile.micro)

```
Stage 1 (builder): node:20-alpine → npm install → npm run build → npm prune --production
Stage 2 (production): node:20-alpine → COPY dist + node_modules → user nestjs
CMD: node dist/src/main.js
Heap: 384MB (--max-old-space-size=384)
Health: wget http://localhost:3000/health
```

### 9.5 Backup e Rollback

| Script | Funcao |
|--------|--------|
| `scripts/backup.sh` | Backup PG (deploy/daily/weekly) |
| `scripts/rollback.sh` | Rollback codigo + banco |
| `scripts/deploy.sh` | Deploy seguro com rollback automatico |

Documentacao completa: `docs/deploy/production-deploy.md`.

---

## 10. CI/CD

### 10.1 Pipeline (.github/workflows/ci.yml)

| Job | Trigger | Status |
|-----|---------|--------|
| backend | push/PR main | **Funciona** — lint + build + migrations + tests |
| frontend | push/PR main | **Funciona** — lint + build |
| security | apos backend+frontend | **Inutil** — `npm audit || true` sempre passa |
| deploy-staging | push main | **CORRIGIDO** (2026-04-04) — usa Docker, sem PM2 |

### 10.2 Deploy CI (Corrigido)

O job `deploy-staging` executa via SSH:
```bash
docker compose -f docker-compose.micro.yml build backend
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

Corrigido na sessao 2026-04-04: removido PM2, usando Docker com `--no-deps --force-recreate backend`.

### 10.3 Deploy Real

Frontend: automatico via Vercel Git Integration.
Backend: automatico via GitHub Actions (SSH + Docker) ou manual via SSH.

---

## 11. Seguranca

### 11.1 Autenticacao

- Login: `POST /auth/login` → valida bcrypt → retorna access_token + refresh_token (httpOnly cookie)
- JWT payload: `{ id, email, cargo, empresaId, tenantId }`
- Refresh: `POST /auth/refresh` via cookie ou body (fallback)
- Sessoes: listar, revogar individual, revogar todas
- JWT_SECRET: minimo 32 caracteres (validado por Joi)

### 11.2 Autorizacao

Roles: SUPER_ADMIN, ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO, COZINHA, BARTENDER

Guards globais: JwtAuthGuard → TenantGuard → TenantRateLimitGuard → CustomThrottlerGuard

Decorators: @Public(), @Roles(), @RequireFeature(), @SkipTenantGuard(), @SkipRateLimit()

### 11.3 Rate Limiting

Global (ThrottlerModule):
- short: 3 req/seg
- medium: 20 req/10seg
- long: 100 req/min

Per-endpoint: @ThrottleLogin (5/min), @ThrottleAPI (30/min), @ThrottleStrict (3/min)

Per-tenant: TenantRateLimitGuard (limites por plano, ver secao 7.5)

### 11.4 Headers (Helmet)

X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.
CSP e COEP desabilitados.

### 11.5 Validacao de Input

ValidationPipe global: whitelist, forbidNonWhitelisted, transform.
DTOs com class-validator.
Body limit: 10MB (`main.ts`).

### 11.6 CORS

Origens permitidas:
- `process.env.FRONTEND_URL`
- `http://localhost:3001`
- `https://pub-system.vercel.app`
- `https://pubsystem.com.br`
- `https://www.pubsystem.com.br`
- `/\.pubsystem\.com\.br$/` (regex para subdomains)

### 11.7 Auditoria

Modulo `audit/` registra: CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAILED.
Endpoints de consulta: listar, por entidade, por usuario, relatorio, estatisticas, logins falhados.

### 11.8 Vulnerabilidades Conhecidas

| Vulnerabilidade | Severidade | Status |
|----------------|-----------|--------|
| Credenciais expostas no Git (DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md) | CRITICO | Pendente |
| SSH key no historico Git | CRITICO | Pendente |
| JWT Secret possivelmente previsivel em prod | CRITICO | Pendente |
| Migration tenant_id NOT NULL nao executada | CRITICO | Pendente |
| tenant_id nullable em 24 tabelas | CRITICO | Pendente |
| Schedulers sem filtro tenant (cross-tenant data) | CRITICO | Pendente |
| RefreshToken validation pula check cross-tenant | ALTO | **Corrigido 2026-03-28** |
| WebSocket aceita conexao sem JWT verificado | ALTO | Pendente |

---

## 12. Dependencias

### 12.1 Backend

**Problema critico:** `@nestjs/common@10` misturado com `@nestjs/core@11`.
**Problema alto:** `typeorm` esta em devDependencies (falha em `Dockerfile.prod` com `--only=production`).

Versao Node.js: 20 (Dockerfile).

### 12.2 Frontend

Next.js 16.1.6, React 19.1.0, Tailwind 4. Tudo alinhado e sem conflitos.

Cypress libs instaladas no Dockerfile dev mas projeto usa Playwright (+500MB desnecessario).

### 12.3 Raiz

`package.json` na raiz do monorepo tem dependencias de frontend que nao deviam estar ali (cria node_modules fantasma).

---

## 13. Problemas Detectados

### P0 — Criticos

| # | Problema | Onde |
|---|---------|------|
| 1 | Credenciais expostas no Git history | DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md |
| 2 | ~~CI/CD deploy quebrado (PM2 vs Docker)~~ | ✅ Corrigido 2026-04-04 |
| 3 | ~~NestJS version mismatch (v10 vs v11)~~ | ✅ Corrigido — ambos v11 |
| 4 | tenant_id nullable em 24 tabelas | Todas entities |
| 5 | Zero FKs de tenant_id → tenants | Banco de dados |
| 6 | Migration NOT NULL nao executada | migrations_backup/ |
| 7 | Schedulers processam dados cross-tenant | quase-pronto.scheduler.ts, medalha.scheduler.ts |
| 8 | Sem Redis em producao | docker-compose.micro.yml |

### P1 — Altos

| # | Problema | Onde |
|---|---------|------|
| 9 | SSH key no historico Git | Historico git |
| 10 | ~~6 docker-compose duplicados e divergentes~~ | ✅ `infra/` e `docker-compose.prod.yml` removidos |
| 11 | ~~typeorm em devDependencies~~ | ✅ Corrigido — em `dependencies` |
| 12 | RefreshToken pula validacao cross-tenant | refresh-token.service.ts |
| 13 | WebSocket aceita conexao sem JWT | base-tenant.gateway.ts |
| 14 | Cliente.cpf UNIQUE global (deveria ser [cpf, tenant_id]) | cliente.entity.ts |
| 15 | 29 arquivos soltos na raiz | Raiz do projeto |
| 16 | Frontend Dockerfile instala Cypress (usa Playwright) | frontend/Dockerfile |
| 17 | npm install --force mascara mismatch | backend/Dockerfile |
| 18 | PostgreSQL 15 (dev) vs 17 (prod) inconsistente | docker-compose files |
| 19 | docker-compose.prod.yml env_file errado | docker-compose.prod.yml |
| 20 | NEXT_PUBLIC_API_URL com nome Docker interno | docker-compose.prod.yml |
| 21 | package.json fantasma na raiz | package.json |
| 22 | empresaId legado coexiste com tenant_id | funcionario, ponto_entrega |
| 23 | Faltam 7 indices compostos criticos | Banco de dados |

### P2 — Medios

| # | Problema | Onde |
|---|---------|------|
| 24 | nginx.conf com SSL nao usado em prod | nginx/nginx.conf |
| 25 | Watchtower sem controle de rollback | docker-compose.micro.yml |
| 26 | npm audit || true (cosmético) | ci.yml |
| 27 | 9+ scripts duplicados raiz vs scripts/ | Raiz + scripts/ |
| 28 | Docs de deploy contraditorios | DEPLOY_HIBRIDO.md, DEPLOY.md, GUIA_RAPIDO |
| 29 | ~~start:prod path incorreto (dist/main vs dist/src/main)~~ | ✅ Corrigido — path correto `dist/src/main` |

---

## 14. Recomendacoes

### Semana 1 — Seguranca (Urgente)

1. **Rotacionar TODAS as credenciais** expostas (JWT, DB, Admin)
2. **Remover credenciais do Git history** (BFG Repo-Cleaner)
3. **Executar migration tenant_id NOT NULL** em producao
4. **Corrigir schedulers** para filtrar por tenant_id
5. **Alinhar @nestjs/common** para v11

### Semana 2 — Infraestrutura

6. **Corrigir CI/CD** — trocar PM2 por Docker no deploy job
7. **Deletar pasta infra/** — duplicatas sem valor
8. **Mover typeorm** de devDeps para deps
9. **Adicionar Redis** ao docker-compose.micro.yml
10. **Remover Cypress** do frontend/Dockerfile (usar Playwright)

### Semana 3 — Organizacao

11. **Mover 29 arquivos** da raiz para scripts/ ou remover
12. **Deletar docker-compose.prod.yml** (nao usado)
13. **Alinhar PostgreSQL** para v17 em todos os compose files
14. **Remover package.json** da raiz ou converter para workspace
15. **Corrigir start:prod** path no package.json

### Semana 4 — Banco de Dados

16. **Adicionar FKs** de tenant_id → tenants(id) com CASCADE
17. **Alterar Cliente.cpf** para UNIQUE [cpf, tenant_id]
18. **Remover empresaId** legado de funcionarios e pontos_entrega
19. **Criar 7 indices compostos** criticos
20. **Herdar TenantAwareEntity** em todas as entities

---

## Documentos de Referencia

| Documento | Conteudo | Status |
|-----------|---------|--------|
| `docs/architecture/current-system.md` | **ESTE** — fonte da verdade | Atualizado |
| `docs/architecture/infrastructure.md` | Infraestrutura detalhada | Atualizado |
| `docs/architecture/multi-tenant.md` | Design multi-tenant | Atualizado |
| `docs/database/schema.md` | Schema completo (30 tabelas) | Atualizado |
| `docs/deploy/production-deploy.md` | Processo de deploy | Atualizado |
| `docs/current/API.md` | ~130 endpoints | Correto |
| `docs/current/ENV_VARS.md` | Variaveis de ambiente | Correto |
| `docs/current/REGRAS_NEGOCIO.md` | Regras de dominio | Correto |
| `docs/current/SEGURANCA.md` | Seguranca | Parcialmente correto |
| `docs/current/PERMISSOES.md` | Matriz de permissoes | Correto |
| `docs/audits/database-audit.md` | Auditoria do banco | Atualizado |
| `docs/audits/infrastructure-audit.md` | Auditoria de infra | Atualizado |
| `docs/audits/multi-tenant-audit.md` | Auditoria multi-tenant | Atualizado |

### Documentos Obsoletos (NAO confiar)

| Documento | Problema |
|-----------|----------|
| `DEPLOY_HIBRIDO.md` | Credenciais expostas + arquitetura obsoleta (Neon + Tunnel) |
| `GUIA_RAPIDO_SERVIDORES.md` | Credenciais expostas + info contradictoria |
| `docs/current/ARQUITETURA.md` | **Corrigido 2026-03-28** — versoes atualizadas |
| `docs/current/SETUP_LOCAL.md` | Usa `docker compose -f infra/docker-compose.yml` (incorreto) |
| `README.md` | Usa `docker compose -f infra/docker-compose.yml` (incorreto), Next.js 15 (real: 16) |
