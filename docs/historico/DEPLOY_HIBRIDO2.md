# 🚀 Deploy Híbrido Atualizado (Oracle VM + Docker + PostgreSQL 17)

Guia oficial para manter o Pub System na arquitetura 2026: **Oracle VM (backend + banco via Docker) + Vercel (frontend) + Cloudflare (DNS/SSL)**. Neon não é mais utilizado.

---

## 📊 Visão Geral da Arquitetura

```
Usuário → Cloudflare DNS/Proxy → Nginx (host Oracle)
        → Docker Network `pub-system_default`
        → pub-backend (NestJS) → PostgreSQL 17 (container pub-postgres)
```

| Camada | Serviço | Observações |
|--------|---------|-------------|
| DNS / WAF | Cloudflare | Proxy ativo para `api.pubsystem.com.br` e `pubsystem.com.br` |
| Frontend | Vercel (Next.js 15) | Consome API via HTTPS publico |
| Backend | Oracle Always Free VM (Ubuntu 22.04) | Containers `pub-backend` + `watchtower` |
| Banco | PostgreSQL 17 em Docker (`pub-postgres`) | Volume persistente `pub_postgres_data` |

---

## ✅ Pré-requisitos

1. VM Oracle (shape E2.1.Micro) com Docker + Docker Compose instalados
2. Domínio configurado na Cloudflare
3. Conta Vercel conectada ao repositório
4. `.env` baseado em `.env.example` contendo **`DATABASE_URL`** e `DB_SSL=false`
5. Acesso SSH com chave cadastrada na VM

---

## 🧱 Estrutura do Repositório

```
backend/        → código NestJS
frontend/       → Next.js na Vercel
infra/          → docker-compose.yml (dev), docker-compose.prod.yml, docker-compose.micro.yml
scripts/        → scripts PowerShell/SQL/backup
docs/           → documentação atualizada
```

Na VM mantenha tudo em `~/pub-system` e evite arquivos soltos no root.

---

## 🗄️ Banco de Dados (PostgreSQL 17 em Docker)

### 1. Criar volume persistente

```bash
docker volume create pub_postgres_data
```

### 2. Variáveis obrigatórias

```env
DATABASE_URL=postgresql://pubuser:SenhaForte123@pub-postgres:5432/pubsystem
DB_SSL=false
POSTGRES_USER=pubuser
POSTGRES_PASSWORD=SenhaForte123
POSTGRES_DB=pubsystem
```

> **Importante:** o backend lê apenas `DATABASE_URL`. As variáveis `DB_HOST`, `DB_USER` etc. existem apenas para compatibilidade com scripts e migrations.

### 3. Backup manual

```bash
# Exporta para ~/backups/pubsystem-$(date +%Y%m%d-%H%M).dump
mkdir -p ~/backups
docker exec pub-postgres pg_dump -U pubuser -d pubsystem -F c \
  -f /backups/pubsystem.dump
docker cp pub-postgres:/backups/pubsystem.dump ~/backups/pubsystem-$(date +%Y%m%d-%H%M).dump
docker exec pub-postgres rm /backups/pubsystem.dump
```

### 4. Backup automático (cron)

Edite o crontab do usuário `ubuntu`:

```bash
crontab -e
```

Adicione (backup diário 03h):

```
0 3 * * * /usr/bin/docker exec pub-postgres pg_dump -U pubuser -d pubsystem -F c \
  > /home/ubuntu/backups/pubsystem-$(date +\%Y\%m\%d).dump
```

### 5. Restore

```bash
# Copie o dump para a VM (~/backups/restore.dump) e execute:
docker exec -i pub-postgres pg_restore -U pubuser -d pubsystem --clean --if-exists < ~/backups/restore.dump
```

---

## 🛠️ Preparar a VM Oracle

```bash
ssh -i ~/.ssh/oracle_key ubuntu@SEU_IP
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
exit && ssh novamente

cd ~/pub-system
git pull origin main
cp env.micro.example .env
nano .env # configure as variáveis reais
```

Recomenda-se copiar o `.env` sempre que atualizar o repositório (`git pull`).

---

## 🧩 Subir os containers (Docker Compose)

Os arquivos oficiais estão em `infra/`.

### Desenvolvimento local

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

### Produção (VM Oracle + Nginx host)

```bash
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
```

### Ambiente micro (legacy) — recomendado somente para E2.1.Micro

```bash
docker compose --env-file .env -f infra/docker-compose.micro.yml up -d --build --force-recreate
```

### Comandos úteis

```bash
docker ps
docker logs pub-backend -f
docker exec -it pub-postgres psql -U pubuser -d pubsystem
docker compose -f infra/docker-compose.prod.yml down
```

> **Watchtower** fica no mesmo compose para atualizar imagens automaticamente. Configure `DOCKER_HOST=/var/run/docker.sock` no `.env` se usar autenticação.

---

## 🌐 Cloudflare e Nginx

1. **DNS**
   - `api.pubsystem.com.br` → registro A apontando para o IP público da Oracle, proxy habilitado.
   - `pubsystem.com.br` e `www` → CNAME para Vercel (`cname.vercel-dns.com`).

2. **SSL/TLS**
   - Modo "Full" (recomendado) para trafegar HTTPS até o Nginx.

3. **Nginx (host)**

`/etc/nginx/sites-available/pub-system`:

```
server {
    server_name api.pubsystem.com.br;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/pub-system /etc/nginx/sites-enabled/pub-system
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🎨 Frontend (Vercel)

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pubsystem.com.br` |
| `API_URL_SERVER` (opcional) | `https://api.pubsystem.com.br` |

Deploy automático no branch `main`. Para redeploy manual:

```bash
cd frontend
npm run build
npx vercel --prod
```

---

## 🧪 Checklist após o deploy

1. `curl https://api.pubsystem.com.br/health`
2. Login via frontend (admin@admin.com / admin123)
3. Consultar logs: `docker logs pub-backend --tail 100`
4. Verificar volume: `docker volume inspect pub_postgres_data`
5. Confirmar cron de backup: `grep pg_dump /var/spool/cron/crontabs/ubuntu`

---

## � Operações do dia a dia

| Ação | Comando |
|------|---------|
| Atualizar código | `git pull && docker compose -f infra/docker-compose.prod.yml up -d --build` |
| Reiniciar backend | `docker compose -f infra/docker-compose.prod.yml restart pub-backend` |
| Ver consumo de recursos | `htop`, `docker stats`, `df -h` |
| Listar backups | `ls -lh ~/backups` |

---

## 🩺 Troubleshooting rápido

- **API não responde**: `sudo systemctl status nginx`, `docker ps`, `docker logs pub-backend --tail 200`
- **Banco não sobe**: verifique `docker volume inspect pub_postgres_data` e variáveis `POSTGRES_*`
- **Erro de SSL**: confirme `DB_SSL=false` e que a conexão é interna (`pub-postgres:5432`)
- **Backup falhou**: checar `cron` e permissões de `~/backups`

---

## � Manutenção recomendada

| Frequência | Ação |
|------------|------|
| Diária | Conferir `docker ps`, backups recentes e monitorar logs críticos |
| Semanal | Validar atualizações disponíveis (`watchtower` log), revisar espaço em disco |
| Mensal | Restaurar backup em ambiente de teste para garantir integridade |

---

## � Histórico

- **v2.0.0 (Mar/2026)** – Migração 100% para PostgreSQL local em Docker, eliminação do Neon e padronização via `DATABASE_URL`.

> Guarde este guia no `docs/` e mantenha alinhado ao `docs/ARCHITECTURE.md` e `CHANGELOG.md`.
