# 🚀 Deploy Híbrido - Oracle E2.1.Micro + Vercel + Neon

Guia completo para deploy do Pub System em arquitetura híbrida **100% gratuita**.

---

## 📊 Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     VERCEL      │     │  ORACLE CLOUD   │     │      NEON       │
│   (Frontend)    │────▶│   E2.1.Micro    │────▶│   PostgreSQL    │
│    Next.js      │     │    (Backend)    │     │    (Database)   │
│     FREE        │     │      FREE       │     │      FREE       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      3001                    3000                   5432
```

| Componente | Serviço | Recursos | Custo |
|------------|---------|----------|-------|
| Frontend | Vercel | Ilimitado* | **Grátis** |
| Backend | Oracle E2.1.Micro | 1 vCPU, 1GB RAM | **Grátis** |
| Database | Neon | 500MB, 3GB transfer | **Grátis** |

*Vercel Free: 100GB bandwidth/mês

---

## 📋 Pré-requisitos

- Conta Oracle Cloud (Free Tier)
- Conta Vercel (GitHub conectado)
- Conta Neon (https://neon.tech)
- Domínio (opcional, mas recomendado)

---

## 🗄️ Etapa 1: Configurar Neon PostgreSQL

### 1.1 Criar Conta e Projeto

1. Acesse https://neon.tech e crie uma conta
2. Clique em **"New Project"**
3. Configure:
   - **Name:** `pub-system`
   - **Region:** `AWS São Paulo (sa-east-1)` ou mais próxima
   - **Postgres Version:** 15

### 1.2 Obter Connection String

1. No dashboard, clique em **"Connection Details"**
2. Selecione **"Connection string"**
3. Copie a URL (formato):
   ```
   postgresql://USER:PASSWORD@ep-xxx.sa-east-1.aws.neon.tech/pub_system?sslmode=require
   ```

### 1.3 Criar Tabelas (Primeira vez)

O backend criará as tabelas automaticamente via migrations. Mas você pode verificar conectando:

```bash
# Instalar psql (opcional)
psql "postgresql://USER:PASSWORD@ep-xxx.sa-east-1.aws.neon.tech/pub_system?sslmode=require"
```

---

## ☁️ Etapa 2: Configurar Oracle Cloud

### 2.1 Criar VM E2.1.Micro

1. Acesse https://cloud.oracle.com
2. Menu → Compute → Instances → **Create Instance**
3. Configure:
   - **Name:** `pub-system-backend`
   - **Image:** Ubuntu 22.04 Minimal
   - **Shape:** VM.Standard.E2.1.Micro (Always Free)
   - **Networking:** Create new VCN
   - **SSH Key:** Adicione sua chave pública

### 2.2 Configurar Firewall (Security List)

1. VCN → Security Lists → Default
2. Adicionar **Ingress Rules**:

| Source | Protocol | Port | Description |
|--------|----------|------|-------------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 3000 | Backend API |

### 2.3 Configurar Firewall do Ubuntu

```bash
# Conectar via SSH
ssh ubuntu@SEU_IP_PUBLICO

# Liberar portas no iptables
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# Salvar regras
sudo netfilter-persistent save
```

### 2.4 Instalar Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker ubuntu

# Reiniciar sessão
exit
# Reconectar via SSH
```

### 2.5 Clonar e Configurar Projeto

```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO/pub-system.git
cd pub-system

# Criar arquivo de configuração
cp env.micro.example .env.micro

# Editar configurações
nano .env.micro
```

Configurar `.env.micro`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.sa-east-1.aws.neon.tech/pub_system?sslmode=require
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
BACKEND_URL=http://SEU_IP_PUBLICO:3000
FRONTEND_URL=https://seu-app.vercel.app
ADMIN_EMAIL=admin@seudominio.com
ADMIN_SENHA=SenhaForte123!
```

### 2.6 Iniciar Backend

```bash
# Build e iniciar
docker compose -f docker-compose.micro.yml up -d --build

# Verificar logs
docker logs pub-backend -f

# Testar health check
curl http://localhost:3000/health
```

### 2.7 Configurar HTTPS com Caddy (Recomendado)

```bash
# Instalar Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configurar Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Conteúdo do Caddyfile:
```
api.seudominio.com {
    reverse_proxy localhost:3000
}
```

```bash
# Reiniciar Caddy
sudo systemctl restart caddy
```

---

## 🖥️ Etapa 3: Deploy Frontend no Vercel

### 3.1 Conectar Repositório

1. Acesse https://vercel.com
2. **"Add New Project"**
3. Importe o repositório do GitHub
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`

### 3.2 Configurar Variáveis de Ambiente

No Vercel, vá em **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.seudominio.com` |
| `API_URL_SERVER` | `https://api.seudominio.com` |

### 3.3 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Acesse a URL gerada: `https://seu-app.vercel.app`

### 3.4 Configurar Domínio Personalizado (Opcional)

1. **Settings → Domains**
2. Adicione seu domínio
3. Configure DNS no seu provedor:
   - **CNAME:** `www` → `cname.vercel-dns.com`
   - **A:** `@` → `76.76.21.21`

---

## ✅ Etapa 4: Verificação Final

### 4.1 Testar Backend

```bash
# Health check
curl https://api.seudominio.com/health
# Esperado: {"status":"ok","database":"up"}

# Login
curl -X POST https://api.seudominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seudominio.com","senha":"SenhaForte123!"}'
```

### 4.2 Testar Frontend

1. Acesse `https://seu-app.vercel.app`
2. Faça login com as credenciais admin
3. Verifique se os dados carregam corretamente

### 4.3 Checklist

- [ ] Backend respondendo em `/health`
- [ ] Login funcionando
- [ ] Frontend carregando
- [ ] Dados do banco aparecendo
- [ ] HTTPS funcionando

---

## 🔧 Manutenção

### Atualizar Backend

```bash
cd pub-system
git pull
docker compose -f docker-compose.micro.yml up -d --build
```

### Atualizar Frontend

O Vercel atualiza automaticamente quando você faz push no GitHub.

### Ver Logs

```bash
# Backend
docker logs pub-backend -f

# Caddy
sudo journalctl -u caddy -f
```

### Backup do Banco

O Neon faz backup automático. Para backup manual:

```bash
pg_dump "DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

## 📊 Monitoramento

### Uso de Recursos

```bash
# Ver uso de memória/CPU
docker stats

# Esperado: ~300-400MB RAM
```

### Métricas Neon

Acesse o dashboard do Neon para ver:
- Conexões ativas
- Queries por segundo
- Uso de storage

### Métricas Vercel

Acesse **Analytics** no dashboard do Vercel para ver:
- Requisições
- Tempo de resposta
- Erros

---

## 🚨 Troubleshooting

### Backend não inicia

```bash
# Ver logs detalhados
docker logs pub-backend

# Verificar variáveis de ambiente
docker exec pub-backend env | grep DATABASE
```

### Erro de conexão com Neon

1. Verifique se a connection string está correta
2. Confirme que `?sslmode=require` está no final
3. Teste a conexão diretamente:
   ```bash
   docker exec -it pub-backend sh
   wget -qO- http://localhost:3000/health
   ```

### Frontend não conecta ao Backend

1. Verifique CORS no backend
2. Confirme que `NEXT_PUBLIC_API_URL` está correto
3. Teste a API diretamente no navegador

### Memória insuficiente

```bash
# Verificar uso
free -h

# Criar swap (se necessário)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 💰 Custos

| Serviço | Limite Free | Custo se exceder |
|---------|-------------|------------------|
| Oracle E2.1.Micro | Sempre grátis | - |
| Vercel | 100GB/mês | $20/mês |
| Neon | 500MB + 3GB transfer | $19/mês |

**Para um pub típico (20-50 mesas), você provavelmente nunca excederá os limites gratuitos.**

---

## 🔗 Links Úteis

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Caddy Documentation](https://caddyserver.com/docs/)

---

*Última atualização: Dezembro 2025*
