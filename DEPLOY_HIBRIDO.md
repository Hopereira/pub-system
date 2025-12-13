# 🚀 Deploy Híbrido - Pub System

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VERCEL        │     │  CLOUDFLARE      │     │   ORACLE VM     │
│   (Frontend)    │────▶│  TUNNEL (HTTPS)  │────▶│   (Backend)     │
│   Next.js 15    │     │  trycloudflare   │     │   NestJS 10     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   NEON          │
                                                 │   PostgreSQL    │
                                                 │   (Cloud DB)    │
                                                 └─────────────────┘
```

## 📋 Componentes

| Componente | Serviço | URL/Host |
|------------|---------|----------|
| **Frontend** | Vercel | https://pub-system.vercel.app |
| **Backend** | Oracle VM E2.1.Micro | 134.65.248.235:3000 |
| **Tunnel HTTPS** | Cloudflare | https://XXXXX.trycloudflare.com |
| **Banco de Dados** | Neon PostgreSQL | ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech |

---

# 🗄️ Banco de Dados (Neon PostgreSQL)

## Credenciais

```env
DB_HOST=ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_AiCeM9ju7rLT
DB_DATABASE=neondb
DB_SSL=true
```

## Acesso via psql

```bash
psql "postgresql://neondb_owner:npg_AiCeM9ju7rLT@ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Console Web

- **URL**: https://console.neon.tech
- **Projeto**: pub-system (sa-east-1)

---

# 🖥️ Backend (Oracle VM)

## Acesso SSH

```bash
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235
```

## Diretório do Projeto

```bash
cd ~/pub-system
```

## Arquivo .env na Oracle

```bash
# Localização: ~/pub-system/.env
nano ~/pub-system/.env
```

**Conteúdo do .env:**
```env
# Banco de Dados (Neon)
DB_HOST=ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_AiCeM9ju7rLT
DB_DATABASE=neondb
DB_SSL=true

# JWT
JWT_SECRET=pub-system-jwt-secret-2024-production

# Admin
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

# GCS (opcional - deixar vazio se não usar)
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=

# Ambiente
NODE_ENV=production
```

## Comandos Docker

```bash
# Ver status dos containers
docker ps

# Ver logs do backend
docker logs pub-backend -f

# Parar containers
docker compose -f docker-compose.micro.yml down

# Iniciar containers
docker compose -f docker-compose.micro.yml up -d

# Rebuild completo
docker compose -f docker-compose.micro.yml up -d --build

# Atualizar código e rebuild
git pull origin main
docker compose -f docker-compose.micro.yml down
docker compose -f docker-compose.micro.yml up -d --build
```

## Verificar Backend

```bash
# Testar se está rodando
curl http://localhost:3000

# Ver logs em tempo real
docker logs pub-backend -f
```

---

# 🌐 Cloudflare Tunnel

## Por que usar?

O Cloudflare Tunnel fornece **HTTPS gratuito** para o backend, necessário porque:
- Vercel (frontend) usa HTTPS
- Navegadores bloqueiam requisições HTTP de páginas HTTPS (Mixed Content)
- Oracle VM gratuita não tem domínio/SSL próprio

## Iniciar Tunnel

```bash
# Na Oracle VM
cloudflared tunnel --url http://localhost:3000
```

**Output esperado:**
```
Your quick Tunnel has been created! Visit it at:
https://XXXXX-XXXXX-XXXXX-XXXXX.trycloudflare.com
```

## Rodar em Background

```bash
# Opção 1: nohup
nohup cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &

# Opção 2: screen
screen -S tunnel
cloudflared tunnel --url http://localhost:3000
# Ctrl+A, D para desanexar

# Reconectar ao screen
screen -r tunnel
```

## Verificar se está rodando

```bash
ps aux | grep cloudflared
```

## ⚠️ IMPORTANTE

A URL do Cloudflare Tunnel **muda toda vez** que você reinicia o túnel!

Quando a URL mudar:
1. Copie a nova URL
2. Atualize no Vercel (Environment Variables)
3. Faça redeploy do frontend

---

# 🎨 Frontend (Vercel)

## URLs

- **Produção**: https://pub-system.vercel.app
- **Dashboard Vercel**: https://vercel.com/hopereiras-projects/pub-system

## Variáveis de Ambiente

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL do Cloudflare Tunnel (ex: `https://premiere-reports-classified-issn.trycloudflare.com`) |

## Atualizar Variável de Ambiente

1. Acesse: https://vercel.com/hopereiras-projects/pub-system/settings/environment-variables
2. Edite `NEXT_PUBLIC_API_URL`
3. Cole a nova URL do Cloudflare Tunnel
4. Clique em **Save**

## Redeploy

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **Redeploy**
4. Marque **"Redeploy with existing Build Cache"** ou desmarque para rebuild completo

## Deploy Manual (do seu PC)

```bash
cd frontend
npm run build
npx vercel --prod
```

---

# 🔄 Guia Rápido - Reiniciar Tudo

## 1. Backend (Oracle VM)

```bash
# Conectar
ssh -i ~/.ssh/oracle_key ubuntu@134.65.248.235

# Ir para o projeto
cd ~/pub-system

# Atualizar código
git pull origin main

# Rebuild e iniciar
docker compose -f docker-compose.micro.yml down
docker compose -f docker-compose.micro.yml up -d --build

# Verificar logs
docker logs pub-backend -f
```

## 2. Cloudflare Tunnel (Oracle VM)

```bash
# Iniciar túnel
cloudflared tunnel --url http://localhost:3000

# Copiar a URL que aparece:
# https://XXXXX.trycloudflare.com
```

## 3. Frontend (Vercel)

1. Acessar: https://vercel.com/hopereiras-projects/pub-system/settings/environment-variables
2. Atualizar `NEXT_PUBLIC_API_URL` com a nova URL do túnel
3. Fazer **Redeploy**

## 4. Testar

- Acessar: https://pub-system.vercel.app
- Login: `admin@admin.com` / `admin123`

---

# 🔧 Troubleshooting

## Erro de CORS

**Sintoma**: Requisições bloqueadas, erro "Access-Control-Allow-Origin"

**Solução**: Verificar se o backend foi atualizado com a configuração de CORS que permite Vercel:
```bash
# Na Oracle
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build
```

## Erro "Mixed Content"

**Sintoma**: Frontend HTTPS não consegue chamar backend HTTP

**Solução**: Usar Cloudflare Tunnel para HTTPS

## Login não funciona

**Verificar**:
1. Backend está rodando? `docker ps`
2. Cloudflare Tunnel está ativo? `ps aux | grep cloudflared`
3. URL do túnel está correta no Vercel?
4. Frontend foi redeployado após mudar a variável?

## Banco de dados não conecta

**Verificar**:
1. `DB_SSL=true` está no .env?
2. Credenciais do Neon estão corretas?
3. Ver logs: `docker logs pub-backend -f`

## WebSocket não conecta

**Sintoma**: Erros de WebSocket no console do navegador

**Causa**: WebSocket também precisa passar pelo Cloudflare Tunnel

**Nota**: Funcionalidades REST funcionam normalmente. WebSocket pode ter limitações com Quick Tunnels.

---

# 📊 Custos

| Serviço | Custo |
|---------|-------|
| Oracle VM E2.1.Micro | **Gratuito** (Always Free) |
| Neon PostgreSQL | **Gratuito** (Free Tier: 0.5GB) |
| Vercel | **Gratuito** (Hobby Plan) |
| Cloudflare Tunnel | **Gratuito** (Quick Tunnels) |
| **TOTAL** | **$0/mês** |

---

# 📅 Manutenção

## Diária
- Verificar se Cloudflare Tunnel está rodando

## Semanal
- Verificar logs do backend: `docker logs pub-backend --tail 100`
- Verificar uso de storage no Neon

## Quando atualizar código
1. Push para GitHub
2. Na Oracle: `git pull && docker compose -f docker-compose.micro.yml up -d --build`
3. Se mudou frontend: Vercel faz deploy automático

---

# 🔐 Credenciais Importantes

## Admin do Sistema
- **Email**: admin@admin.com
- **Senha**: admin123

## Neon PostgreSQL
- **Host**: ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
- **User**: neondb_owner
- **Password**: npg_AiCeM9ju7rLT
- **Database**: neondb

## Oracle VM
- **IP**: 134.65.248.235
- **User**: ubuntu
- **SSH Key**: ~/.ssh/oracle_key

---

*Documentação criada em: 12 de Dezembro de 2025*
*Última atualização: Deploy híbrido funcionando*
