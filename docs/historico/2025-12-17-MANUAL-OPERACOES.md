# 🛠️ Manual de Operações - Pub System

**Data:** 17 de Dezembro de 2025  
**Versão:** 1.0  
**Autor:** Cascade AI  
**Público-Alvo:** Administradores de Sistema

---

## 📋 Sumário

1. [Backup e Restore do Banco](#1-backup-e-restore-do-banco)
2. [Monitoramento de Logs](#2-monitoramento-de-logs)
3. [Troubleshooting Comum](#3-troubleshooting-comum)
4. [Atualização do Sistema](#4-atualização-do-sistema)
5. [Escalonamento de Problemas](#5-escalonamento-de-problemas)

---

## 1. 💾 Backup e Restore do Banco

### 1.1 Estratégia de Backup

**Política Recomendada:**
- 🔴 **Backup Completo:** Diário às 03:00 AM
- 🟡 **Backup Incremental:** A cada 6 horas
- 🟢 **Retenção:** 30 dias (diários), 12 meses (mensais)
- 📦 **Armazenamento:** Local + Cloud (redundância)

### 1.2 Backup Manual (PostgreSQL)

#### Backup Completo

```bash
# Via Docker
docker-compose exec db pg_dump -U postgres -d pub_system_db -F c -f /tmp/backup.dump

# Copiar para host
docker cp pub_system_db:/tmp/backup.dump ./backups/backup-$(date +%Y%m%d-%H%M%S).dump

# Via servidor (sem Docker)
pg_dump -U postgres -d pub_system_db -F c -f /var/backups/postgres/backup-$(date +%Y%m%d-%H%M%S).dump
```

#### Backup com Compressão

```bash
# Backup compactado (economiza espaço)
docker-compose exec db pg_dump -U postgres -d pub_system_db | gzip > ./backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Ou via servidor
pg_dump -U postgres -d pub_system_db | gzip > /var/backups/postgres/backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

#### Backup Apenas de Dados (sem schema)

```bash
# Útil para migração de dados
pg_dump -U postgres -d pub_system_db --data-only -F c -f backup-data-only.dump
```

#### Backup de Tabela Específica

```bash
# Backup de uma tabela específica
pg_dump -U postgres -d pub_system_db -t pedidos -F c -f backup-pedidos.dump

# Múltiplas tabelas
pg_dump -U postgres -d pub_system_db -t pedidos -t comandas -t clientes -F c -f backup-operacional.dump
```

### 1.3 Backup Automatizado

#### Script de Backup Diário

```bash
# Criar script /usr/local/bin/backup-pub-system.sh
cat > /usr/local/bin/backup-pub-system.sh << 'EOF'
#!/bin/bash

# Configurações
BACKUP_DIR="/var/backups/postgres/pub-system"
DB_NAME="pub_system_db"
DB_USER="postgres"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.dump"
LOG_FILE="/var/log/pub-system-backup.log"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Log início
echo "[$(date)] Iniciando backup..." >> $LOG_FILE

# Executar backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE 2>> $LOG_FILE

# Verificar sucesso
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup concluído: $BACKUP_FILE" >> $LOG_FILE
    
    # Compactar
    gzip $BACKUP_FILE
    
    # Upload para cloud (opcional)
    # gsutil cp $BACKUP_FILE.gz gs://pub-system-backups/
    
    # Remover backups antigos
    find $BACKUP_DIR -name "backup-*.dump.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Backups antigos removidos (>$RETENTION_DAYS dias)" >> $LOG_FILE
else
    echo "[$(date)] ERRO no backup!" >> $LOG_FILE
    # Enviar alerta (email, Slack, etc)
fi
EOF

# Dar permissão de execução
chmod +x /usr/local/bin/backup-pub-system.sh
```

#### Configurar Cron Job

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 03:00)
0 3 * * * /usr/local/bin/backup-pub-system.sh

# Verificar cron jobs
crontab -l
```

### 1.4 Restore do Banco

#### Restore Completo

```bash
# ATENÇÃO: Isso vai SOBRESCREVER o banco atual!

# 1. Parar aplicação
pm2 stop pub-system-backend

# 2. Dropar banco existente (CUIDADO!)
docker-compose exec db psql -U postgres -c "DROP DATABASE pub_system_db;"

# 3. Criar banco novo
docker-compose exec db psql -U postgres -c "CREATE DATABASE pub_system_db;"

# 4. Restaurar backup
docker-compose exec -T db pg_restore -U postgres -d pub_system_db < ./backups/backup-20251217-030000.dump

# 5. Reiniciar aplicação
pm2 start pub-system-backend
```

#### Restore de Backup Compactado

```bash
# Descompactar e restaurar
gunzip -c ./backups/backup-20251217-030000.dump.gz | docker-compose exec -T db pg_restore -U postgres -d pub_system_db
```

#### Restore Parcial (Tabela Específica)

```bash
# Restaurar apenas uma tabela
pg_restore -U postgres -d pub_system_db -t pedidos backup-pedidos.dump
```

#### Restore em Ambiente de Teste

```bash
# Criar banco de teste
docker-compose exec db psql -U postgres -c "CREATE DATABASE pub_system_test;"

# Restaurar backup no banco de teste
docker-compose exec -T db pg_restore -U postgres -d pub_system_test < ./backups/backup-20251217-030000.dump

# Testar queries
docker-compose exec db psql -U postgres -d pub_system_test -c "SELECT COUNT(*) FROM pedidos;"
```

### 1.5 Backup para Cloud

#### Google Cloud Storage

```bash
# Instalar gsutil
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Upload de backup
gsutil cp /var/backups/postgres/backup-*.dump.gz gs://pub-system-backups/

# Listar backups no cloud
gsutil ls gs://pub-system-backups/

# Download de backup
gsutil cp gs://pub-system-backups/backup-20251217-030000.dump.gz ./
```

#### AWS S3

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure

# Upload de backup
aws s3 cp /var/backups/postgres/backup-*.dump.gz s3://pub-system-backups/

# Listar backups
aws s3 ls s3://pub-system-backups/

# Download de backup
aws s3 cp s3://pub-system-backups/backup-20251217-030000.dump.gz ./
```

### 1.6 Verificação de Integridade

```bash
# Verificar tamanho do backup
ls -lh /var/backups/postgres/backup-*.dump.gz

# Verificar conteúdo do backup
pg_restore -l backup-20251217-030000.dump | head -20

# Testar restore em banco temporário
createdb -U postgres pub_system_test
pg_restore -U postgres -d pub_system_test backup-20251217-030000.dump
psql -U postgres -d pub_system_test -c "SELECT COUNT(*) FROM pedidos;"
dropdb -U postgres pub_system_test
```

---

## 2. 📊 Monitoramento de Logs

### 2.1 Localização dos Logs

**Backend (PM2):**
```
/var/www/pub-system/backend/logs/
├── err.log          # Erros
├── out.log          # Output padrão
└── pm2.log          # Logs do PM2
```

**Nginx:**
```
/var/log/nginx/
├── pub-system-backend-access.log
├── pub-system-backend-error.log
└── error.log
```

**PostgreSQL:**
```
/var/log/postgresql/
└── postgresql-15-main.log
```

**Sistema:**
```
/var/log/
├── syslog           # Logs do sistema
├── auth.log         # Autenticação
└── kern.log         # Kernel
```

### 2.2 Visualizar Logs em Tempo Real

#### Backend (PM2)

```bash
# Todos os logs
pm2 logs

# Apenas erros
pm2 logs --err

# Apenas output
pm2 logs --out

# Últimas 100 linhas
pm2 logs --lines 100

# Filtrar por palavra-chave
pm2 logs | grep ERROR

# Logs de aplicação específica
pm2 logs pub-system-backend
```

#### Nginx

```bash
# Access log
tail -f /var/log/nginx/pub-system-backend-access.log

# Error log
tail -f /var/log/nginx/pub-system-backend-error.log

# Filtrar por status code
tail -f /var/log/nginx/pub-system-backend-access.log | grep " 500 "

# Filtrar por IP
tail -f /var/log/nginx/pub-system-backend-access.log | grep "192.168.1.100"
```

#### PostgreSQL

```bash
# Logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# Queries lentas
tail -f /var/log/postgresql/postgresql-15-main.log | grep "duration:"
```

#### Docker

```bash
# Logs de todos os containers
docker-compose logs -f

# Logs do backend
docker-compose logs -f backend

# Logs do banco
docker-compose logs -f db

# Últimas 100 linhas
docker-compose logs --tail=100 backend
```

### 2.3 Análise de Logs

#### Erros Mais Comuns

```bash
# Top 10 erros no backend
grep ERROR /var/www/pub-system/backend/logs/err.log | cut -d' ' -f5- | sort | uniq -c | sort -rn | head -10

# Erros 500 no Nginx
grep " 500 " /var/log/nginx/pub-system-backend-access.log | wc -l

# IPs com mais erros 4xx
awk '$9 ~ /^4/ {print $1}' /var/log/nginx/pub-system-backend-access.log | sort | uniq -c | sort -rn | head -10
```

#### Performance

```bash
# Requests mais lentos (Nginx)
awk '{print $NF, $7}' /var/log/nginx/pub-system-backend-access.log | sort -rn | head -20

# Queries lentas (PostgreSQL)
grep "duration:" /var/log/postgresql/postgresql-15-main.log | awk '{print $8, $9, $10}' | sort -rn | head -10
```

#### Estatísticas

```bash
# Requests por hora
awk '{print $4}' /var/log/nginx/pub-system-backend-access.log | cut -d: -f1-2 | sort | uniq -c

# Status codes
awk '{print $9}' /var/log/nginx/pub-system-backend-access.log | sort | uniq -c | sort -rn

# Endpoints mais acessados
awk '{print $7}' /var/log/nginx/pub-system-backend-access.log | sort | uniq -c | sort -rn | head -20
```

### 2.4 Rotação de Logs

#### Configurar Logrotate

```bash
# Criar configuração
sudo nano /etc/logrotate.d/pub-system
```

```conf
/var/www/pub-system/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/pub-system-*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

```bash
# Testar configuração
sudo logrotate -d /etc/logrotate.d/pub-system

# Forçar rotação
sudo logrotate -f /etc/logrotate.d/pub-system
```

### 2.5 Alertas Automáticos

#### Script de Monitoramento

```bash
# Criar script /usr/local/bin/monitor-pub-system.sh
cat > /usr/local/bin/monitor-pub-system.sh << 'EOF'
#!/bin/bash

# Configurações
ERROR_THRESHOLD=10
LOG_FILE="/var/www/pub-system/backend/logs/err.log"
ALERT_EMAIL="admin@pubsystem.com.br"

# Contar erros na última hora
ERROR_COUNT=$(grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" $LOG_FILE | grep ERROR | wc -l)

# Verificar threshold
if [ $ERROR_COUNT -gt $ERROR_THRESHOLD ]; then
    echo "ALERTA: $ERROR_COUNT erros detectados na última hora!" | mail -s "Pub System - Alerta de Erros" $ALERT_EMAIL
fi

# Verificar se aplicação está rodando
if ! pm2 list | grep -q "pub-system-backend.*online"; then
    echo "ALERTA: Aplicação não está rodando!" | mail -s "Pub System - Aplicação Offline" $ALERT_EMAIL
    pm2 restart pub-system-backend
fi

# Verificar espaço em disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERTA: Disco com $DISK_USAGE% de uso!" | mail -s "Pub System - Disco Cheio" $ALERT_EMAIL
fi
EOF

chmod +x /usr/local/bin/monitor-pub-system.sh

# Adicionar ao cron (executar a cada 15 minutos)
crontab -e
# */15 * * * * /usr/local/bin/monitor-pub-system.sh
```

---

## 3. 🔧 Troubleshooting Comum

### 3.1 Aplicação Não Inicia

**Sintomas:**
- PM2 mostra status "errored"
- Logs mostram erro de conexão

**Diagnóstico:**

```bash
# Verificar status
pm2 status

# Ver logs de erro
pm2 logs --err --lines 50

# Verificar variáveis de ambiente
pm2 env 0

# Verificar conexão com banco
docker-compose exec db psql -U postgres -d pub_system_db -c "SELECT 1"
```

**Soluções:**

```bash
# 1. Verificar .env
cat /var/www/pub-system/backend/.env | grep DB_

# 2. Verificar se banco está rodando
docker-compose ps db
sudo systemctl status postgresql

# 3. Testar conexão
psql -h localhost -U postgres -d pub_system_db

# 4. Rebuild e restart
cd /var/www/pub-system/backend
npm run build
pm2 restart pub-system-backend

# 5. Se persistir, verificar porta
netstat -tulpn | grep 3000
# Se porta ocupada, matar processo
kill -9 $(lsof -t -i:3000)
```

### 3.2 Erro 502 Bad Gateway

**Sintomas:**
- Nginx retorna 502
- Frontend não consegue conectar ao backend

**Diagnóstico:**

```bash
# Verificar se backend está rodando
pm2 status
curl http://localhost:3000/health

# Verificar logs do Nginx
tail -50 /var/log/nginx/pub-system-backend-error.log

# Verificar configuração do Nginx
sudo nginx -t
```

**Soluções:**

```bash
# 1. Reiniciar backend
pm2 restart pub-system-backend

# 2. Verificar proxy_pass no Nginx
sudo nano /etc/nginx/sites-available/pub-system-backend
# Deve ter: proxy_pass http://localhost:3000;

# 3. Reiniciar Nginx
sudo systemctl restart nginx

# 4. Verificar firewall
sudo ufw status
sudo ufw allow 3000/tcp
```

### 3.3 Banco de Dados Lento

**Sintomas:**
- Queries demoram muito
- Timeout em requisições

**Diagnóstico:**

```bash
# Verificar queries ativas
docker-compose exec db psql -U postgres -d pub_system_db -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
"

# Verificar locks
docker-compose exec db psql -U postgres -d pub_system_db -c "
SELECT * FROM pg_locks WHERE NOT granted;
"

# Verificar tamanho do banco
docker-compose exec db psql -U postgres -d pub_system_db -c "
SELECT pg_size_pretty(pg_database_size('pub_system_db'));
"
```

**Soluções:**

```bash
# 1. Matar query lenta
docker-compose exec db psql -U postgres -d pub_system_db -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE pid = 12345;
"

# 2. Vacuum e analyze
docker-compose exec db psql -U postgres -d pub_system_db -c "VACUUM ANALYZE;"

# 3. Reindexar
docker-compose exec db psql -U postgres -d pub_system_db -c "REINDEX DATABASE pub_system_db;"

# 4. Verificar índices faltando
# Analisar queries lentas nos logs e criar índices apropriados
```

### 3.4 Upload de Imagens Falhando

**Sintomas:**
- Erro ao fazer upload de produtos/eventos
- Timeout em uploads

**Diagnóstico:**

```bash
# Verificar credenciais GCS
cat /var/www/pub-system/backend/gcs-credentials.json

# Verificar variável de ambiente
grep GCS /var/www/pub-system/backend/.env

# Testar upload manual
gsutil cp test.jpg gs://pub-system-production/test.jpg

# Verificar logs
pm2 logs | grep GCS
```

**Soluções:**

```bash
# 1. Verificar permissões do bucket
gsutil iam get gs://pub-system-production

# 2. Reautenticar
gcloud auth application-default login

# 3. Verificar service account
gcloud iam service-accounts list

# 4. Recriar credenciais se necessário
gcloud iam service-accounts keys create new-gcs-credentials.json \
  --iam-account=pub-system-storage@projeto.iam.gserviceaccount.com
```

### 3.5 WebSocket Não Conecta

**Sintomas:**
- Notificações em tempo real não funcionam
- Console mostra erro de WebSocket

**Diagnóstico:**

```bash
# Verificar se backend está escutando WebSocket
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost:3000" \
  -H "Origin: http://localhost:3001" \
  http://localhost:3000/socket.io/

# Verificar configuração Nginx
grep -A 10 "location /socket.io" /etc/nginx/sites-available/pub-system-backend
```

**Soluções:**

```bash
# 1. Adicionar configuração WebSocket no Nginx
sudo nano /etc/nginx/sites-available/pub-system-backend
```

```nginx
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
```

```bash
# 2. Reiniciar Nginx
sudo nginx -t
sudo systemctl restart nginx

# 3. Verificar CORS no backend
# backend/src/main.ts deve ter:
# cors: { origin: ['https://pubsystem.com.br'], credentials: true }
```

### 3.6 Memória Alta

**Sintomas:**
- Servidor lento
- PM2 reiniciando aplicação
- OOM (Out of Memory) errors

**Diagnóstico:**

```bash
# Verificar uso de memória
free -h
pm2 monit

# Verificar processos
top -o %MEM
ps aux --sort=-%mem | head -10

# Verificar logs de OOM
dmesg | grep -i "out of memory"
```

**Soluções:**

```bash
# 1. Reiniciar aplicação
pm2 restart pub-system-backend

# 2. Aumentar limite de memória no PM2
# ecosystem.config.js
max_memory_restart: '2G'

# 3. Otimizar Node.js
# Adicionar no ecosystem.config.js:
env: {
  NODE_OPTIONS: '--max-old-space-size=2048'
}

# 4. Limpar cache
pm2 flush

# 5. Se persistir, aumentar RAM do servidor
```

### 3.7 Disco Cheio

**Sintomas:**
- Aplicação não consegue escrever logs
- Backup falha
- Banco de dados com erro

**Diagnóstico:**

```bash
# Verificar uso de disco
df -h

# Encontrar diretórios grandes
du -sh /* | sort -rh | head -10
du -sh /var/* | sort -rh | head -10

# Encontrar arquivos grandes
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null
```

**Soluções:**

```bash
# 1. Limpar logs antigos
find /var/log -name "*.log" -mtime +30 -delete
find /var/log -name "*.gz" -mtime +30 -delete

# 2. Limpar backups antigos
find /var/backups/postgres -name "*.dump.gz" -mtime +30 -delete

# 3. Limpar cache do Docker
docker system prune -a --volumes

# 4. Limpar cache do NPM
npm cache clean --force

# 5. Limpar cache do sistema
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove

# 6. Vacuum do PostgreSQL
docker-compose exec db psql -U postgres -d pub_system_db -c "VACUUM FULL;"
```

---

## 4. 🔄 Atualização do Sistema

### 4.1 Processo de Atualização

**Checklist Pré-Atualização:**
- [ ] Backup completo do banco
- [ ] Backup do código atual
- [ ] Notificar usuários (manutenção programada)
- [ ] Testar atualização em ambiente de staging
- [ ] Documentar mudanças
- [ ] Preparar plano de rollback

### 4.2 Atualização do Backend

```bash
# 1. Criar backup
/usr/local/bin/backup-pub-system.sh

# 2. Entrar no diretório
cd /var/www/pub-system

# 3. Criar tag da versão atual
git tag -a v1.0.0 -m "Versão antes da atualização"
git push origin v1.0.0

# 4. Parar aplicação
pm2 stop pub-system-backend

# 5. Fazer backup do código
tar -czf /var/backups/pub-system-code-$(date +%Y%m%d).tar.gz /var/www/pub-system/

# 6. Atualizar código
git fetch origin
git checkout main
git pull origin main

# 7. Instalar dependências
cd backend
npm install --production

# 8. Executar migrations
npm run typeorm:migration:run

# 9. Build
npm run build

# 10. Reiniciar aplicação
pm2 restart pub-system-backend

# 11. Verificar logs
pm2 logs --lines 50

# 12. Testar endpoints críticos
curl http://localhost:3000/health
curl http://localhost:3000/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","senha":"admin123"}'

# 13. Monitorar por 15 minutos
pm2 monit
```

### 4.3 Atualização do Frontend (Vercel)

```bash
# 1. Entrar no diretório
cd /var/www/pub-system/frontend

# 2. Atualizar código
git pull origin main

# 3. Instalar dependências
npm install

# 4. Build local (testar)
npm run build

# 5. Deploy para Vercel
vercel --prod

# 6. Verificar deploy
# Acessar https://pubsystem.com.br

# 7. Testar funcionalidades críticas
# - Login
# - Criar pedido
# - WebSocket
```

### 4.4 Atualização do Banco de Dados

#### Criar Nova Migration

```bash
cd /var/www/pub-system/backend

# Gerar migration
npm run typeorm:migration:generate -- src/database/migrations/AddNewFeature

# Revisar migration gerada
cat src/database/migrations/*-AddNewFeature.ts

# Testar em ambiente de dev primeiro!
```

#### Executar Migration

```bash
# 1. Backup antes de executar
/usr/local/bin/backup-pub-system.sh

# 2. Executar migration
npm run typeorm:migration:run

# 3. Verificar se foi aplicada
npm run typeorm:migration:show

# 4. Se houver erro, reverter
npm run typeorm:migration:revert
```

### 4.5 Rollback

#### Rollback do Backend

```bash
# 1. Parar aplicação
pm2 stop pub-system-backend

# 2. Voltar para versão anterior
cd /var/www/pub-system
git checkout v1.0.0

# 3. Reinstalar dependências
cd backend
npm install --production

# 4. Reverter migrations (se necessário)
npm run typeorm:migration:revert

# 5. Build
npm run build

# 6. Reiniciar
pm2 restart pub-system-backend

# 7. Verificar
pm2 logs --lines 50
```

#### Rollback do Banco

```bash
# Restaurar backup anterior
docker-compose exec db psql -U postgres -c "DROP DATABASE pub_system_db;"
docker-compose exec db psql -U postgres -c "CREATE DATABASE pub_system_db;"
docker-compose exec -T db pg_restore -U postgres -d pub_system_db < /var/backups/postgres/backup-20251217-030000.dump
```

### 4.6 Atualização de Dependências

```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências minor/patch
npm update

# Atualizar dependência específica
npm install @nestjs/core@latest

# Atualizar todas para latest (CUIDADO!)
npm install -g npm-check-updates
ncu -u
npm install

# Testar após atualização
npm run test
npm run build
```

---

## 5. 📞 Escalonamento de Problemas

### 5.1 Níveis de Severidade

| Nível | Descrição | Tempo de Resposta | Exemplo |
|-------|-----------|-------------------|---------|
| **🔴 P0 - Crítico** | Sistema completamente fora do ar | 15 minutos | Banco offline, aplicação crashando |
| **🟠 P1 - Alto** | Funcionalidade crítica não funciona | 1 hora | Pagamentos falhando, login quebrado |
| **🟡 P2 - Médio** | Funcionalidade secundária afetada | 4 horas | Relatórios não carregam, upload lento |
| **🟢 P3 - Baixo** | Problema cosmético ou menor | 24 horas | Texto errado, alinhamento |

### 5.2 Matriz de Escalonamento

#### Nível 1: Administrador de Sistema

**Responsabilidades:**
- Monitoramento 24/7
- Troubleshooting inicial
- Backup e restore
- Reiniciar serviços
- Análise de logs

**Contato:**
- Email: admin@pubsystem.com.br
- Telefone: (24) 99828-5751
- Slack: #pub-system-ops

#### Nível 2: Desenvolvedor Backend

**Responsabilidades:**
- Bugs de código
- Problemas de performance
- Migrations de banco
- Integração com APIs

**Quando escalar:**
- Erro de código identificado nos logs
- Query SQL problemática
- Problema com migrations
- Bug reproduzível

**Contato:**
- Email: dev-backend@pubsystem.com.br
- Slack: #pub-system-dev

#### Nível 3: Desenvolvedor Frontend

**Responsabilidades:**
- Bugs de interface
- Problemas de WebSocket
- Problemas de build
- Performance do frontend

**Quando escalar:**
- Erro no console do browser
- Problema de renderização
- WebSocket não conecta
- Build falha na Vercel

**Contato:**
- Email: dev-frontend@pubsystem.com.br
- Slack: #pub-system-dev

#### Nível 4: Arquiteto/CTO

**Responsabilidades:**
- Decisões arquiteturais
- Problemas de infraestrutura
- Incidentes P0 prolongados
- Mudanças críticas

**Quando escalar:**
- Incidente P0 > 2 horas
- Necessidade de mudança arquitetural
- Problema de segurança crítico
- Decisão de negócio necessária

**Contato:**
- Email: cto@pubsystem.com.br
- Telefone: (24) 99999-9999

### 5.3 Processo de Escalonamento

#### Passo 1: Identificar Severidade

```bash
# Perguntas para classificar:
# - Quantos usuários afetados?
# - Funcionalidade crítica?
# - Há workaround?
# - Perda de dados?
# - Impacto financeiro?
```

#### Passo 2: Troubleshooting Inicial (15 min)

```bash
# Checklist rápido:
1. Verificar status dos serviços
2. Verificar logs recentes
3. Verificar métricas (CPU, RAM, Disco)
4. Tentar reiniciar serviço afetado
5. Verificar mudanças recentes
```

#### Passo 3: Documentar

```markdown
# Template de Incidente

**ID:** INC-2025-001
**Data/Hora:** 2025-12-17 15:30 BRT
**Severidade:** P1 - Alto
**Status:** Em Investigação

**Descrição:**
Usuários não conseguem fazer login. Erro 500 retornado.

**Impacto:**
- 100% dos usuários afetados
- Funcionalidade crítica
- Sem workaround

**Timeline:**
- 15:30 - Problema reportado
- 15:32 - Verificado logs (erro de conexão com banco)
- 15:35 - Identificado banco offline
- 15:37 - Reiniciado PostgreSQL
- 15:40 - Sistema normalizado

**Causa Raiz:**
PostgreSQL crashou por falta de memória.

**Ação Corretiva:**
Aumentar memória do servidor de 4GB para 8GB.

**Prevenção:**
Implementar alerta de uso de memória > 80%.
```

#### Passo 4: Escalar se Necessário

```bash
# Critérios para escalar:
- Não conseguiu resolver em 15 min (P0) ou 1h (P1)
- Problema fora da sua expertise
- Necessita decisão de negócio
- Problema de segurança
```

#### Passo 5: Comunicar

```markdown
# Template de Comunicação

**Para:** Stakeholders
**Assunto:** [P1] Sistema de Login Indisponível

**Status:** RESOLVIDO

Identificamos um problema com o sistema de login às 15:30.
O banco de dados ficou offline devido a falta de memória.

**Impacto:**
- Duração: 10 minutos (15:30 - 15:40)
- Usuários afetados: Todos
- Funcionalidade: Login

**Resolução:**
Reiniciamos o banco de dados e o sistema foi normalizado.

**Próximos Passos:**
Aumentaremos a memória do servidor para prevenir recorrência.

**Desculpas pelo transtorno.**
```

### 5.4 Contatos de Emergência

| Função | Nome | Email | Telefone | Disponibilidade |
|--------|------|-------|----------|-----------------|
| **SysAdmin** | Admin | admin@pubsystem.com.br | (24) 99828-5751 | 24/7 |
| **Dev Backend** | Dev Backend | dev-backend@pubsystem.com.br | - | 9h-18h |
| **Dev Frontend** | Dev Frontend | dev-frontend@pubsystem.com.br | - | 9h-18h |
| **CTO** | CTO | cto@pubsystem.com.br | (24) 99999-9999 | On-call |
| **Suporte GCS** | Google Cloud | - | - | 24/7 |
| **Suporte Vercel** | Vercel | - | - | 24/7 |
| **Suporte Neon** | Neon | - | - | 24/7 |

### 5.5 Ferramentas de Comunicação

**Slack:**
- #pub-system-ops (operações)
- #pub-system-dev (desenvolvimento)
- #pub-system-incidents (incidentes)

**Email:**
- incidents@pubsystem.com.br (incidentes)
- ops@pubsystem.com.br (operações)

**Status Page:**
- https://status.pubsystem.com.br

**Monitoramento:**
- UptimeRobot: https://uptimerobot.com
- Sentry: https://sentry.io

---

## 6. 📚 Recursos Adicionais

### 6.1 Documentação

- **README:** `/var/www/pub-system/README.md`
- **API Docs:** `https://api.pubsystem.com.br/api`
- **Guia de Deploy:** `docs/GUIA-CONFIGURACAO-DEPLOY.md`
- **Arquitetura:** `docs/DOCUMENTACAO-ARQUITETURA-TECNICA.md`

### 6.2 Comandos Úteis

```bash
# Status geral
pm2 status && docker-compose ps && sudo systemctl status nginx

# Logs consolidados
pm2 logs --lines 50 && tail -50 /var/log/nginx/error.log

# Reiniciar tudo
pm2 restart all && sudo systemctl restart nginx

# Backup rápido
/usr/local/bin/backup-pub-system.sh

# Verificar saúde
curl http://localhost:3000/health
```

### 6.3 Scripts Úteis

**Localização:** `/usr/local/bin/`
- `backup-pub-system.sh` - Backup automático
- `monitor-pub-system.sh` - Monitoramento
- `restart-pub-system.sh` - Reiniciar tudo
- `check-pub-system.sh` - Health check

---

*Documento gerado em 17/12/2025*
