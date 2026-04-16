# Acessos Operacionais — pub-system

**Atualizado:** 2026-04-16  
**Classificação:** INTERNO — não compartilhar publicamente

> ⚠️ Este arquivo documenta ONDE encontrar credenciais, não as credenciais em si.
> Senhas reais ficam no `.env` da VM (não versionado) e nos GitHub Secrets.

---

## 1. Super Admin — Produção

| Campo | Valor |
|-------|-------|
| **Email** | `admin@admin.com` |
| **Cargo** | `SUPER_ADMIN` |
| **Tenant** | `NULL` (sem tenant — acesso global) |
| **Senha** | Ver `.env` da Oracle VM → variável `CI_ADMIN_PASSWORD` / gerenciado fora do Git |
| **URL** | https://api.pubsystem.com.br |
| **Como trocar** | `POST /setup/super-admin` com `ENABLE_SETUP=true` + `SETUP_TOKEN` |

---

## 2. GitHub Actions — Secrets necessários

| Secret | Descrição | Onde usar |
|--------|-----------|-----------|
| `ORACLE_SSH_KEY` | Chave SSH privada para deploy na Oracle VM | Job deploy-staging |
| `ORACLE_HOST` | IP da VM (134.65.248.235) | Job deploy-staging |
| `ORACLE_USER` | Usuário SSH (ubuntu) | Job deploy-staging |
| `CI_ADMIN_PASSWORD` | Senha do admin@admin.com (banco de teste do CI) | Job backend — E2E tests |

> Para criar/atualizar secrets:
> GitHub → pub-system → Settings → Secrets and variables → Actions

---

## 3. Banco de Dados — Produção (Oracle VM)

| Campo | Valor |
|-------|-------|
| **Container** | `pub-postgres` |
| **Volume** | `infra_postgres_data` (external) |
| **Host interno** | `postgres` (dentro da rede Docker `pub-network`) |
| **Porta** | `5432` (exposta externamente — restringir por firewall se possível) |
| **Usuário** | Ver `.env` → `POSTGRES_USER` |
| **Senha** | Ver `.env` → `POSTGRES_PASSWORD` |
| **Database** | Ver `.env` → `POSTGRES_DB` |

---

## 4. Infraestrutura — Acesso SSH

| Campo | Valor |
|-------|-------|
| **VM** | Oracle E2.1.Micro — Ubuntu 22.04 |
| **IP** | `134.65.248.235` |
| **Usuário** | `ubuntu` |
| **Chave** | `~/.ssh/oracle_key` (local) / `ORACLE_SSH_KEY` (GitHub Secret) |
| **Comando** | `ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235` |

---

## 5. Serviços Online

| Serviço | URL | Acesso |
|---------|-----|--------|
| Backend API | https://api.pubsystem.com.br | JWT via login |
| Frontend | https://pubsystem.com.br | Login web |
| Health check | https://api.pubsystem.com.br/health | Público |
| Swagger | https://api.pubsystem.com.br/api | Público (dev) |

---

## 6. Recomendações de Segurança

- [ ] **Trocar senha do admin@admin.com** para algo com 12+ caracteres, letras, números e símbolos
- [ ] **Desabilitar `ENABLE_SETUP`** em produção (já deve estar `false` ou ausente)
- [ ] **Restringir porta 5432** no firewall da Oracle (só acesso local/VPN)
- [ ] **Rotacionar `JWT_SECRET`** periodicamente (invalida todos os tokens)
- [ ] **Rotacionar `POSTGRES_PASSWORD`** anualmente

---

## 7. Como Trocar Senha do Admin (Produção)

```bash
# 1. SSH na Oracle VM
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235

# 2. Habilitar setup temporariamente no .env
# Adicionar: ENABLE_SETUP=true
# Adicionar: SETUP_TOKEN=<token-aleatorio-forte>

# 3. Reiniciar backend
cd ~/pub-system
docker compose -f docker-compose.micro.yml restart backend

# 4. Chamar endpoint de troca
curl -X POST https://api.pubsystem.com.br/setup/super-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","senha":"NOVA_SENHA_FORTE","nome":"Admin","setup_token":"<SETUP_TOKEN>"}'

# 5. Remover ENABLE_SETUP e SETUP_TOKEN do .env
# 6. Reiniciar backend novamente
docker compose -f docker-compose.micro.yml restart backend

# 7. Atualizar secret CI_ADMIN_PASSWORD no GitHub com a nova senha
```
