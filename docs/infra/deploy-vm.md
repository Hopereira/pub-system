# Deploy na VM Oracle

## Pre-requisitos

- VM Oracle Always Free (E2.1.Micro) com Ubuntu 22.04
- Docker e Docker Compose instalados
- Chave SSH configurada
- Dominio apontando via Cloudflare

## Acesso SSH

```bash
ssh -i ~/.ssh/oracle_key ubuntu@<IP_PUBLICO>
```

## Primeiro Deploy

### 1. Instalar Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
exit
# Reconectar via SSH
```

### 2. Clonar Repositorio

```bash
git clone https://github.com/SEU_USUARIO/pub-system.git
cd ~/pub-system
```

### 3. Configurar Variaveis de Ambiente

```bash
cp .env.example .env
nano .env
```

Preencher obrigatoriamente:
- `DATABASE_URL`
- `DB_SSL=false`
- `JWT_SECRET` (valor forte, minimo 32 caracteres)
- `ADMIN_EMAIL` / `ADMIN_SENHA`
- `BACKEND_URL` (URL publica da API)
- `FRONTEND_URL` (URL do Vercel)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`

### 4. Criar Volume do Banco

```bash
docker volume create pub_postgres_data
```

### 5. Subir Containers

```bash
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
```

### 6. Verificar

```bash
docker ps
docker logs pub-backend --tail 50
curl http://localhost:3000/health
```

### 7. Configurar Nginx

Ver `docs/infra/cloudflare.md` para configuracao do Nginx e SSL.

### 8. Configurar Backup Automatico

Ver `docs/infra/backup-e-restore.md`.

## Atualizacao (Deploy Subsequente)

```bash
cd ~/pub-system
git pull origin main
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
docker logs pub-backend --tail 50
```

Para rebuild completo sem cache:

```bash
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build --no-cache --force-recreate
```

## Rollback

Se o deploy falhar:

```bash
# Parar containers
docker compose -f infra/docker-compose.prod.yml down

# Voltar ao commit anterior
git log --oneline -5
git checkout <COMMIT_ANTERIOR>

# Rebuild
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
```

## Checklist Pos-Deploy

1. `curl https://api.pubsystem.com.br/health` retorna 200
2. Login funciona no frontend
3. `docker ps` mostra todos containers healthy
4. Volume do banco montado: `docker volume inspect pub_postgres_data`
5. Backup cron ativo: `crontab -l | grep pg_dump`
6. Nginx respondendo: `sudo systemctl status nginx`
