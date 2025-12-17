# 🚀 Guia de Configuração e Deploy - Pub System

**Data:** 17 de Dezembro de 2025  
**Versão:** 1.0  
**Autor:** Cascade AI

---

## 📋 Sumário

1. [Setup Desenvolvimento](#1-setup-desenvolvimento)
2. [Setup Produção](#2-setup-produção)
3. [Configuração de Serviços Externos](#3-configuração-de-serviços-externos)
4. [Variáveis de Ambiente Críticas](#4-variáveis-de-ambiente-críticas)
5. [Checklist Pré-Deploy](#5-checklist-pré-deploy)

---

## 1. 🛠️ Setup Desenvolvimento

### 1.1 Pré-requisitos

**Software Necessário:**
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **VS Code** (recomendado) - [Download](https://code.visualstudio.com/)

**Extensões VS Code Recomendadas:**
- ESLint
- Prettier
- Docker
- PostgreSQL
- Thunder Client (teste de API)

### 1.2 Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pub-system.git
cd pub-system
```

### 1.3 Configuração Inicial

#### Passo 1: Criar arquivo .env

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

#### Passo 2: Editar .env (Desenvolvimento)

```env
# ============================================
# BANCO DE DADOS
# ============================================
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_DATABASE=pub_system_db

POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=pub_system_db

# ============================================
# PGADMIN
# ============================================
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin

# ============================================
# SEGURANÇA
# ============================================
JWT_SECRET=dev-secret-key-change-in-production

# ============================================
# ADMIN INICIAL
# ============================================
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

# ============================================
# GOOGLE CLOUD STORAGE
# ============================================
GCS_BUCKET_NAME=pub-system-dev
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json

# ============================================
# URLS
# ============================================
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL_SERVER=http://backend:3000
```

#### Passo 3: Configurar Google Cloud Storage (Opcional para Dev)

```bash
# 1. Criar projeto no Google Cloud Console
# 2. Ativar Cloud Storage API
# 3. Criar bucket
# 4. Criar Service Account
# 5. Baixar JSON de credenciais

# Copiar credenciais para o projeto
cp ~/Downloads/gcs-credentials.json backend/gcs-credentials.json
```

**⚠️ IMPORTANTE:** Adicione `gcs-credentials.json` ao `.gitignore`

### 1.4 Iniciar Containers Docker

#### Opção A: Script Automatizado (Recomendado)

```powershell
# Windows PowerShell
.\docker-start.ps1
```

```bash
# Linux/Mac
./docker-start.sh
```

#### Opção B: Docker Compose Manual

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
```

### 1.5 Executar Migrations

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Executar migrations
npm run typeorm:migration:run

# Executar seeder (dados iniciais)
npm run seed

# Sair do container
exit
```

### 1.6 Verificar Instalação

**Acessos:**
- 🌐 **Frontend:** http://localhost:3001
- 🔌 **Backend API:** http://localhost:3000
- 📊 **Swagger:** http://localhost:3000/api
- 🗄️ **PgAdmin:** http://localhost:8080

**Credenciais Padrão:**
- **Login:** admin@admin.com
- **Senha:** admin123

### 1.7 Comandos Úteis

```bash
# Parar containers
docker-compose down

# Parar e remover volumes (limpa banco)
docker-compose down -v

# Rebuild containers (após mudanças em Dockerfile)
docker-compose up -d --build

# Ver status dos containers
docker-compose ps

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no container do frontend
docker-compose exec frontend sh

# Acessar PostgreSQL diretamente
docker-compose exec db psql -U postgres -d pub_system_db

# Ver logs de erro
docker-compose logs --tail=100 backend
```

### 1.8 Desenvolvimento Local (Sem Docker)

#### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env local
cp .env.example .env
# Editar: DB_HOST=localhost

# Executar migrations
npm run typeorm:migration:run

# Executar seeder
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev

# Iniciar em modo debug
npm run start:debug
```

#### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Iniciar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar versão de produção
npm run start
```

---

## 2. 🏭 Setup Produção

### 2.1 Arquitetura de Produção Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                        │
│                  (Nginx / CloudFlare)                   │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│   FRONTEND     │                    │    BACKEND      │
│   (Vercel)     │◄───────────────────┤  (Oracle Cloud) │
│   Next.js 15   │      WebSocket     │    NestJS 10    │
└────────────────┘                    └─────────┬───────┘
                                               │
                                      ┌────────▼────────┐
                                      │    DATABASE     │
                                      │  (Neon/Oracle)  │
                                      │  PostgreSQL 15  │
                                      └─────────────────┘
                                               │
                                      ┌────────▼────────┐
                                      │    STORAGE      │
                                      │  (Google Cloud) │
                                      │      GCS        │
                                      └─────────────────┘
```

### 2.2 Deploy Backend (Oracle Cloud / VPS)

#### Passo 1: Preparar Servidor

```bash
# Conectar via SSH
ssh usuario@seu-servidor.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (Process Manager)
sudo npm install -g pm2

# Instalar PostgreSQL (se não usar Neon)
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### Passo 2: Clonar e Configurar

```bash
# Criar diretório
sudo mkdir -p /var/www/pub-system
sudo chown $USER:$USER /var/www/pub-system

# Clonar repositório
cd /var/www/pub-system
git clone https://github.com/seu-usuario/pub-system.git .

# Instalar dependências do backend
cd backend
npm install --production

# Criar .env de produção
nano .env
```

#### Passo 3: Configurar .env de Produção

```env
# ============================================
# BANCO DE DADOS (Neon ou PostgreSQL local)
# ============================================
DB_HOST=seu-db.neon.tech
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=senha_forte_aqui
DB_DATABASE=pub_system_prod

# ============================================
# SEGURANÇA
# ============================================
# CRÍTICO: Gerar com: openssl rand -base64 32
JWT_SECRET=sua_chave_jwt_super_secreta_e_aleatoria_aqui

# ============================================
# ADMIN INICIAL
# ============================================
ADMIN_EMAIL=seu-email@empresa.com
ADMIN_SENHA=senha_forte_admin

# ============================================
# GOOGLE CLOUD STORAGE
# ============================================
GCS_BUCKET_NAME=pub-system-production
GOOGLE_APPLICATION_CREDENTIALS=/var/www/pub-system/backend/gcs-credentials.json

# ============================================
# URLS
# ============================================
BACKEND_URL=https://api.pubsystem.com.br
FRONTEND_URL=https://pubsystem.com.br
```

#### Passo 4: Executar Migrations

```bash
# Build da aplicação
npm run build

# Executar migrations
npm run typeorm:migration:run

# Executar seeder (apenas primeira vez)
npm run seed
```

#### Passo 5: Configurar PM2

```bash
# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pub-system-backend',
    script: 'dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
}
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Executar o comando que aparecer

# Ver status
pm2 status

# Ver logs
pm2 logs pub-system-backend

# Monitorar
pm2 monit
```

#### Passo 6: Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/pub-system-backend
```

```nginx
server {
    listen 80;
    server_name api.pubsystem.com.br;

    # Logs
    access_log /var/log/nginx/pub-system-backend-access.log;
    error_log /var/log/nginx/pub-system-backend-error.log;

    # Proxy para backend
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Limites
    client_max_body_size 10M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/pub-system-backend /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### Passo 7: Configurar SSL (HTTPS)

```bash
# Obter certificado SSL
sudo certbot --nginx -d api.pubsystem.com.br

# Renovação automática (já configurado pelo certbot)
sudo certbot renew --dry-run
```

### 2.3 Deploy Frontend (Vercel)

#### Passo 1: Preparar Projeto

```bash
# Criar arquivo vercel.json na raiz do frontend
cd frontend
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["gru1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.pubsystem.com.br",
    "API_URL_SERVER": "https://api.pubsystem.com.br"
  }
}
EOF
```

#### Passo 2: Deploy via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar domínio customizado
vercel domains add pubsystem.com.br
```

#### Passo 3: Configurar Variáveis de Ambiente na Vercel

**Via Dashboard:**
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto
3. Settings → Environment Variables
4. Adicionar:
   - `NEXT_PUBLIC_API_URL` = `https://api.pubsystem.com.br`
   - `API_URL_SERVER` = `https://api.pubsystem.com.br`

### 2.4 Deploy Database (Neon)

#### Opção A: Neon (Recomendado)

```bash
# 1. Criar conta em https://neon.tech
# 2. Criar novo projeto
# 3. Copiar connection string
# 4. Usar no .env do backend
```

**Connection String:**
```
postgresql://usuario:senha@ep-xxx.neon.tech/pub_system_prod?sslmode=require
```

#### Opção B: PostgreSQL no Servidor

```bash
# Criar banco
sudo -u postgres psql
CREATE DATABASE pub_system_prod;
CREATE USER pub_user WITH ENCRYPTED PASSWORD 'senha_forte';
GRANT ALL PRIVILEGES ON DATABASE pub_system_prod TO pub_user;
\q

# Configurar acesso remoto (se necessário)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Descomentar: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Adicionar: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

---

## 3. 🔧 Configuração de Serviços Externos

### 3.1 Google Cloud Storage (GCS)

#### Passo 1: Criar Projeto no Google Cloud

1. Acesse https://console.cloud.google.com
2. Criar novo projeto: "Pub System"
3. Ativar faturamento (necessário para GCS)

#### Passo 2: Ativar Cloud Storage API

```bash
# Via gcloud CLI
gcloud services enable storage-api.googleapis.com

# Ou via Console:
# APIs & Services → Library → Cloud Storage API → Enable
```

#### Passo 3: Criar Bucket

```bash
# Via gcloud CLI
gcloud storage buckets create gs://pub-system-production \
  --location=southamerica-east1 \
  --uniform-bucket-level-access

# Ou via Console:
# Cloud Storage → Buckets → Create Bucket
```

**Configurações Recomendadas:**
- **Nome:** `pub-system-production`
- **Location:** `southamerica-east1` (São Paulo)
- **Storage Class:** Standard
- **Access Control:** Uniform
- **Public Access:** Prevent public access (configurar depois)

#### Passo 4: Configurar Permissões Públicas

```bash
# Tornar bucket público para leitura
gsutil iam ch allUsers:objectViewer gs://pub-system-production

# Ou via Console:
# Bucket → Permissions → Add Principal
# New principals: allUsers
# Role: Storage Object Viewer
```

#### Passo 5: Criar Service Account

```bash
# Via gcloud CLI
gcloud iam service-accounts create pub-system-storage \
  --display-name="Pub System Storage"

# Dar permissões ao service account
gcloud projects add-iam-policy-binding seu-projeto-id \
  --member="serviceAccount:pub-system-storage@seu-projeto-id.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Criar chave JSON
gcloud iam service-accounts keys create gcs-credentials.json \
  --iam-account=pub-system-storage@seu-projeto-id.iam.gserviceaccount.com
```

**Ou via Console:**
1. IAM & Admin → Service Accounts
2. Create Service Account
3. Nome: "pub-system-storage"
4. Grant role: "Storage Object Admin"
5. Create Key → JSON
6. Download JSON

#### Passo 6: Configurar no Projeto

```bash
# Copiar credenciais para o backend
cp ~/Downloads/gcs-credentials.json backend/gcs-credentials.json

# Adicionar ao .gitignore
echo "gcs-credentials.json" >> .gitignore

# Configurar no .env
GCS_BUCKET_NAME=pub-system-production
GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/gcs-credentials.json
```

#### Passo 7: Testar Upload

```bash
# Entrar no backend
cd backend

# Testar upload via curl
curl -X POST http://localhost:3000/produtos \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "nome=Produto Teste" \
  -F "preco=10.00" \
  -F "imagem=@/caminho/para/imagem.jpg"
```

### 3.2 Email (SMTP) - Opcional

#### Opção A: Gmail SMTP

```env
# .env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app
MAIL_FROM=noreply@pubsystem.com.br
```

**Configurar Senha de App:**
1. Google Account → Security
2. 2-Step Verification → App passwords
3. Generate password
4. Usar no .env

#### Opção B: SendGrid

```env
# .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
MAIL_FROM=noreply@pubsystem.com.br
```

#### Opção C: AWS SES

```env
# .env
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=AKIAXXXXXXXX
AWS_SES_SECRET_KEY=xxxxxxxxxx
MAIL_FROM=noreply@pubsystem.com.br
```

### 3.3 Monitoramento (Opcional)

#### Sentry (Error Tracking)

```bash
# Instalar
npm install @sentry/node @sentry/tracing

# Configurar no main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

```env
# .env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

#### New Relic (APM)

```bash
# Instalar
npm install newrelic

# Configurar newrelic.js
```

---

## 4. 🔐 Variáveis de Ambiente Críticas

### 4.1 Variáveis Obrigatórias

| Variável | Descrição | Exemplo | Crítica |
|----------|-----------|---------|---------|
| `DB_HOST` | Host do PostgreSQL | `db` / `neon.tech` | ✅ |
| `DB_PORT` | Porta do PostgreSQL | `5432` | ✅ |
| `DB_USER` | Usuário do banco | `postgres` | ✅ |
| `DB_PASSWORD` | Senha do banco | `senha_forte` | ✅ |
| `DB_DATABASE` | Nome do banco | `pub_system_db` | ✅ |
| `JWT_SECRET` | Chave JWT | `openssl rand -base64 32` | ✅ |
| `GCS_BUCKET_NAME` | Nome do bucket GCS | `pub-system-prod` | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho credenciais GCS | `/path/to/gcs.json` | ✅ |
| `BACKEND_URL` | URL do backend | `https://api.pubsystem.com.br` | ✅ |
| `FRONTEND_URL` | URL do frontend | `https://pubsystem.com.br` | ✅ |

### 4.2 Variáveis Opcionais

| Variável | Descrição | Padrão | Necessária |
|----------|-----------|--------|------------|
| `PORT` | Porta do backend | `3000` | ⚠️ |
| `NODE_ENV` | Ambiente | `development` | ⚠️ |
| `ADMIN_EMAIL` | Email admin inicial | - | ⚠️ |
| `ADMIN_SENHA` | Senha admin inicial | - | ⚠️ |
| `SENTRY_DSN` | Sentry error tracking | - | ❌ |
| `MAIL_HOST` | SMTP host | - | ❌ |
| `MAIL_PORT` | SMTP port | - | ❌ |
| `MAIL_USER` | SMTP user | - | ❌ |
| `MAIL_PASSWORD` | SMTP password | - | ❌ |

### 4.3 Gerando Valores Seguros

#### JWT_SECRET

```bash
# Gerar chave aleatória forte
openssl rand -base64 32

# Ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Resultado exemplo:
# 8xK9mP2nQ5rT7vW0yZ3aC6dF9hJ1kL4mN7pR0sU3vX6=
```

#### Senhas de Banco

```bash
# Gerar senha forte
openssl rand -base64 24

# Ou
pwgen -s 32 1
```

### 4.4 Validação de Variáveis

**Backend valida automaticamente via Joi:**

```typescript
// backend/src/app.module.ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    GCS_BUCKET_NAME: Joi.string().required(),
    // ...
  }),
}),
```

**Se alguma variável crítica estiver faltando, o backend não inicia.**

---

## 5. ✅ Checklist Pré-Deploy

### 5.1 Segurança 🔒

- [ ] **JWT_SECRET** gerado com `openssl rand -base64 32`
- [ ] **Senhas de banco** fortes e únicas
- [ ] **gcs-credentials.json** não commitado no Git
- [ ] **.env** adicionado ao `.gitignore`
- [ ] **CORS** configurado apenas para domínios permitidos
- [ ] **Rate Limiting** ativado (ThrottlerModule)
- [ ] **Helmet** ativado para headers de segurança
- [ ] **SSL/HTTPS** configurado (Certbot)
- [ ] **Firewall** configurado no servidor
- [ ] **SSH** com chave pública (desabilitar senha)
- [ ] **Portas** apenas necessárias abertas (80, 443, 22)
- [ ] **Backup** de credenciais em local seguro

### 5.2 Banco de Dados 🗄️

- [ ] **Migrations** executadas com sucesso
- [ ] **Seeder** executado (apenas primeira vez)
- [ ] **Backup** configurado (diário)
- [ ] **Índices** criados para queries frequentes
- [ ] **Connection pool** configurado adequadamente
- [ ] **Timezone** configurado (UTC)
- [ ] **Logs** de queries lentas ativados
- [ ] **Retenção de logs** configurada (30 dias)

### 5.3 Backend 🚀

- [ ] **Build** executado sem erros (`npm run build`)
- [ ] **Testes** passando (`npm run test`)
- [ ] **Linter** sem erros (`npm run lint`)
- [ ] **PM2** configurado e rodando
- [ ] **Logs** sendo salvos corretamente
- [ ] **Health check** endpoint funcionando (`/health`)
- [ ] **Swagger** desabilitado em produção (ou protegido)
- [ ] **CORS** configurado para frontend de produção
- [ ] **WebSocket** funcionando corretamente
- [ ] **Upload de imagens** testado (GCS)
- [ ] **Variáveis de ambiente** todas configuradas
- [ ] **Nginx** configurado como reverse proxy
- [ ] **SSL** ativo e renovação automática

### 5.4 Frontend 🌐

- [ ] **Build** executado sem erros (`npm run build`)
- [ ] **Variáveis de ambiente** configuradas na Vercel
- [ ] **Domínio customizado** configurado
- [ ] **SSL** ativo (automático na Vercel)
- [ ] **API_URL** apontando para backend de produção
- [ ] **WebSocket** conectando corretamente
- [ ] **Imagens** carregando do GCS
- [ ] **Rotas** todas funcionando
- [ ] **Autenticação** funcionando
- [ ] **Responsividade** testada (mobile/tablet/desktop)
- [ ] **Performance** testada (Lighthouse > 90)

### 5.5 Testes Funcionais 🧪

- [ ] **Login** funcionando
- [ ] **Criar funcionário** funcionando
- [ ] **Criar produto** com imagem funcionando
- [ ] **Criar mesa** funcionando
- [ ] **Abrir comanda** funcionando
- [ ] **Criar pedido** funcionando
- [ ] **Atualizar status** de pedido funcionando
- [ ] **WebSocket** notificando em tempo real
- [ ] **Fechar comanda** funcionando
- [ ] **Abrir caixa** funcionando
- [ ] **Fechar caixa** funcionando
- [ ] **Relatórios** carregando
- [ ] **QR Code** funcionando para clientes
- [ ] **Check-in/out** de funcionários funcionando

### 5.6 Monitoramento 📊

- [ ] **PM2** monitorando processos
- [ ] **Logs** sendo coletados
- [ ] **Sentry** configurado (opcional)
- [ ] **Uptime monitoring** configurado (UptimeRobot)
- [ ] **Alertas** configurados (email/SMS)
- [ ] **Backup automático** configurado
- [ ] **Métricas** de performance coletadas

### 5.7 Documentação 📚

- [ ] **README** atualizado
- [ ] **API Documentation** atualizada
- [ ] **Variáveis de ambiente** documentadas
- [ ] **Processo de deploy** documentado
- [ ] **Troubleshooting** documentado
- [ ] **Contatos** de emergência documentados

### 5.8 Rollback Plan 🔄

- [ ] **Backup** do banco antes do deploy
- [ ] **Tag Git** criada para versão atual
- [ ] **Plano de rollback** documentado
- [ ] **Tempo estimado** de rollback conhecido
- [ ] **Responsável** pelo rollback definido

---

## 6. 🆘 Troubleshooting

### 6.1 Problemas Comuns

#### Backend não inicia

```bash
# Verificar logs
pm2 logs pub-system-backend

# Verificar variáveis de ambiente
pm2 env 0

# Verificar conexão com banco
docker-compose exec backend npm run typeorm:query "SELECT 1"

# Verificar portas
netstat -tulpn | grep 3000
```

#### Frontend não conecta ao backend

```bash
# Verificar variáveis de ambiente
vercel env ls

# Verificar CORS no backend
# backend/src/main.ts
app.enableCors({
  origin: ['https://pubsystem.com.br'],
  credentials: true,
});

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

#### Upload de imagens não funciona

```bash
# Verificar credenciais GCS
cat backend/gcs-credentials.json

# Verificar permissões do bucket
gsutil iam get gs://pub-system-production

# Testar upload manual
gsutil cp test.jpg gs://pub-system-production/test.jpg
```

#### WebSocket não conecta

```bash
# Verificar configuração Nginx
# Adicionar em /etc/nginx/sites-available/pub-system-backend:
location /socket.io/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6.2 Comandos de Diagnóstico

```bash
# Status geral
pm2 status
docker-compose ps
sudo systemctl status nginx
sudo systemctl status postgresql

# Logs
pm2 logs --lines 100
docker-compose logs --tail=100
sudo tail -f /var/log/nginx/error.log

# Recursos
pm2 monit
htop
df -h
free -m

# Rede
netstat -tulpn
ss -tulpn
curl -I https://api.pubsystem.com.br/health

# Banco de dados
docker-compose exec db psql -U postgres -d pub_system_db -c "\dt"
docker-compose exec db psql -U postgres -d pub_system_db -c "SELECT COUNT(*) FROM funcionarios"
```

---

## 7. 📞 Suporte

**Em caso de problemas:**

1. 🔍 Verificar logs: `pm2 logs`
2. 📚 Consultar documentação
3. 🐛 Abrir issue no GitHub
4. 💬 Contatar suporte: pereira_hebert@msn.com
5. 📱 WhatsApp: (24) 99828-5751

---

*Documento gerado em 17/12/2025*
