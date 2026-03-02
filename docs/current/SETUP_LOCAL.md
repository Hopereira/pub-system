# Setup Local — Pub System

**Última atualização:** 2026-02-11  
**Fonte da verdade:** `docker-compose.yml`, `.env.example`, `backend/package.json`, `frontend/package.json`  
**Status:** Ativo

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|-----------|--------------|-----------|
| Docker | 20+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Node.js | 18+ (apenas para dev sem Docker) | `node --version` |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/pub-system.git
cd pub-system
```

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` com valores reais. Variáveis obrigatórias:

| Variável | Valor padrão | Descrição |
|----------|-------------|-----------|
| `DB_HOST` | `db` | Host do PostgreSQL (usar `db` para Docker) |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `admin` | Senha do banco |
| `DB_DATABASE` | `pub_system_db` | Nome do banco |
| `POSTGRES_USER` | `postgres` | Para container PostgreSQL |
| `POSTGRES_PASSWORD` | `admin` | Para container PostgreSQL |
| `POSTGRES_DB` | `pub_system_db` | Para container PostgreSQL |
| `JWT_SECRET` | — | **Obrigatório.** Mínimo 32 caracteres. Gerar: `openssl rand -base64 32` |
| `ADMIN_EMAIL` | `admin@admin.com` | Email do admin inicial (seeder) |
| `ADMIN_SENHA` | `admin123` | Senha do admin inicial (seeder) |
| `BACKEND_URL` | `http://localhost:3000` | URL do backend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL da API para o frontend |
| `API_URL_SERVER` | `http://backend:3000` | URL interna (container→container) |

Variáveis opcionais — ver [ENV_VARS.md](./ENV_VARS.md) para lista completa.

---

## 3. Google Cloud Storage (opcional)

Se quiser upload de imagens funcional:

1. Criar bucket no GCS
2. Gerar arquivo de credenciais JSON
3. Salvar como `backend/gcs-credentials.json`
4. Configurar no `.env`:
   ```
   GCS_BUCKET_NAME=seu-bucket
   GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json
   ```

Sem GCS configurado, o upload de imagens falhará silenciosamente mas o sistema funciona.

---

## 4. Subir com Docker Compose

```bash
docker compose up -d
```

Isso inicia **5 serviços**:

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `backend` | 3000 | API NestJS (watch mode) |
| `frontend` | 3001 | Next.js (Turbopack) |
| `db` | 5432 | PostgreSQL 15 |
| `redis` | 6379 | Redis 7 (cache) |
| `pgadmin` | 8080 | Interface gráfica do banco |

**Importante:** O backend depende do `db` e do `redis` com healthcheck. Aguarde até ambos estarem healthy.

### Verificar se tudo subiu

```bash
docker compose ps
```

Todos os serviços devem estar `Up (healthy)` ou `Up`.

### Ver logs do backend

```bash
docker compose logs -f backend
```

Procure por:
- `Nest application successfully started`
- `Seeder: Dados de teste criados`

---

## 5. Acessar o sistema

| URL | Descrição |
|-----|-----------|
| http://localhost:3001 | Frontend (login) |
| http://localhost:3000/api | Swagger UI (apenas dev) |
| http://localhost:3000/health | Health check |
| http://localhost:8080 | PgAdmin |

### Credenciais padrão

| Serviço | Email | Senha |
|---------|-------|-------|
| Sistema (admin) | `admin@admin.com` | `admin123` |
| PgAdmin | `admin@admin.com` | `admin` |

---

## 6. Dados de teste (Seeder)

O seeder executa automaticamente na primeira inicialização e cria:

| Dado | Quantidade |
|------|-----------|
| Ambientes de preparo | 5 (Cozinha, Bar, Pizzaria, etc.) |
| Ambientes de atendimento | 3 (Salão, Varanda, Jardim) |
| Mesas | 22 (distribuídas nos ambientes) |
| Produtos | 42 (variados) |
| Clientes | 5 (com CPF válido) |
| Comandas abertas | 5 (4 com mesa + 1 balcão) |

---

## 7. Desenvolvimento sem Docker

### Backend

```bash
cd backend
npm install
npm run start:dev
```

Requer PostgreSQL e Redis rodando localmente. Ajustar `.env`:
```
DB_HOST=localhost
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 8. Migrations

As migrations são executadas automaticamente pelo script `start:dev` e `start:prod` no `package.json`:

```json
"start:dev": "npm run typeorm:migration:run && nest start --watch"
```

### Comandos manuais

```bash
# Dentro do container backend
docker compose exec backend npm run typeorm:migration:run
docker compose exec backend npm run typeorm:migration:generate -- -n NomeDaMigration
docker compose exec backend npm run typeorm -- migration:show
```

---

## 9. Comandos úteis

```bash
# Parar tudo
docker compose down

# Parar e remover volumes (reset completo do banco)
docker compose down -v

# Rebuild após mudanças no Dockerfile
docker compose up -d --build

# Acessar shell do container backend
docker compose exec backend sh

# Acessar shell do PostgreSQL
docker compose exec db psql -U postgres -d pub_system_db
```

---

## 10. Problemas comuns

| Problema | Solução |
|----------|---------|
| Backend não conecta no banco | Verificar se `db` está healthy: `docker compose ps` |
| Backend não conecta no Redis | Verificar se `redis` está healthy: `docker compose ps` |
| Frontend não conecta na API | Verificar `NEXT_PUBLIC_API_URL` no `.env` |
| Porta já em uso | `docker compose down` e tentar novamente |
| Erro de memória no frontend | Aumentar `NODE_OPTIONS=--max-old-space-size=2048` |
| Swagger não aparece | Swagger só funciona em modo dev (`NODE_ENV !== production`) |

Para mais problemas, ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
