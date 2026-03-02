# 🔧 Manual de Operações - Pub System

## 1. 📊 Visão Geral do Sistema

### Componentes em Produção

| Componente | Tecnologia | Localização |
|------------|------------|-------------|
| Frontend | Next.js 15 | Vercel |
| Backend | NestJS 10 | Oracle Cloud |
| Database | PostgreSQL 15 | Neon |
| Storage | GCS | Google Cloud |
| DNS/CDN | Cloudflare | - |

### URLs de Produção

- **Frontend:** https://www.pubsystem.com.br
- **API:** https://api.pubsystem.com.br
- **Swagger:** https://api.pubsystem.com.br/api (apenas dev)
- **Health Check:** https://api.pubsystem.com.br/health

---

## 2. 🗄️ Backup e Restore

### 2.1 Backup do Banco de Dados

**Backup Automático (Neon):**
- Neon faz backup automático a cada 24h
- Retenção: 7 dias (Free Tier) / 30 dias (Pro)
- Point-in-time recovery disponível

**Backup Manual:**

```bash
# Conectar na VM
ssh -i ~/.ssh/oracle_key ubuntu@<IP>

# Executar backup
docker-compose exec backend npm run backup

# Ou diretamente com pg_dump
pg_dump -h <NEON_HOST> -U <USER> -d pub_system -F c -f backup_$(date +%Y%m%d).dump
```

**Script de Backup Agendado:**

```bash
# Criar script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/home/ubuntu/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/pub_system_$DATE.dump

mkdir -p $BACKUP_DIR

# Executar backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_DATABASE -F c -f $BACKUP_FILE

# Remover backups antigos (mais de 7 dias)
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

# Log
echo "$(date): Backup criado: $BACKUP_FILE" >> $BACKUP_DIR/backup.log
EOF

chmod +x /home/ubuntu/backup.sh

# Agendar no cron (diariamente às 3h)
crontab -e
# Adicionar: 0 3 * * * /home/ubuntu/backup.sh
```

### 2.2 Restore do Banco de Dados

```bash
# Restore completo
pg_restore -h <NEON_HOST> -U <USER> -d pub_system -c backup_20250101.dump

# Restore de tabela específica
pg_restore -h <NEON_HOST> -U <USER> -d pub_system -t comandas backup_20250101.dump
```

### 2.3 Backup de Imagens (GCS)

```bash
# Sincronizar bucket para local
gsutil -m rsync -r gs://pub-system-images /home/ubuntu/backups/images/

# Restaurar imagens
gsutil -m rsync -r /home/ubuntu/backups/images/ gs://pub-system-images
```

---

## 3. 📋 Monitoramento de Logs

### 3.1 Logs do Backend

```bash
# Logs em tempo real
docker-compose logs -f backend

# Últimas N linhas
docker-compose logs --tail=100 backend

# Logs de um período específico
docker-compose logs --since="2025-01-01" backend

# Filtrar por nível
docker-compose logs backend 2>&1 | grep "ERROR"
docker-compose logs backend 2>&1 | grep "WARN"
```

### 3.2 Logs do Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Filtrar por status HTTP
cat /var/log/nginx/access.log | grep " 500 "
cat /var/log/nginx/access.log | grep " 404 "
```

### 3.3 Logs do Sistema

```bash
# Logs do sistema
sudo journalctl -u docker -f

# Logs de autenticação
sudo tail -f /var/log/auth.log
```

### 3.4 Centralização de Logs (Recomendado)

Para produção, considere usar:
- **Grafana Loki** - Open source
- **Papertrail** - SaaS simples
- **Datadog** - Enterprise

---

## 4. 🔍 Troubleshooting Comum

### 4.1 Backend não responde

**Sintomas:** API retorna timeout ou 502

**Diagnóstico:**
```bash
# Verificar se container está rodando
docker-compose ps

# Verificar logs
docker-compose logs --tail=50 backend

# Verificar uso de recursos
docker stats

# Verificar conexão com banco
docker-compose exec backend npm run typeorm:query "SELECT 1"
```

**Soluções:**
```bash
# Reiniciar container
docker-compose restart backend

# Rebuild completo
docker-compose down
docker-compose up -d --build

# Limpar cache Docker
docker system prune -a
```

### 4.2 Erro de conexão com banco

**Sintomas:** "Connection refused" ou "timeout"

**Diagnóstico:**
```bash
# Testar conexão direta
psql -h <NEON_HOST> -U <USER> -d pub_system -c "SELECT 1"

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DB_
```

**Soluções:**
- Verificar se `DB_SSL=true` está configurado
- Verificar se IP está na whitelist do Neon
- Verificar connection string

### 4.3 Upload de imagens falha

**Sintomas:** Erro ao fazer upload de foto

**Diagnóstico:**
```bash
# Verificar credenciais GCS
docker-compose exec backend cat /usr/src/app/gcs-credentials.json

# Testar permissões
gsutil ls gs://pub-system-images
```

**Soluções:**
- Verificar se `gcs-credentials.json` está presente
- Verificar permissões da Service Account
- Verificar CORS do bucket

### 4.4 WebSocket não conecta

**Sintomas:** Notificações em tempo real não funcionam

**Diagnóstico:**
```bash
# Verificar se WebSocket está ativo
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://api.pubsystem.com.br/socket.io/

# Verificar logs de WebSocket
docker-compose logs backend | grep -i socket
```

**Soluções:**
- Verificar configuração do Nginx para WebSocket
- Verificar CORS
- Verificar se porta está aberta no firewall

### 4.5 SSL/Certificado expirado

**Sintomas:** Erro de certificado no navegador

**Diagnóstico:**
```bash
# Verificar validade do certificado
sudo certbot certificates

# Verificar renovação automática
sudo systemctl status certbot.timer
```

**Soluções:**
```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl reload nginx
```

### 4.6 Disco cheio

**Sintomas:** Sistema lento ou erros de escrita

**Diagnóstico:**
```bash
# Verificar espaço
df -h

# Verificar maiores diretórios
du -sh /* | sort -rh | head -10

# Verificar logs Docker
du -sh /var/lib/docker/
```

**Soluções:**
```bash
# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Limpar Docker
docker system prune -a --volumes

# Remover backups antigos
find /home/ubuntu/backups -mtime +30 -delete
```

---

## 5. 🔄 Atualização do Sistema

### 5.1 Atualização do Backend

```bash
# Conectar no servidor
ssh -i ~/.ssh/oracle_key ubuntu@<IP>
cd pub-system

# Backup antes de atualizar
./backup.sh

# Atualizar código
git fetch origin
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar logs
docker-compose logs -f backend
```

### 5.2 Atualização do Frontend

O Vercel faz deploy automático a cada push para `main`.

**Deploy manual (se necessário):**
```bash
cd frontend
npx vercel --prod
```

### 5.3 Executar Migrations

```bash
# Verificar migrations pendentes
docker-compose exec backend npm run typeorm:migration:show

# Executar migrations
docker-compose exec backend npm run typeorm:migration:run

# Reverter última migration (se necessário)
docker-compose exec backend npm run typeorm:migration:revert
```

### 5.4 Rollback

```bash
# Voltar para versão anterior
git log --oneline -10  # Ver commits recentes
git checkout <COMMIT_HASH>

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# Restaurar banco (se necessário)
pg_restore -h <NEON_HOST> -U <USER> -d pub_system -c backup_anterior.dump
```

---

## 6. 📈 Escalonamento de Problemas

### Nível 1: Operador
- Reiniciar containers
- Verificar logs básicos
- Verificar status dos serviços

### Nível 2: Suporte Técnico
- Análise de logs detalhada
- Troubleshooting de banco
- Configuração de ambiente

### Nível 3: Desenvolvedor
- Debug de código
- Correção de bugs
- Alterações de arquitetura

### Contatos de Emergência

| Nível | Responsável | Contato |
|-------|-------------|---------|
| N1 | Operações | operacoes@pubsystem.com.br |
| N2 | Suporte | suporte@pubsystem.com.br |
| N3 | Dev | dev@pubsystem.com.br |

---

## 7. 🔐 Segurança

### 7.1 Rotação de Credenciais

**JWT Secret (a cada 90 dias):**
```bash
# Gerar novo secret
openssl rand -base64 32

# Atualizar .env
nano .env
# JWT_SECRET=novo_secret

# Restart
docker-compose restart backend
```

**Senha do Admin:**
```bash
# Via API ou diretamente no banco
UPDATE funcionarios SET senha = 'hash_bcrypt' WHERE email = 'admin@pubsystem.com.br';
```

### 7.2 Auditoria de Acessos

```bash
# Verificar logins recentes
docker-compose logs backend | grep "login"

# Verificar acessos SSH
sudo cat /var/log/auth.log | grep "Accepted"
```

### 7.3 Atualizações de Segurança

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Atualizar dependências Node
cd pub-system/backend && npm audit fix
cd pub-system/frontend && npm audit fix
```

---

## 8. 📊 Métricas de Saúde

### Health Check Endpoints

```bash
# API Health
curl https://api.pubsystem.com.br/health

# Resposta esperada
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00Z",
  "database": "connected"
}
```

### Métricas de Container

```bash
# CPU e Memória
docker stats --no-stream

# Exemplo de saída saudável:
# CONTAINER   CPU %   MEM USAGE / LIMIT     MEM %
# backend     2.5%    256MiB / 4GiB         6.25%
```

### Métricas de Banco

```sql
-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;

-- Tamanho do banco
SELECT pg_size_pretty(pg_database_size('pub_system'));

-- Queries lentas
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 9. 📅 Manutenção Programada

### Diária
- [ ] Verificar health check
- [ ] Verificar logs de erro
- [ ] Verificar backup automático

### Semanal
- [ ] Revisar métricas de performance
- [ ] Limpar logs antigos
- [ ] Verificar espaço em disco

### Mensal
- [ ] Atualizar dependências
- [ ] Rotacionar credenciais
- [ ] Testar restore de backup
- [ ] Revisar configurações de segurança

### Trimestral
- [ ] Atualizar sistema operacional
- [ ] Revisar arquitetura
- [ ] Teste de carga
- [ ] Auditoria de segurança

---

*Manual atualizado em Dezembro 2025*
