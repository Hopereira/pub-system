# 🚀 Guia Completo: Deploy Híbrido do Pub System

> **Arquitetura**: Oracle Cloud (Backend) + Vercel (Frontend) + Neon (PostgreSQL)
> 
> **Custo Total**: $0 (100% gratuito)
> 
> **Data**: Dezembro 2025

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Etapa 1: Configurar Neon (PostgreSQL)](#3-etapa-1-configurar-neon-postgresql)
4. [Etapa 2: Configurar Oracle Cloud (Backend)](#4-etapa-2-configurar-oracle-cloud-backend)
5. [Etapa 3: Configurar Vercel (Frontend)](#5-etapa-3-configurar-vercel-frontend)
6. [Etapa 4: Testar Sistema Completo](#6-etapa-4-testar-sistema-completo)
7. [Troubleshooting](#7-troubleshooting)
8. [Manutenção](#8-manutenção)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA HÍBRIDA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │     VERCEL      │     │  ORACLE CLOUD   │     │      NEON       │   │
│  │   (Frontend)    │────▶│   E2.1.Micro    │────▶│   PostgreSQL    │   │
│  │    Next.js      │     │    (Backend)    │     │    (Database)   │   │
│  │     GRÁTIS      │     │     GRÁTIS      │     │     GRÁTIS      │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│         │                       │                       │               │
│         │                       │                       │               │
│    CDN Global              1 vCPU                  0.5 GB              │
│    Edge Network            1 GB RAM               Serverless           │
│    Auto-scaling            512 MB Docker          Auto-scaling         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Por que essa arquitetura?

| Componente | Problema Anterior | Solução Híbrida |
|------------|-------------------|-----------------|
| **Frontend** | LCP ~87s no E2.1.Micro | LCP < 2s no Vercel CDN |
| **Backend** | Competia por RAM | 512MB dedicados |
| **Database** | Consumia 300MB RAM | Serverless externo |

### Limites Gratuitos

| Serviço | Limite Gratuito |
|---------|-----------------|
| **Oracle Cloud** | 2 VMs E2.1.Micro para sempre |
| **Vercel** | 100GB bandwidth/mês, builds ilimitados |
| **Neon** | 0.5GB storage, 190 compute hours/mês |

---

## 2. Pré-requisitos

### Contas Necessárias
- [ ] Conta GitHub (para repositório)
- [ ] Conta Oracle Cloud (já configurada)
- [ ] Conta Neon (criar em https://neon.tech)
- [ ] Conta Vercel (criar em https://vercel.com)

### Ferramentas Locais
- [ ] Git instalado
- [ ] SSH client (PowerShell ou terminal)
- [ ] Chave SSH para Oracle Cloud

### Informações Necessárias
- [ ] IP público da Oracle: `134.65.248.235`
- [ ] Caminho da chave SSH: `D:\Ficando_rico\Projetos\private Key\ssh-key-2025-12-11.key`
- [ ] Repositório GitHub: `Hopereira/pub-system`

---

## 3. Etapa 1: Configurar Neon (PostgreSQL)

### 3.1 Criar Conta no Neon

1. Acesse **https://neon.tech**
2. Clique em **"Sign Up"** ou **"Get Started Free"**
3. Faça login com **GitHub** (recomendado)

### 3.2 Criar Projeto

1. Clique em **"New Project"**
2. Configure:
   - **Project name**: `pub-system`
   - **Database name**: `neondb` (padrão)
   - **Region**: `sa-east-1` (São Paulo) - **IMPORTANTE para latência!**
3. Clique **"Create Project"**

### 3.3 Obter Connection String

1. No dashboard, clique em **"Connect"** (botão azul)
2. Mantenha **"Connection pooling"** ativado (toggle verde)
3. Clique em **"Show password"** para revelar a senha
4. Copie a connection string completa:

```
postgresql://neondb_owner:SENHA@ep-xxx-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3.4 Extrair Credenciais

Da connection string, extraia:

| Variável | Valor |
|----------|-------|
| `DB_HOST` | `ep-xxx-xxx-pooler.sa-east-1.aws.neon.tech` |
| `DB_PORT` | `5432` |
| `DB_USER` | `neondb_owner` |
| `DB_PASSWORD` | `sua_senha_aqui` |
| `DB_DATABASE` | `neondb` |
| `DB_SSL` | `true` |

**⚠️ GUARDE ESSAS INFORMAÇÕES! Serão usadas nos próximos passos.**

---

## 4. Etapa 2: Configurar Oracle Cloud (Backend)

### 4.1 Conectar via SSH

No PowerShell (Windows):

```powershell
ssh -i "D:\Ficando_rico\Projetos\private Key\ssh-key-2025-12-11.key" ubuntu@134.65.248.235
```

### 4.2 Instalar Docker e Docker Compose

Se ainda não instalado:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version

# IMPORTANTE: Saia e entre novamente para aplicar permissões
exit
```

Reconecte via SSH após sair.

### 4.3 Clonar ou Atualizar Repositório

```bash
# Se ainda não clonou
cd ~
git clone https://github.com/Hopereira/pub-system.git
cd pub-system

# Se já existe, atualize
cd ~/pub-system
git pull origin main
```

### 4.4 Configurar Variáveis de Ambiente

```bash
# Remover .env antigo (se existir)
rm -f .env

# Criar novo .env
nano .env
```

Cole o seguinte conteúdo (substitua os valores):

```env
# ============================================
# BANCO DE DADOS - NEON
# ============================================
DB_HOST=ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=SUA_SENHA_DO_NEON_AQUI
DB_DATABASE=neondb
DB_SSL=true

# ============================================
# URLs
# ============================================
BACKEND_URL=http://134.65.248.235:3000
FRONTEND_URL=https://pub-system.vercel.app

# ============================================
# JWT SECRET
# ============================================
JWT_SECRET=pub_system_jwt_secret_2024_oracle_hybrid

# ============================================
# ADMIN INICIAL
# ============================================
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

# ============================================
# GOOGLE CLOUD STORAGE (opcional)
# ============================================
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=

# ============================================
# CORS (domínios permitidos)
# ============================================
CORS_ORIGINS=https://pub-system.vercel.app,http://localhost:3001
```

Salvar: **Ctrl+O** → Enter → **Ctrl+X**

### 4.5 Parar Containers Antigos

```bash
# Parar todos os containers
docker compose down

# Limpar imagens e cache (liberar espaço)
docker system prune -af
```

### 4.6 Subir Backend com Docker Compose Micro

```bash
# Build e start do backend otimizado
docker compose -f docker-compose.micro.yml up -d --build
```

### 4.7 Verificar Status

```bash
# Ver containers rodando
docker ps

# Ver logs do backend
docker logs pub_backend -f
```

**Saída esperada:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [Bootstrap] 🚀 Backend rodando em http://0.0.0.0:3000
[Nest] LOG [Database] ✅ Conectado ao PostgreSQL (Neon)
```

### 4.8 Testar Backend

```bash
# Testar health check
curl http://localhost:3000/health

# Testar de fora (no seu PC)
curl http://134.65.248.235:3000/health
```

### 4.9 Configurar Firewall Oracle Cloud

Se o backend não responder externamente:

1. Acesse **Oracle Cloud Console**
2. Vá em **Networking** → **Virtual Cloud Networks**
3. Clique na sua VCN → **Security Lists** → **Default Security List**
4. **Add Ingress Rules**:

| Source CIDR | Protocol | Destination Port |
|-------------|----------|------------------|
| 0.0.0.0/0 | TCP | 3000 |

5. No servidor, libere também no iptables:

```bash
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

## 5. Etapa 3: Configurar Vercel (Frontend)

### 5.1 Criar Conta no Vercel

1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

### 5.2 Importar Projeto

1. No dashboard, clique em **"Add New..."** → **"Project"**
2. Encontre o repositório **pub-system** e clique **"Import"**

### 5.3 Configurar Build

Na tela de configuração:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### 5.4 Configurar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `http://134.65.248.235:3000` |
| `NEXT_PUBLIC_WS_URL` | `ws://134.65.248.235:3000` |

### 5.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Após sucesso, você receberá uma URL como: `https://pub-system.vercel.app`

### 5.6 Atualizar CORS no Backend

Volte para a Oracle e atualize o `.env`:

```bash
ssh -i "D:\Ficando_rico\Projetos\private Key\ssh-key-2025-12-11.key" ubuntu@134.65.248.235
cd ~/pub-system
nano .env
```

Atualize a linha `CORS_ORIGINS` com a URL real do Vercel:

```env
CORS_ORIGINS=https://pub-system.vercel.app,https://pub-system-xxx.vercel.app
```

Reinicie o backend:

```bash
docker compose -f docker-compose.micro.yml restart
```

---

## 6. Etapa 4: Testar Sistema Completo

### 6.1 Checklist de Testes

| Teste | URL | Esperado |
|-------|-----|----------|
| Backend Health | `http://134.65.248.235:3000/health` | `{"status":"ok"}` |
| Backend Swagger | `http://134.65.248.235:3000/api` | Documentação Swagger |
| Frontend | `https://pub-system.vercel.app` | Tela de login |
| Login | Usar admin@admin.com / admin123 | Dashboard |
| WebSocket | Abrir painel de pedidos | Conexão estabelecida |

### 6.2 Testar Performance

No navegador, abra DevTools (F12) → Network → Recarregue a página.

**Métricas esperadas:**
- **LCP**: < 2.5s (antes era ~87s)
- **TTFB**: < 200ms
- **First Contentful Paint**: < 1s

### 6.3 Verificar Logs

```bash
# Backend
docker logs pub_backend --tail 100

# Ver erros específicos
docker logs pub_backend 2>&1 | grep -i error
```

---

## 7. Troubleshooting

### Problema: Backend não conecta ao Neon

**Sintoma:** Erro `ECONNREFUSED` ou `connection refused`

**Solução:**
1. Verifique se `DB_SSL=true` está no `.env`
2. Confirme que a senha do Neon está correta
3. Teste conexão direta:

```bash
# Instalar psql
sudo apt install postgresql-client -y

# Testar conexão
psql "postgresql://neondb_owner:SENHA@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Problema: Frontend não conecta ao Backend

**Sintoma:** Erro `net::ERR_CONNECTION_REFUSED` no console

**Soluções:**
1. Verifique se a porta 3000 está aberta no firewall Oracle
2. Confirme que `NEXT_PUBLIC_API_URL` está correto no Vercel
3. Verifique CORS no backend

### Problema: WebSocket não conecta

**Sintoma:** Erro `WebSocket connection failed`

**Soluções:**
1. Verifique `NEXT_PUBLIC_WS_URL` no Vercel
2. Confirme que o backend está rodando
3. Verifique se não há proxy bloqueando WebSocket

### Problema: Docker sem espaço

**Sintoma:** `no space left on device`

**Solução:**
```bash
# Limpar tudo
docker system prune -af
docker volume prune -f

# Verificar espaço
df -h
```

### Problema: Container reiniciando

**Sintoma:** Container em loop de restart

**Solução:**
```bash
# Ver logs de erro
docker logs pub_backend --tail 200

# Verificar recursos
docker stats
```

---

## 8. Manutenção

### 8.1 Atualizar Código

```bash
# Na Oracle
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build
```

No Vercel, o deploy é automático ao fazer push para `main`.

### 8.2 Backup do Banco (Neon)

O Neon faz backup automático. Para backup manual:

1. Acesse dashboard do Neon
2. Vá em **Branches**
3. Clique em **Create Branch** (cria snapshot)

### 8.3 Monitoramento

**Backend (Oracle):**
```bash
# Uso de recursos
docker stats

# Logs em tempo real
docker logs pub_backend -f
```

**Frontend (Vercel):**
- Acesse dashboard do Vercel → Analytics

**Database (Neon):**
- Acesse dashboard do Neon → Monitoring

### 8.4 Escalar (se necessário)

| Componente | Como Escalar |
|------------|--------------|
| **Frontend** | Automático no Vercel |
| **Backend** | Upgrade VM Oracle (pago) ou adicionar réplica |
| **Database** | Upgrade plano Neon (pago) |

---

## 📊 Resumo de URLs

| Serviço | URL |
|---------|-----|
| **Frontend (Vercel)** | https://pub-system.vercel.app |
| **Backend (Oracle)** | http://134.65.248.235:3000 |
| **Swagger API** | http://134.65.248.235:3000/api |
| **Database (Neon)** | Dashboard em https://console.neon.tech |

---

## 📝 Credenciais Padrão

| Serviço | Usuário | Senha |
|---------|---------|-------|
| **Admin Pub System** | admin@admin.com | admin123 |
| **Database Neon** | neondb_owner | (ver dashboard Neon) |

---

## ✅ Checklist Final

- [ ] Neon configurado e connection string salva
- [ ] Oracle com Docker e backend rodando
- [ ] Firewall Oracle liberando porta 3000
- [ ] Vercel com frontend deployado
- [ ] Variáveis de ambiente corretas em ambos
- [ ] CORS configurado no backend
- [ ] Login funcionando
- [ ] WebSocket conectando
- [ ] Performance melhorada (LCP < 2.5s)

---

**Documento criado em**: Dezembro 2025
**Última atualização**: Deploy híbrido inicial
