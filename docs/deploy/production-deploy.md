# Deploy de Producao — Pub System

**Versao:** 1.0
**Atualizado:** 2026-03-06
**Fonte da verdade:** Este documento define o processo oficial de deploy
**Auditoria:** `docs/audits/infrastructure-audit.md`

---

## 1. Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE DEPLOY                           │
│                                                              │
│  Developer                                                   │
│    │                                                         │
│    ├─ git push main ──▶ GitHub Actions (CI)                  │
│    │                      ├─ Backend: lint + build + test     │
│    │                      └─ Frontend: lint + build           │
│    │                                                         │
│    ├─ Frontend ──▶ Vercel (deploy automatico via Git)        │
│    │                                                         │
│    └─ Backend ──▶ SSH na Oracle VM                           │
│                     └─ scripts/deploy.sh                     │
│                          ├─ 1. Backup banco                  │
│                          ├─ 2. git pull                      │
│                          ├─ 3. docker build                  │
│                          ├─ 4. migrations                    │
│                          ├─ 5. docker up                     │
│                          ├─ 6. health check                  │
│                          └─ 7. rollback se falhar            │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Onde | Deploy |
|-----------|-----|--------|
| **Frontend** | Vercel | Automatico (git push main) |
| **Backend** | Oracle VM (Docker) | Manual via `scripts/deploy.sh` |
| **Banco** | Oracle VM (Docker PG 17) | Migrations automaticas no deploy |
| **Nginx** | Oracle VM (host) | Raramente muda |

---

## 2. Pre-requisitos (Oracle VM)

### Software instalado

| Software | Versao | Verificar |
|---------|--------|-----------|
| Docker | 20+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Nginx | 1.18+ | `nginx -v` |
| pg_dump | 14+ | `pg_dump --version` |

### Acesso

```bash
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235
cd ~/pub-system
```

### Arquivos necessarios

| Arquivo | Localizacao | Descricao |
|---------|------------|-----------|
| `.env` | `~/pub-system/.env` | Variaveis de ambiente (NUNCA versionar) |
| `docker-compose.micro.yml` | Raiz do projeto | Compose de producao |
| `backend/Dockerfile.micro` | Backend | Dockerfile otimizado |

---

## 3. Processo de Deploy — Backend

### 3.1 Deploy Seguro (Recomendado)

```bash
# Na Oracle VM
cd ~/pub-system
./scripts/deploy.sh
```

O script `deploy.sh` executa automaticamente:

1. **Pre-flight checks** — verifica Docker, disco, .env
2. **Backup do banco** — pg_dump antes de qualquer mudanca
3. **Pull do codigo** — git pull origin main
4. **Build da imagem** — docker compose build
5. **Migrations** — executa dentro do container
6. **Swap de container** — para antigo, sobe novo
7. **Health check** — verifica /health em ate 60s
8. **Rollback automatico** — se health falhar, restaura backup e imagem anterior

### 3.2 Deploy Manual (Emergencia)

Se o script falhar, deploy manual passo a passo:

```bash
cd ~/pub-system

# 1. Backup
./scripts/backup.sh

# 2. Pull
git pull origin main

# 3. Build + Restart
docker compose -f docker-compose.micro.yml up -d --build

# 4. Verificar
docker logs pub-backend --tail 50
curl http://localhost:3000/health

# 5. Se falhar, rollback
./scripts/rollback.sh
```

### 3.3 Hotfix (Correcao urgente)

```bash
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build --no-deps backend
docker logs pub-backend -f
```

---

## 4. Processo de Deploy — Frontend

### 4.1 Deploy Automatico (Padrao)

Push para branch `main` → Vercel detecta e faz deploy automatico.

Nenhuma acao manual necessaria.

### 4.2 Deploy Manual (Emergencia)

```bash
# No seu PC local
cd frontend
npx vercel --prod
```

### 4.3 Rollback Frontend

1. Acessar https://vercel.com/hopereiras-projects/pub-system/deployments
2. Encontrar o deploy anterior
3. Clicar nos 3 pontos → "Promote to Production"

---

## 5. Migrations

### 5.1 Como Funcionam

O script `start:prod` no `package.json` executa migrations automaticamente:

```json
"start:prod": "node dist/run-migrations.js && node dist/main"
```

O `run-migrations.ts`:
1. Verifica se ha arquivos em `database/migrations/`
2. Conecta ao banco
3. Executa migrations pendentes em transacao
4. Se falhar, faz rollback da transacao e aborta o boot

### 5.2 Migrations Manuais

```bash
# Dentro do container
docker exec pub-backend node dist/run-migrations.js

# Ou via docker compose
docker compose -f docker-compose.micro.yml exec backend node dist/run-migrations.js
```

### 5.3 Criar Nova Migration

```bash
# No dev local
cd backend
npm run typeorm:migration:generate -- -n NomeDaMigration
```

### 5.4 Riscos de Migrations

| Risco | Mitigacao |
|-------|----------|
| Migration destrutiva (DROP COLUMN) | SEMPRE backup antes do deploy |
| Migration longa (ALTER TABLE grande) | Testar em staging primeiro |
| Migration falha no meio | Executa em transacao (rollback automatico) |
| Rollback impossivel apos migration | Manter backup pre-deploy por 72h |

---

## 6. Backup e Restore

### 6.1 Backup Manual

```bash
./scripts/backup.sh
```

Cria: `backups/pub_system_YYYYMMDD_HHMMSS.sql.gz`

### 6.2 Backup Automatico (Recomendado)

Adicionar ao crontab da Oracle VM:

```bash
# Backup diario as 3h da manha
0 3 * * * cd /home/ubuntu/pub-system && ./scripts/backup.sh >> /var/log/pub-backup.log 2>&1
```

### 6.3 Restore

```bash
./scripts/restore-db.sh backups/pub_system_20260306_030000.sql.gz
```

**CUIDADO:** O restore APAGA o banco atual e substitui pelo backup.

### 6.4 Politica de Retencao

| Tipo | Frequencia | Retencao |
|------|-----------|----------|
| Pre-deploy | Cada deploy | 72 horas |
| Diario | 03:00 UTC-3 | 7 dias |
| Semanal | Domingo 03:00 | 30 dias |

---

## 7. Rollback

### 7.1 Rollback Automatico (via deploy.sh)

O `deploy.sh` faz rollback automatico se o health check falhar apos o deploy.

### 7.2 Rollback Manual

```bash
./scripts/rollback.sh
```

O script:
1. Para o container atual
2. Reverte o git para o commit anterior
3. Rebuilda a imagem com o codigo anterior
4. Restaura o backup do banco (se existir)
5. Inicia o container
6. Verifica health

### 7.3 Rollback Apenas do Banco

```bash
# Listar backups disponiveis
ls -lh backups/

# Restaurar backup especifico
./scripts/restore-db.sh backups/pub_system_20260306_120000.sql.gz pub_system_db
```

### 7.4 Rollback Apenas do Codigo

```bash
# Ver commits recentes
git log --oneline -5

# Voltar para commit especifico
git checkout <commit-hash>
docker compose -f docker-compose.micro.yml up -d --build
```

---

## 8. Health Checks

### 8.1 Endpoints

| Endpoint | Descricao | Esperado |
|---------|-----------|----------|
| `/health` | Health geral | HTTP 200 |
| `/health/live` | Liveness probe | HTTP 200 |
| `/health/ready` | Readiness probe | HTTP 200 |

### 8.2 Verificacao Manual

```bash
# Interno (na VM)
curl http://localhost:3000/health

# Externo
curl https://api.pubsystem.com.br/health
```

### 8.3 Monitoramento Continuo

```bash
# Iniciar monitor (checa a cada 60s)
./scripts/health-monitor.sh 60
```

---

## 9. Checklist de Deploy

### Pre-deploy

- [ ] CI passou (GitHub Actions verde)
- [ ] Mudancas revisadas (PR aprovado se possivel)
- [ ] Testar localmente com `docker compose up`
- [ ] Verificar se ha migrations novas
- [ ] Se migration destrutiva: planejar janela de manutencao

### Durante deploy

- [ ] SSH na Oracle VM
- [ ] Executar `./scripts/deploy.sh`
- [ ] Aguardar conclusao (backup + build + health check)
- [ ] Verificar logs: `docker logs pub-backend --tail 50`

### Pos-deploy

- [ ] Verificar https://api.pubsystem.com.br/health
- [ ] Verificar https://pubsystem.com.br (login funciona?)
- [ ] Verificar WebSocket (pedidos em tempo real)
- [ ] Manter backup por 72h
- [ ] Se problemas: `./scripts/rollback.sh`

---

## 10. Troubleshooting

### Backend nao inicia

```bash
docker logs pub-backend --tail 100
# Procurar por: erro de conexao DB, migration falha, porta em uso
```

### Migration falhou

```bash
# Ver status das migrations
docker exec pub-backend node -e "
  const ds = require('./dist/database/data-source').default;
  ds.initialize().then(async () => {
    const m = await ds.showMigrations();
    console.log('Pending:', m);
    await ds.destroy();
  });
"

# Rollback manual se necessario
./scripts/rollback.sh
```

### Nginx nao faz proxy

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### Container reiniciando em loop

```bash
# Ver logs completos
docker logs pub-backend 2>&1 | head -50

# Verificar recursos
docker stats --no-stream
free -h
df -h
```

### Disco cheio

```bash
# Limpar imagens Docker antigas
docker system prune -af --volumes

# Limpar backups antigos
find backups/ -name "*.sql.gz" -mtime +7 -delete

# Limpar logs Docker
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

---

## 11. Seguranca

### Regras absolutas

1. **NUNCA** versionar credenciais (`.env`, chaves SSH, API tokens)
2. **NUNCA** expor porta 5432 (PostgreSQL) externamente
3. **SEMPRE** usar `.env` local para segredos
4. **SEMPRE** backup antes de deploy
5. **SEMPRE** verificar health apos deploy

### Credenciais

| Item | Onde guardar | Onde NAO guardar |
|------|-------------|-----------------|
| JWT_SECRET | `.env` na VM | Git, docs, Slack |
| DB_PASSWORD | `.env` na VM | Git, docs, Slack |
| SSH Key | `~/.ssh/` local | Git, docs |
| Cloudflare API Token | `.env` na VM | Git, docs |
| Admin password | Banco (hash bcrypt) | Plaintext em docs |

### Rotacao de credenciais

| Credencial | Frequencia | Como |
|-----------|-----------|------|
| JWT_SECRET | A cada 6 meses | Editar `.env`, restart container |
| DB_PASSWORD | A cada 6 meses | ALTER USER + editar `.env` |
| Admin password | A cada 3 meses | Via API ou banco |
| SSH Key | A cada 12 meses | Gerar nova, atualizar Oracle |
