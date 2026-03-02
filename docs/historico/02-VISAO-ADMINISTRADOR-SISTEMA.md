# 🔧 Visão do Administrador do Sistema (DevOps/SysAdmin)

**Público-alvo:** Administradores de sistema, DevOps, SysAdmins  
**Data:** 04/12/2024  
**Status:** ✅ Sistema 90% pronto para produção

---

## 🎯 Objetivo

Este documento descreve como administrar, configurar e manter o **Pub System** em produção, incluindo:

1. **Deploy** e configuração inicial
2. **Monitoramento** e logs
3. **Backup** e recuperação
4. **Segurança** e atualizações
5. **Escalabilidade** e performance
6. **Troubleshooting** comum

---

## 🏗️ Arquitetura de Deploy

### **Stack Tecnológico**

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js 15)           │
│         React 19 + TailwindCSS          │
│         Port: 3001                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         BACKEND (NestJS 10)             │
│         TypeScript + TypeORM            │
│         Port: 3000                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      DATABASE (PostgreSQL 15+)          │
│         Port: 5432                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   STORAGE (Google Cloud Storage)        │
│         Uploads de imagens              │
└─────────────────────────────────────────┘
```

### **Requisitos Mínimos**

**Servidor:**
- CPU: 2 cores
- RAM: 4GB
- Disco: 20GB SSD
- OS: Ubuntu 20.04+ / Debian 11+

**Para 100 usuários simultâneos:**
- CPU: 4 cores
- RAM: 8GB
- Disco: 50GB SSD

---

## 🚀 Deploy com Docker (Recomendado)

### **1. Pré-requisitos**

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### **2. Clonar Repositório**

```bash
git clone https://github.com/seu-usuario/pub-system.git
cd pub-system
git checkout main  # ou branch de produção
```

### **3. Configurar Variáveis de Ambiente**

**Backend (.env):**
```bash
cd backend
cp .env.example .env
nano .env
```

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=pubsystem
DB_PASSWORD=SenhaSegura123!
DB_DATABASE=pub_system_prod

# JWT
JWT_SECRET=ChaveSecretaSuperSegura123!@#

# Frontend
FRONTEND_URL=https://seudominio.com

# Google Cloud Storage
GCS_BUCKET_NAME=pub-system-uploads
GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json

# Porta
PORT=3000
```

**Frontend (.env.local):**
```bash
cd frontend
cp .env.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

### **4. Subir Containers**

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### **5. Executar Migrations**

```bash
# Entrar no container do backend
docker exec -it pub_system_backend sh

# Executar migrations
npm run migration:run

# Sair
exit
```

### **6. Criar Usuário Admin Inicial**

```bash
# Executar seeder
docker exec -it pub_system_backend npm run seed
```

**Credenciais padrão:**
- Email: `admin@pubsystem.com`
- Senha: `Admin123!`

⚠️ **IMPORTANTE:** Altere a senha imediatamente após primeiro login!

---

## 🗄️ Gerenciamento do Banco de Dados

### **Backup Automático**

**Script de Backup (backup.sh):**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="pub_system_prod"
DB_USER="pubsystem"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
docker exec pub_system_postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup concluído: backup_$DATE.sql.gz"
```

**Agendar com Cron:**
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 3h da manhã)
0 3 * * * /opt/pub-system/backup.sh >> /var/log/pub-system-backup.log 2>&1
```

### **Restaurar Backup**

```bash
# Parar aplicação
docker-compose stop backend frontend

# Restaurar
gunzip -c /backups/postgres/backup_20241204_030000.sql.gz | docker exec -i pub_system_postgres psql -U pubsystem pub_system_prod

# Reiniciar
docker-compose start backend frontend
```

### **Migrations**

**Criar nova migration:**
```bash
docker exec -it pub_system_backend npm run migration:create -- NomeDaMigration
```

**Executar migrations pendentes:**
```bash
docker exec -it pub_system_backend npm run migration:run
```

**Reverter última migration:**
```bash
docker exec -it pub_system_backend npm run migration:revert
```

---

## 🔒 Segurança

### **1. SSL/HTTPS (Obrigatório)**

**Com Nginx + Let's Encrypt:**

```nginx
# /etc/nginx/sites-available/pubsystem

server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Obter certificado SSL:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

### **2. Firewall**

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verificar
sudo ufw status
```

### **3. Senhas Fortes**

⚠️ **CRÍTICO:** Alterar todas as senhas padrão:

```bash
# Banco de dados
docker exec -it pub_system_postgres psql -U postgres
ALTER USER pubsystem WITH PASSWORD 'NovaSenhaSegura123!@#';

# JWT Secret
# Editar backend/.env
JWT_SECRET=$(openssl rand -base64 32)
```

### **4. Atualizações de Segurança**

```bash
# Sistema operacional
sudo apt update && sudo apt upgrade -y

# Docker images
docker-compose pull
docker-compose up -d
```

---

## 📊 Monitoramento

### **1. Logs da Aplicação**

**Ver logs em tempo real:**
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Últimas 100 linhas
docker-compose logs --tail=100
```

**Salvar logs:**
```bash
docker-compose logs > logs_$(date +%Y%m%d).txt
```

### **2. Monitoramento de Recursos**

**CPU, RAM, Disco:**
```bash
# Recursos dos containers
docker stats

# Disco
df -h

# RAM
free -h
```

### **3. Health Check**

**Endpoint de saúde:**
```bash
curl https://api.seudominio.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123456
}
```

### **4. Monitoramento Avançado (Recomendado)**

**Opções:**
- **New Relic** - APM completo
- **Datadog** - Infraestrutura + APM
- **Grafana + Prometheus** - Open source
- **Sentry** - Rastreamento de erros

---

## 🔄 Backup e Recuperação

### **Estratégia 3-2-1**

- **3** cópias dos dados
- **2** tipos de mídia diferentes
- **1** cópia offsite

### **Backup Completo**

**Script (backup-full.sh):**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/full"

mkdir -p $BACKUP_DIR

# 1. Banco de dados
docker exec pub_system_postgres pg_dump -U pubsystem pub_system_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 2. Uploads (GCS)
gsutil -m rsync -r gs://pub-system-uploads $BACKUP_DIR/uploads_$DATE/

# 3. Configurações
cp -r /opt/pub-system/.env* $BACKUP_DIR/config_$DATE/

# 4. Compactar tudo
tar -czf $BACKUP_DIR/backup_full_$DATE.tar.gz $BACKUP_DIR/*_$DATE*

# 5. Upload para S3/GCS (offsite)
aws s3 cp $BACKUP_DIR/backup_full_$DATE.tar.gz s3://pub-system-backups/

echo "Backup completo: backup_full_$DATE.tar.gz"
```

### **Teste de Recuperação (Mensal)**

```bash
# 1. Criar ambiente de teste
docker-compose -f docker-compose.test.yml up -d

# 2. Restaurar backup
./restore-backup.sh backup_full_20241204.tar.gz

# 3. Verificar funcionamento
curl http://localhost:3002/health

# 4. Destruir ambiente de teste
docker-compose -f docker-compose.test.yml down -v
```

---

## 📈 Escalabilidade

### **Escala Horizontal (Múltiplos Servidores)**

**Load Balancer (Nginx):**
```nginx
upstream backend_servers {
    server backend1.interno:3000;
    server backend2.interno:3000;
    server backend3.interno:3000;
}

upstream frontend_servers {
    server frontend1.interno:3001;
    server frontend2.interno:3001;
}

server {
    listen 443 ssl;
    server_name seudominio.com;

    location / {
        proxy_pass http://frontend_servers;
    }

    location /api {
        proxy_pass http://backend_servers;
    }
}
```

### **Cache (Redis)**

⚠️ **Não implementado ainda** - Ver roadmap

**Quando implementar:**
```typescript
// backend/src/app.module.ts
CacheModule.register({
  store: redisStore,
  host: 'redis',
  port: 6379,
  ttl: 300, // 5 minutos
})
```

### **CDN para Assets**

**Cloudflare / CloudFront:**
- Imagens de produtos
- Assets estáticos do frontend
- Reduz latência global

---

## 🚨 Troubleshooting

### **1. Backend não inicia**

**Sintomas:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do banco
docker logs pub_system_postgres

# Reiniciar banco
docker-compose restart postgres

# Aguardar 10 segundos
sleep 10

# Reiniciar backend
docker-compose restart backend
```

### **2. Frontend não conecta ao backend**

**Sintomas:**
- Erro de CORS
- Network error

**Solução:**
```bash
# Verificar variável de ambiente
docker exec pub_system_frontend env | grep NEXT_PUBLIC_API_URL

# Deve ser: NEXT_PUBLIC_API_URL=https://api.seudominio.com

# Se estiver errado, editar .env.local e rebuild
docker-compose up -d --build frontend
```

### **3. WebSocket não funciona**

**Sintomas:**
- Pedidos não atualizam em tempo real
- Erro: "WebSocket connection failed"

**Solução:**
```bash
# Verificar CORS no backend
docker exec pub_system_backend cat .env | grep FRONTEND_URL

# Verificar Nginx (se usar)
sudo nginx -t
sudo systemctl reload nginx
```

### **4. Disco cheio**

**Sintomas:**
```
Error: ENOSPC: no space left on device
```

**Solução:**
```bash
# Verificar uso
df -h

# Limpar logs antigos
docker system prune -a --volumes

# Limpar backups antigos (>30 dias)
find /backups -mtime +30 -delete

# Aumentar disco (se necessário)
```

### **5. Performance lenta**

**Diagnóstico:**
```bash
# CPU/RAM
docker stats

# Queries lentas no banco
docker exec -it pub_system_postgres psql -U pubsystem pub_system_prod
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# Logs de erro
docker-compose logs backend | grep ERROR
```

**Soluções:**
- Adicionar índices no banco
- Aumentar recursos do servidor
- Implementar cache (Redis)
- Otimizar queries

---

## 📋 Checklist de Deploy

### **Pré-Deploy**

- [ ] Código testado em staging
- [ ] Migrations testadas
- [ ] Backup do banco atual
- [ ] Variáveis de ambiente configuradas
- [ ] SSL configurado
- [ ] Firewall configurado

### **Deploy**

- [ ] Git pull da branch de produção
- [ ] `docker-compose pull`
- [ ] `docker-compose up -d --build`
- [ ] Executar migrations
- [ ] Verificar health check
- [ ] Testar login
- [ ] Testar funcionalidades críticas

### **Pós-Deploy**

- [ ] Monitorar logs por 1 hora
- [ ] Verificar métricas de performance
- [ ] Notificar equipe
- [ ] Documentar mudanças
- [ ] Backup pós-deploy

---

## 🎯 Conclusão

**Sistema está 90% pronto para produção!**

**O que funciona:**
- ✅ Deploy com Docker
- ✅ Migrations automáticas
- ✅ Health check
- ✅ Logs estruturados
- ✅ Backup manual

**O que falta:**
- ⚠️ Monitoramento automatizado (New Relic/Datadog)
- ⚠️ Backup automático para cloud
- ⚠️ Cache (Redis)
- ⚠️ CI/CD pipeline
- ⚠️ Testes de carga

**Tempo para produção:** 1-2 semanas de configuração de infraestrutura

---

**Próximo Documento:** [03-VISAO-ADMINISTRADOR-PUB.md](./03-VISAO-ADMINISTRADOR-PUB.md)
