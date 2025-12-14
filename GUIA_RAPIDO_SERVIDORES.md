# ⚡ Guia Rápido - Servidores Híbridos

> Comandos essenciais para operar o Pub System em produção

---

## 🌐 URLs de Acesso

| Serviço | URL |
|---------|-----|
| **Frontend** | https://pubsystem.com.br |
| **API Backend** | https://api.pubsystem.com.br |
| **Vercel Dashboard** | https://vercel.com/hopereiras-projects/pub-system |
| **Cloudflare** | https://dash.cloudflare.com |
| **Neon Console** | https://console.neon.tech |

**Login**: `admin@admin.com` / `admin123`

---

## 🖥️ Oracle VM (Backend)

### Conectar via SSH

```bash
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235
```

### Comandos Essenciais

```bash
# Ir para o projeto
cd ~/pub-system

# Ver status dos containers
docker ps

# Ver logs do backend (tempo real)
docker logs pub-backend -f

# Ver últimas 100 linhas de log
docker logs pub-backend --tail 100
```

### Atualizar Backend (IMPORTANTE!)

```bash
cd ~/pub-system
git pull origin main

# ⚠️ SEMPRE use --no-cache para garantir que o código novo seja compilado
docker compose -f docker-compose.micro.yml up -d --build --no-cache --force-recreate
```

**Por que `--no-cache`?** O Docker usa cache de layers. Sem essa flag, ele pode usar código antigo mesmo após `git pull`!

### Reiniciar Serviços

```bash
# Reiniciar containers
docker compose -f docker-compose.micro.yml restart

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Verificar Nginx

```bash
# Status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Logs de erro
sudo tail -f /var/log/nginx/error.log
```

---

## 🎨 Vercel (Frontend)

### Deploy Automático
Push no branch `main` → Deploy automático

### Deploy Manual (se necessário)

```bash
cd frontend
npm run build
npx vercel --prod
```

### Variáveis de Ambiente

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pubsystem.com.br` |

**Editar**: Settings → Environment Variables

---

## 🗄️ Neon (Banco de Dados)

### Conexão via psql

```bash
psql "postgresql://neondb_owner:npg_AiCeM9ju7rLT@ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Variáveis de Ambiente

```env
DB_HOST=ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_AiCeM9ju7rLT
DB_DATABASE=neondb
DB_SSL=true
```

---

## ☁️ Cloudflare

### DNS Records

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| A | api | 134.65.248.235 | ✅ Ativado |
| CNAME | @ | cname.vercel-dns.com | ❌ DNS only |
| CNAME | www | cname.vercel-dns.com | ❌ DNS only |

### SSL/TLS
- **Modo**: Flexível
- **Local**: SSL/TLS → Overview

---

## 🔧 Troubleshooting Rápido

### API não responde (Erro 522)

```bash
# Na Oracle VM
sudo systemctl restart nginx
docker compose -f docker-compose.micro.yml restart
```

### Erro de CORS

```bash
# Na Oracle VM - atualizar código
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build
```

### Verificar se tudo está rodando

```bash
# Backend
curl https://api.pubsystem.com.br

# Containers
docker ps

# Nginx
sudo systemctl status nginx

# Portas abertas
sudo ss -tlnp | grep -E "80|3000"
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Backend
docker logs pub-backend -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Uso de Recursos

```bash
# CPU e Memória
htop

# Disco
df -h

# Containers
docker stats
```

---

## 🔐 Credenciais Rápidas

| Serviço | Credencial |
|---------|------------|
| **Admin** | admin@admin.com / admin123 |
| **Oracle SSH** | ubuntu@134.65.248.235 |
| **Neon DB** | neondb_owner / npg_AiCeM9ju7rLT |

---

## 📋 Checklist de Verificação

- [ ] `https://api.pubsystem.com.br` responde?
- [ ] `https://pubsystem.com.br` carrega?
- [ ] Login funciona?
- [ ] `docker ps` mostra container rodando?
- [ ] `sudo systemctl status nginx` está active?

---

*Guia criado em: 13 de Dezembro de 2025*
