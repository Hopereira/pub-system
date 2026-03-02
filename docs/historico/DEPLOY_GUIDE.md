# 🚀 Guia de Deploy - Pub System

## Arquitetura de Deploy Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS + CDN)                   │
│                   pubsystem.com.br                          │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│      VERCEL (Frontend)    │  │   ORACLE CLOUD (Backend)  │
│      Next.js 15           │  │   Docker + NestJS         │
│      www.pubsystem.com.br │  │   api.pubsystem.com.br    │
└───────────────────────────┘  └───────────────────────────┘
                                          │
                                          ▼
                               ┌───────────────────────────┐
                               │    NEON (PostgreSQL)      │
                               │    Free Tier              │
                               └───────────────────────────┘
                                          │
                                          ▼
                               ┌───────────────────────────┐
                               │  GOOGLE CLOUD STORAGE     │
                               │  Imagens e arquivos       │
                               └───────────────────────────┘
```

---

## 1. 🗄️ Deploy do Banco de Dados (Neon)

### 1.1 Criar Conta e Projeto

1. Acesse https://neon.tech
2. Crie uma conta (GitHub ou email)
3. Crie um novo projeto: `pub-system-prod`
4. Copie a connection string

### 1.2 Configurar Connection String

```env
# Formato da connection string do Neon
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/pub_system?sslmode=require

# Variáveis separadas
DB_HOST=ep-xxx.us-east-2.aws.neon.tech
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_DATABASE=pub_system
DB_SSL=true
```

### 1.3 Executar Migrations

```bash
# No ambiente local, apontando para Neon
cd backend
npm run typeorm:migration:run
```

---

## 2. 🖥️ Deploy do Backend (Oracle Cloud)

### 2.1 Criar VM

1. Acesse https://cloud.oracle.com
2. Crie uma conta (Free Tier)
3. Compute > Instances > Create Instance
   - Shape: VM.Standard.A1.Flex (ARM, 4 OCPU, 24GB RAM - FREE)
   - Image: Ubuntu 22.04
   - SSH Key: Adicione sua chave pública

### 2.2 Configurar Firewall

```bash
# No Oracle Cloud Console
# Networking > Virtual Cloud Networks > Security Lists
# Adicionar Ingress Rules:
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 3000 (API)

# Na VM
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

### 2.3 Instalar Docker

```bash
# Conectar via SSH
ssh -i ~/.ssh/oracle_key ubuntu@<IP_PUBLICO>

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout e login para aplicar grupo docker
exit
ssh -i ~/.ssh/oracle_key ubuntu@<IP_PUBLICO>
```

### 2.4 Clonar e Configurar Projeto

```bash
# Clonar repositório
git clone https://github.com/Hopereira/pub-system.git
cd pub-system

# Criar arquivo .env
cp .env.example .env
nano .env
```

### 2.5 Configurar .env de Produção

```env
# Ambiente
NODE_ENV=production

# Banco de Dados (Neon)
DB_HOST=ep-xxx.us-east-2.aws.neon.tech
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_DATABASE=pub_system
DB_SSL=true
DB_SYNC=false

# Segurança
JWT_SECRET=sua_chave_super_secreta_com_pelo_menos_32_caracteres
FRONTEND_URL=https://www.pubsystem.com.br

# Google Cloud Storage
GCS_BUCKET_NAME=pub-system-images
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json

# Admin (apenas primeiro deploy)
ADMIN_EMAIL=admin@pubsystem.com.br
ADMIN_SENHA=SenhaForte123!
```

### 2.6 Deploy com Docker

```bash
# Build e start
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar logs
docker-compose logs -f backend

# Verificar status
docker-compose ps
```

### 2.7 Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Configurar
sudo nano /etc/nginx/sites-available/api.pubsystem.com.br
```

```nginx
server {
    listen 80;
    server_name api.pubsystem.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/api.pubsystem.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2.8 Configurar SSL (Certbot)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado
sudo certbot --nginx -d api.pubsystem.com.br

# Renovação automática (já configurada pelo certbot)
sudo certbot renew --dry-run
```

---

## 3. 🌐 Deploy do Frontend (Vercel)

### 3.1 Conectar Repositório

1. Acesse https://vercel.com
2. Import Project > GitHub
3. Selecione `pub-system`
4. Configure:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3.2 Configurar Variáveis de Ambiente

No Vercel Dashboard > Settings > Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.pubsystem.com.br
API_URL_SERVER=https://api.pubsystem.com.br
```

### 3.3 Configurar Domínio

1. Vercel Dashboard > Settings > Domains
2. Adicionar: `www.pubsystem.com.br`
3. Configurar DNS no Cloudflare:
   - CNAME: `www` → `cname.vercel-dns.com`

### 3.4 Deploy Automático

Cada push para `main` dispara deploy automático.

```bash
# Deploy manual (se necessário)
cd frontend
npx vercel --prod
```

---

## 4. 📁 Configurar Google Cloud Storage

### 4.1 Criar Bucket

1. Acesse https://console.cloud.google.com
2. Storage > Create Bucket
3. Nome: `pub-system-images`
4. Região: `us-east1` (ou mais próxima)
5. Classe: Standard

### 4.2 Criar Service Account

1. IAM & Admin > Service Accounts
2. Create Service Account
3. Nome: `pub-system-storage`
4. Role: `Storage Object Admin`
5. Create Key (JSON)
6. Download e renomeie para `gcs-credentials.json`

### 4.3 Configurar CORS

```bash
# Criar arquivo cors.json
cat > cors.json << EOF
[
  {
    "origin": ["https://www.pubsystem.com.br", "https://api.pubsystem.com.br"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Aplicar CORS
gsutil cors set cors.json gs://pub-system-images
```

### 4.4 Enviar Credenciais para Servidor

```bash
# Do seu computador local
scp -i ~/.ssh/oracle_key gcs-credentials.json ubuntu@<IP>:~/pub-system/backend/
```

---

## 5. 🔧 Checklist Pré-Deploy

### Backend
- [ ] `.env` configurado com valores de produção
- [ ] `JWT_SECRET` com pelo menos 32 caracteres
- [ ] `NODE_ENV=production`
- [ ] `DB_SYNC=false` (nunca true em produção!)
- [ ] Migrations executadas
- [ ] `gcs-credentials.json` presente
- [ ] Firewall configurado (portas 80, 443, 3000)
- [ ] SSL/HTTPS configurado

### Frontend
- [ ] Variáveis de ambiente no Vercel
- [ ] `NEXT_PUBLIC_API_URL` apontando para API de produção
- [ ] Domínio configurado
- [ ] Build passando sem erros

### Banco de Dados
- [ ] Connection string correta
- [ ] SSL habilitado
- [ ] Backup automático configurado (Neon faz automaticamente)

### DNS
- [ ] `api.pubsystem.com.br` → IP do Oracle Cloud
- [ ] `www.pubsystem.com.br` → Vercel
- [ ] SSL/TLS configurado no Cloudflare

---

## 6. 🔄 Atualizações

### Atualizar Backend

```bash
ssh -i ~/.ssh/oracle_key ubuntu@<IP>
cd pub-system
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Atualizar Frontend

Push para `main` dispara deploy automático no Vercel.

### Executar Migrations

```bash
# Na VM
docker-compose exec backend npm run typeorm:migration:run
```

---

## 7. 📊 Monitoramento

### Logs do Backend

```bash
# Logs em tempo real
docker-compose logs -f backend

# Últimas 100 linhas
docker-compose logs --tail=100 backend
```

### Health Check

```bash
# Verificar API
curl https://api.pubsystem.com.br/health

# Resposta esperada
{"status":"ok","timestamp":"...","database":"connected"}
```

### Uso de Recursos

```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h
```

---

## 8. 🆘 Troubleshooting

### Backend não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar variáveis de ambiente
docker-compose exec backend env

# Reiniciar container
docker-compose restart backend
```

### Erro de conexão com banco

```bash
# Testar conexão
docker-compose exec backend npm run typeorm:query "SELECT 1"

# Verificar SSL
# Certifique-se que DB_SSL=true
```

### Frontend não conecta na API

1. Verificar CORS no backend
2. Verificar variáveis de ambiente no Vercel
3. Verificar se API está acessível: `curl https://api.pubsystem.com.br/health`

### Certificado SSL expirado

```bash
# Renovar manualmente
sudo certbot renew

# Verificar renovação automática
sudo systemctl status certbot.timer
```

---

## 9. 💰 Custos Estimados

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| Oracle Cloud | Free Tier | R$ 0 |
| Vercel | Hobby | R$ 0 |
| Neon | Free Tier | R$ 0 |
| Google Cloud Storage | ~1GB | ~R$ 2 |
| Cloudflare | Free | R$ 0 |
| **TOTAL** | | **~R$ 2/mês** |

---

*Guia atualizado em Dezembro 2025*
