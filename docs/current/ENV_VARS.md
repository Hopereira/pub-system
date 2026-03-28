# Variáveis de Ambiente — Pub System

**Última atualização:** 2026-02-11  
**Fonte da verdade:** `.env.example`, `backend/src/app.module.ts` (Joi schema), `docker-compose.yml`  
**Status:** Ativo

---

## Banco de Dados (PostgreSQL)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `DB_HOST` | ✅ | `db` | Host do PostgreSQL. Usar `db` para Docker, `localhost` para dev local |
| `DB_PORT` | ✅ | `5432` | Porta do PostgreSQL |
| `DB_USER` | ✅ | `postgres` | Usuário do banco |
| `DB_PASSWORD` | ✅ | — | Senha do banco |
| `DB_DATABASE` | ✅ | `pub_system_db` | Nome do banco |
| `DB_SSL` | Prod | `false` | Ativar SSL para conexoes externas ao banco. Em prod (Docker local) nao necessario. |
| `DATABASE_URL` | Docker | — | Injetada pelo docker-compose: `postgresql://user:pass@db:5432/dbname` |

### Container PostgreSQL

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `POSTGRES_USER` | ✅ | Usuário inicial do container |
| `POSTGRES_PASSWORD` | ✅ | Senha inicial do container |
| `POSTGRES_DB` | ✅ | Banco criado na inicialização |

---

## Redis (Cache)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `REDIS_HOST` | ✅ (Docker) | `redis` | Host do Redis. Injetado pelo docker-compose |
| `REDIS_PORT` | ✅ (Docker) | `6379` | Porta do Redis |

**Nota:** O `docker-compose.yml` injeta `REDIS_HOST=redis` e `REDIS_PORT=6379` automaticamente. Validados por Joi com defaults `localhost:6379`.

---

## Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `NODE_ENV` | ✅ | — | `development`, `production` ou `test`. **Obrigatório.** |

---

## Segurança (JWT)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `JWT_SECRET` | ✅ | — | Segredo para assinar tokens. **Mínimo 32 caracteres.** Gerar: `openssl rand -base64 32` |

**Validação Joi:** `Joi.string().min(32).required()` em `app.module.ts`

---

## Setup Endpoint

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `ENABLE_SETUP` | Não | `false` | Habilita `POST /setup/super-admin`. Só ativar para criar primeiro Super Admin. |
| `SETUP_TOKEN` | **Sim** (se ENABLE_SETUP=true) | — | Token obrigatório no body quando ENABLE_SETUP=true. Ausente → 500 no boot. |

---

## Credenciais do Admin Inicial

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `ADMIN_EMAIL` | Opcional | `admin@admin.com` | Email do admin criado pelo seeder |
| `ADMIN_SENHA` | Opcional | `admin123` | Senha do admin criado pelo seeder |

---

## Google Cloud Storage (Upload de Imagens)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `GCS_BUCKET_NAME` | Opcional | `pub-system-media-storage` | Nome do bucket no GCS |
| `GOOGLE_APPLICATION_CREDENTIALS` | Opcional | — | Caminho para credenciais JSON. Docker: `/usr/src/app/gcs-credentials.json` |

Sem GCS configurado, uploads de imagens falham mas o sistema funciona normalmente.

---

## URLs

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `BACKEND_URL` | ✅ | `http://localhost:3000` | URL pública do backend |
| `FRONTEND_URL` | ✅ | `http://localhost:3001` | URL pública do frontend (CORS) |
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:3000` | URL da API para o frontend (client-side) |
| `API_URL_SERVER` | ✅ (Docker) | `http://backend:3000` | URL interna container→container (SSR) |

---

## PgAdmin

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `PGADMIN_DEFAULT_EMAIL` | Opcional | `admin@admin.com` | Email de login do PgAdmin |
| `PGADMIN_DEFAULT_PASSWORD` | Opcional | `admin` | Senha de login do PgAdmin |

---

## Cloudflare (DNS Automático para Multi-Tenancy)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `CLOUDFLARE_API_TOKEN` | Prod | — | API Token com permissão DNS Edit |
| `CLOUDFLARE_ZONE_ID` | Prod | — | Zone ID do domínio |
| `CLOUDFLARE_BASE_DOMAIN` | Prod | `pubsystem.com.br` | Domínio base para subdomínios |
| `CLOUDFLARE_TARGET_IP` | Prod | — | IP do servidor backend |

---

## Validação Joi (app.module.ts)

O backend valida as seguintes variáveis na inicialização via Joi:

```typescript
// Extraído de backend/src/app.module.ts
validationSchema: Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DATABASE_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().min(32).required(),
  FRONTEND_URL: Joi.string().uri().required(),
  ENABLE_SETUP: Joi.string().valid('true', 'false').default('false'),
  SETUP_TOKEN: Joi.string().optional(),
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_SENHA: Joi.string().min(8).optional(),
  GCS_BUCKET_NAME: Joi.string().allow('').optional(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().allow('').optional(),
})
```

Todas as variáveis obrigatórias são validadas na inicialização. Erro impede boot.

---

## Exemplo Completo (.env)

```env
# Banco de Dados
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_DATABASE=pub_system_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=pub_system_db

# Ambiente
NODE_ENV=development

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=meu-segredo-super-forte-com-pelo-menos-32-caracteres

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3001

# Admin
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

# URLs
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL_SERVER=http://backend:3000

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin

# GCS (opcional)
GCS_BUCKET_NAME=pub-system-media-storage
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json
```
