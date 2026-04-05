# Deploy na VM Oracle — Guia Operacional

**Última atualização:** 2026-04-04  
**Arquivo de produção:** `docker-compose.micro.yml` (raiz do projeto)  
**NÃO usar:** `infra/` (pasta removida), `docker-compose.prod.yml` (removido)

---

## Acesso SSH

```bash
ssh -i "D:\projetos\servidor oracle\private Key\ssh-key-2025-12-11.key" ubuntu@134.65.248.235
```

---

## Deploy Automático (CI/CD)

Push para `main` → GitHub Actions executa `.github/workflows/ci.yml`:

1. Build + lint + migrations no CI
2. SSH na VM → `git pull` → `docker compose build backend`
3. `docker compose up -d --no-deps --force-recreate backend`

**O postgres NÃO é recriado no deploy automático** — apenas o backend.

---

## Deploy Manual / Emergência

```bash
# Conectar na VM
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235

# Atualizar código
cd ~/pub-system
git fetch origin && git reset --hard origin/main

# Rebuild e restart do backend
docker compose -f docker-compose.micro.yml build backend
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend

# Verificar
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker logs pub-backend --tail 30
curl http://localhost:3000/health
```

---

## Estado Atual dos Containers (2026-04-04)

| Container | Imagem | Rede | Volume | Porta |
|-----------|--------|------|--------|-------|
| `pub-postgres` | postgres:17-alpine | pub-network | `infra_postgres_data` (external) | 5432 |
| `pub-backend` | Dockerfile.micro | pub-network | — | 3000 |
| `watchtower` | containrrr/watchtower | pub-network | docker.sock | — |

> ⚠️ **IMPORTANTE:** O volume `infra_postgres_data` contém os dados reais de produção.
> NUNCA apagá-lo sem backup.

---

## Primeiro Deploy (instalação nova)

### 1. Instalar Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
exit && ssh ...  # reconectar
```

### 2. Clonar Repositório

```bash
git clone https://github.com/Hopereira/pub-system.git
cd ~/pub-system
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
nano .env
```

Preencher obrigatoriamente:
- `DB_HOST=postgres`
- `DB_SSL=false`
- `JWT_SECRET` (mínimo 32 caracteres: `openssl rand -base64 32`)
- `BACKEND_URL=https://api.pubsystem.com.br`
- `FRONTEND_URL=https://pub-demo.pubsystem.com.br`
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`

### 4. Subir Containers

```bash
docker compose -f docker-compose.micro.yml up -d --build
```

Aguardar até ambos ficarem `(healthy)`:
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

### 5. Verificar

```bash
curl http://localhost:3000/health
# → {"status":"ok","info":{"database":{"status":"up"},...}}

docker exec pub-postgres psql -U pubuser -d pubsystem -c '\dt'
# → Lista de 30 tabelas após migrations
```

### 6. Configurar Nginx

Ver `docs/infra/cloudflare.md`.

---

## Rollback

```bash
# Ver commits disponíveis
git log --oneline -5

# Voltar para commit anterior
git reset --hard <COMMIT_HASH>

# Rebuild do backend
docker compose -f docker-compose.micro.yml build backend
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

---

## Checklist Pós-Deploy

- [ ] `curl https://api.pubsystem.com.br/health` → 200
- [ ] `docker ps` → ambos containers `(healthy)`
- [ ] `docker exec pub-postgres psql -U pubuser -d pubsystem -c '\dt'` → 30+ tabelas
- [ ] Frontend carrega sem 502 ou CORS
- [ ] `sudo systemctl status nginx` → active (running)

---

## Troubleshooting Rápido

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `EAI_AGAIN postgres` nos logs | Containers em redes diferentes | `docker network connect pub-network pub-postgres && docker restart pub-backend` |
| `relation X does not exist` nos logs | Volume errado (banco vazio) | Recriar postgres com `-v infra_postgres_data` |
| 502 Bad Gateway no browser | Backend não está rodando | `docker ps` → ver status |
| CORS error no browser | Backend fora do ar (502) | Mesma causa acima |

Ver `docs/sessions/2026-04-04/DOCKER_REDE_DIAGNOSTICO.md` para detalhes completos.
