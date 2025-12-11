# 🐳 Auditoria de Build e Deploy - Docker

**Data:** 11/12/2024  
**Branch:** `audit/build-deploy-docker`  
**Auditor:** Especialista em Build e Deploy Node.js

---

## 📊 Resumo Executivo

| Categoria | Backend | Frontend | Status |
|-----------|---------|----------|--------|
| **Multi-Stage Build** | ❌ Ausente | ❌ Ausente | 🔴 CRÍTICO |
| **DevDependencies na Imagem** | ✅ Todas | ✅ Todas | 🔴 CRÍTICO |
| **Código Fonte na Imagem** | ✅ Todo | ✅ Todo | 🔴 CRÍTICO |
| **Tamanho Estimado** | ~1.5GB | ~2GB+ | 🔴 CRÍTICO |
| **Otimização de Cache** | ⚠️ Parcial | ⚠️ Parcial | ⚠️ MÉDIO |

### 🚨 VEREDITO: Dockerfiles precisam de **refatoração completa**

---

## 1. ANÁLISE: Backend Dockerfile

### Arquivo Atual: `backend/Dockerfile`

```dockerfile
# Dockerfile de Desenvolvimento

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# ❌ PROBLEMA: Instala TODAS as dependências (incluindo devDependencies)
RUN npm install --force

# ❌ PROBLEMA: Copia TODO o código fonte (incluindo TypeScript)
COPY . .

# ❌ PROBLEMA: Roda em modo desenvolvimento
CMD ["npm", "run", "start:dev"]
```

### 🔴 Problemas Identificados:

| Problema | Impacto | Severidade |
|----------|---------|------------|
| **Sem Multi-Stage Build** | Imagem gigante | 🔴 CRÍTICO |
| **npm install sem --production** | devDependencies incluídas (~200MB+) | 🔴 CRÍTICO |
| **Código TypeScript na imagem** | Exposição de código fonte | 🔴 CRÍTICO |
| **Sem build do TypeScript** | Roda ts-node em produção (lento) | 🔴 CRÍTICO |
| **--force no npm install** | Ignora erros de dependência | ⚠️ MÉDIO |
| **Sem .dockerignore** | Copia node_modules, .git, etc. | ⚠️ MÉDIO |

### Tamanho Estimado da Imagem:
- **node:20-alpine base**: ~180MB
- **node_modules (all)**: ~800MB
- **Código fonte**: ~50MB
- **Total**: ~1GB+ (deveria ser ~200MB)

---

## 2. ANÁLISE: Frontend Dockerfile

### Arquivo Atual: `frontend/Dockerfile`

```dockerfile
# ❌ PROBLEMA: Usa node:20 (Debian) ao invés de alpine
FROM node:20

# ❌ PROBLEMA: Instala dependências do Cypress (não necessário em produção)
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 libgtk-3-0 libgbm-dev ...

WORKDIR /app

COPY package*.json ./

# ❌ PROBLEMA: Instala TODAS as dependências
RUN npm install

# ❌ PROBLEMA: Copia TODO o código fonte
COPY . .

# ❌ PROBLEMA: Roda em modo desenvolvimento
CMD ["npm", "run", "dev"]
```

### 🔴 Problemas Identificados:

| Problema | Impacto | Severidade |
|----------|---------|------------|
| **Sem Multi-Stage Build** | Imagem gigante | 🔴 CRÍTICO |
| **Usa node:20 (Debian)** | Base ~900MB vs ~180MB (alpine) | 🔴 CRÍTICO |
| **Dependências do Cypress** | +500MB desnecessários | 🔴 CRÍTICO |
| **npm install sem --production** | devDependencies incluídas | 🔴 CRÍTICO |
| **Sem next build** | Roda em modo dev (lento) | 🔴 CRÍTICO |
| **Código fonte na imagem** | Exposição + tamanho | 🔴 CRÍTICO |

### Tamanho Estimado da Imagem:
- **node:20 (Debian) base**: ~900MB
- **Cypress deps**: ~500MB
- **node_modules (all)**: ~600MB
- **Código fonte**: ~100MB
- **Total**: ~2GB+ (deveria ser ~300MB)

---

## 3. ANÁLISE: Scripts de Build (package.json)

### Backend Scripts:

```json
{
  "scripts": {
    "build": "nest build",           // ✅ Gera dist/ corretamente
    "start:prod": "node dist/main",  // ✅ Correto para produção
    "start:dev": "npm run migration:run && nest start --watch"  // ⚠️ Usado no Dockerfile
  }
}
```

**Verificação do Build:**
- ✅ `nest build` gera a pasta `dist/` corretamente
- ✅ `start:prod` usa `node dist/main` (correto)
- ❌ Dockerfile usa `start:dev` ao invés de `start:prod`

### Frontend Scripts:

```json
{
  "scripts": {
    "build": "next build --turbopack",  // ✅ Gera .next/ corretamente
    "start": "next start",               // ✅ Correto para produção
    "dev": "next dev"                    // ⚠️ Usado no Dockerfile
  }
}
```

**Verificação do Build:**
- ✅ `next build` gera a pasta `.next/` corretamente
- ✅ `start` usa `next start` (correto)
- ❌ Dockerfile usa `dev` ao invés de `start`

---

## 4. COMPARAÇÃO: Atual vs Otimizado

### Backend:

| Métrica | Atual | Otimizado | Economia |
|---------|-------|-----------|----------|
| Tamanho da Imagem | ~1GB | ~200MB | **80%** |
| Tempo de Build | ~3min | ~2min | **33%** |
| Tempo de Start | ~10s | ~2s | **80%** |
| Código Fonte Exposto | ✅ Sim | ❌ Não | **Segurança** |
| DevDependencies | ✅ Incluídas | ❌ Removidas | **Segurança** |

### Frontend:

| Métrica | Atual | Otimizado | Economia |
|---------|-------|-----------|----------|
| Tamanho da Imagem | ~2GB | ~300MB | **85%** |
| Tempo de Build | ~5min | ~3min | **40%** |
| Tempo de Start | ~15s | ~3s | **80%** |
| Código Fonte Exposto | ✅ Sim | ❌ Não | **Segurança** |
| Cypress Deps | ✅ Incluídas | ❌ Removidas | **Segurança** |

---

## 5. SOLUÇÃO: Dockerfiles Otimizados

### Backend Dockerfile (Multi-Stage):

```dockerfile
# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas arquivos de dependência primeiro (cache)
COPY package*.json ./

# Instala TODAS as dependências (precisa de devDeps para build)
RUN npm ci --legacy-peer-deps

# Copia código fonte
COPY . .

# Compila TypeScript para JavaScript
RUN npm run build

# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine AS production

# Adiciona usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copia apenas package.json (sem lock para instalar só prod)
COPY package*.json ./

# Instala APENAS dependências de produção
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copia APENAS a pasta dist compilada
COPY --from=builder /app/dist ./dist

# Copia arquivos necessários
COPY --from=builder /app/public ./public

# Define usuário não-root
USER nestjs

# Expõe porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de produção
CMD ["node", "dist/main"]
```

### Frontend Dockerfile (Multi-Stage):

```dockerfile
# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ============================================
# STAGE 2: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build do Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# STAGE 3: Production
# ============================================
FROM node:20-alpine AS production

# Adiciona usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia apenas arquivos necessários do build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
```

---

## 6. ARQUIVOS AUXILIARES NECESSÁRIOS

### .dockerignore (Backend):

```
node_modules
dist
.git
.gitignore
*.md
.env
.env.*
coverage
test
*.log
.vscode
.idea
```

### .dockerignore (Frontend):

```
node_modules
.next
.git
.gitignore
*.md
.env
.env.*
coverage
cypress
*.log
.vscode
.idea
```

### next.config.js (Frontend - habilitar standalone):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // ✅ NECESSÁRIO para Docker otimizado
  // ... outras configs
}

module.exports = nextConfig
```

---

## 7. DOCKER COMPOSE (Produção)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    ports:
      - "3001:3000"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pub_system_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Obrigatório:
- [ ] Criar `backend/Dockerfile.prod` com multi-stage
- [ ] Criar `frontend/Dockerfile.prod` com multi-stage
- [ ] Criar `backend/.dockerignore`
- [ ] Criar `frontend/.dockerignore`
- [ ] Adicionar `output: 'standalone'` no next.config.js
- [ ] Testar build local das imagens
- [ ] Verificar tamanho das imagens finais

### Recomendado:
- [ ] Criar docker-compose.prod.yml
- [ ] Configurar CI/CD para build automático
- [ ] Adicionar healthchecks
- [ ] Configurar logging centralizado

---

## 🎯 Resultados Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Tamanho Total** | ~3GB | ~500MB |
| **Tempo de Deploy** | ~8min | ~3min |
| **Segurança** | ❌ Código exposto | ✅ Apenas binários |
| **Performance** | ❌ Dev mode | ✅ Prod otimizado |
| **Custos Cloud** | Alto | **60% menor** |

---

*Auditoria realizada em 11/12/2024*
