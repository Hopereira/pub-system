# Pub System

Sistema de gestao para bares, pubs e restaurantes. Multi-tenant, tempo real via WebSocket, containerizado com Docker.

## Arquitetura

```mermaid
graph LR
    USER[Usuario] --> CF[Cloudflare]
    CF --> VERCEL[Vercel - Next.js 15]
    CF --> NGINX[Nginx - VM Oracle]
    NGINX --> BACKEND[pub-backend - NestJS 10]
    BACKEND --> DB[pub-postgres - PostgreSQL 17]
```

| Camada | Tecnologia | Hospedagem |
|--------|-----------|------------|
| Frontend | Next.js 15, React 19, Tailwind 4, shadcn/ui | Vercel |
| Backend | NestJS 10, TypeORM, Socket.IO, JWT | Docker na VM Oracle |
| Banco | PostgreSQL 17 | Docker na VM Oracle |
| DNS/SSL | Cloudflare + Nginx | VM Oracle (host) |

## Estrutura do Repositorio

```
backend/       Codigo NestJS (17 modulos)
frontend/      Next.js 15 (App Router)
infra/         docker-compose.yml, docker-compose.prod.yml, docker-compose.micro.yml
scripts/       Scripts SQL, deploy, manutencao
docs/          Documentacao tecnica e operacional
nginx/         Configuracao Nginx para wildcard subdomains
tests/         Testes de carga
```

## Inicio Rapido (Desenvolvimento Local)

```bash
git clone https://github.com/SEU_USUARIO/pub-system.git
cd pub-system
cp .env.example .env
# editar .env com suas configuracoes
docker compose -f infra/docker-compose.yml up -d
```

Acessos apos subir:

| Servico | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| PgAdmin | http://localhost:8080 |

Login padrao: `admin@admin.com` / `admin123`

## Variaveis de Ambiente Obrigatorias

```env
DATABASE_URL=postgresql://pubuser:SenhaForte123@pub-postgres:5432/pubsystem
DB_HOST=pub-postgres
DB_PORT=5432
DB_USER=pubuser
DB_PASSWORD=SenhaForte123
DB_DATABASE=pubsystem
DB_SSL=false

POSTGRES_USER=pubuser
POSTGRES_PASSWORD=SenhaForte123
POSTGRES_DB=pubsystem

JWT_SECRET=valor-forte-minimo-32-caracteres
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

Referencia completa em `.env.example`.

## Deploy na VM (Producao)

```bash
ssh -i ~/.ssh/oracle_key ubuntu@<IP>
cd ~/pub-system
git pull origin main
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
```

Guia completo: [docs/infra/deploy-vm.md](docs/infra/deploy-vm.md)

## Backup e Restore

### Backup manual

```bash
docker exec pub-postgres pg_dump -U pubuser -d pubsystem -F c \
  > ~/backups/pubsystem-$(date +%Y%m%d-%H%M).dump
```

### Restore

```bash
docker exec -i pub-postgres pg_restore -U pubuser -d pubsystem \
  --clean --if-exists < ~/backups/arquivo.dump
```

### Backup automatico (cron diario as 03h)

```
0 3 * * * /usr/bin/docker exec pub-postgres pg_dump -U pubuser -d pubsystem -F c > /home/ubuntu/backups/pubsystem-$(date +\%Y\%m\%d).dump
```

Guia completo: [docs/infra/backup-e-restore.md](docs/infra/backup-e-restore.md)

## Fluxo da Aplicacao

1. Cliente acessa `pubsystem.com.br` (Cloudflare -> Vercel)
2. Frontend faz requisicoes para `api.pubsystem.com.br` (Cloudflare -> Nginx -> pub-backend)
3. Backend autentica via JWT e identifica o tenant (`tenantId` obrigatorio)
4. Dados filtrados por `tenant_id` (NOT NULL, FK) sao retornados do PostgreSQL
5. Atualizacoes em tempo real via WebSocket (pedidos, status, notificacoes)
6. Healthcheck em `GET /health` usado por Docker e Nginx

## Documentacao

### Infraestrutura

| Documento | Descricao |
|-----------|-----------|
| [docs/infra/arquitetura-atual.md](docs/infra/arquitetura-atual.md) | Visao geral da arquitetura, diagrama, variaveis de ambiente |
| [docs/infra/banco-de-dados.md](docs/infra/banco-de-dados.md) | PostgreSQL 17 em Docker, conexao, volume, healthcheck |
| [docs/infra/backup-e-restore.md](docs/infra/backup-e-restore.md) | Backup manual/automatico, restore, verificacao de integridade |
| [docs/infra/deploy-vm.md](docs/infra/deploy-vm.md) | Deploy na VM Oracle, primeiro deploy, atualizacao, rollback |
| [docs/infra/cloudflare.md](docs/infra/cloudflare.md) | DNS Cloudflare, Nginx, SSL, configuracao de proxy |

### Backend

| Documento | Descricao |
|-----------|-----------|
| [docs/backend/arquitetura-backend.md](docs/backend/arquitetura-backend.md) | Modulos NestJS, conexao com banco, validacao, healthcheck |
| [docs/backend/multitenancy.md](docs/backend/multitenancy.md) | Isolamento enterprise-grade por tenant_id, guards, repos tenant-aware |
| [docs/backend/cache.md](docs/backend/cache.md) | Cache in-memory/Redis, TTL por recurso, invalidacao |
| [docs/backend/rate-limit.md](docs/backend/rate-limit.md) | ThrottlerModule, camadas, monitoramento |

### Banco de Dados

| Documento | Descricao |
|-----------|-----------|
| [docs/database/schema.md](docs/database/schema.md) | Entidades, relacionamentos, colunas comuns |
| [docs/database/migrations.md](docs/database/migrations.md) | Comandos TypeORM, fluxo de trabalho, cuidados |
| [docs/database/performance.md](docs/database/performance.md) | Indices, queries lentas, monitoramento, otimizacoes |

### Operacao

| Documento | Descricao |
|-----------|-----------|
| [docs/operacao/comandos-uteis.md](docs/operacao/comandos-uteis.md) | SSH, Docker, banco, Nginx, atualizacao, monitoramento |
| [docs/operacao/troubleshooting.md](docs/operacao/troubleshooting.md) | Diagnostico de problemas comuns em producao |

Documentos historicos de sprints e sessoes anteriores estao em `docs/historico/`.

## Licenca

MIT
