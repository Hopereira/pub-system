# 📦 Scripts de Backup e Restore

Sistema completo de backup automático para o Pub System.

---

## 📋 Scripts Disponíveis

### **1. backup.sh** - Backup Automático

Realiza backup completo do banco de dados PostgreSQL.

**Recursos:**
- ✅ Backup compactado (.sql.gz)
- ✅ Verificação de integridade
- ✅ Upload para cloud (S3/GCS) - opcional
- ✅ Retenção automática (30 dias)
- ✅ Logs detalhados
- ✅ Notificações via webhook - opcional

**Uso:**
```bash
./backup.sh
```

**Variáveis de Ambiente:**
```bash
POSTGRES_DB=pub_system_db          # Nome do banco
POSTGRES_USER=postgres             # Usuário do banco
POSTGRES_HOST=localhost            # Host do banco
POSTGRES_PORT=5432                 # Porta do banco
POSTGRES_CONTAINER=pub_system_postgres  # Nome do container
AWS_S3_BUCKET=my-bucket           # Bucket S3 (opcional)
GCS_BUCKET=my-bucket              # Bucket GCS (opcional)
WEBHOOK_URL=https://...           # URL para notificações (opcional)
```

---

### **2. setup-cron.sh** - Configurar Agendamento

Configura cron job para backup automático diário.

**Recursos:**
- ✅ Backup diário às 3h da manhã
- ✅ Logs em `/var/log/pub-system/backup.log`
- ✅ Teste de backup opcional
- ✅ Configuração automática

**Uso:**
```bash
sudo ./setup-cron.sh
```

**Agendamento Padrão:**
- **Frequência:** Diário
- **Horário:** 3h da manhã (03:00)
- **Log:** `/var/log/pub-system/backup.log`

---

### **3. restore.sh** - Restaurar Backup

Restaura backup do banco de dados.

**Recursos:**
- ✅ Verificação de integridade
- ✅ Backup de segurança automático
- ✅ Confirmação obrigatória
- ✅ Rollback em caso de falha

**Uso:**
```bash
./restore.sh backup_pub_system_db_20241204_030000.sql.gz
```

**⚠️ ATENÇÃO:**
- Esta operação SOBRESCREVE o banco atual
- Todos os dados atuais serão PERDIDOS
- Um backup de segurança é criado automaticamente

---

## 🚀 Instalação Rápida

### **Passo 1: Tornar scripts executáveis**

```bash
cd backend/scripts
chmod +x backup.sh setup-cron.sh restore.sh
```

### **Passo 2: Configurar cron job**

```bash
sudo ./setup-cron.sh
```

### **Passo 3: Testar backup**

```bash
./backup.sh
```

---

## 📊 Estrutura de Backups

```
/backups/postgres/
├── backup_pub_system_db_20241204_030000.sql.gz
├── backup_pub_system_db_20241203_030000.sql.gz
├── backup_pub_system_db_20241202_030000.sql.gz
└── ...
```

**Retenção:** 30 dias (configurável)

---

## 🔧 Configuração Avançada

### **Alterar horário do backup**

Editar cron job:
```bash
crontab -e
```

Exemplos de agendamento:
```bash
# Diário às 3h da manhã
0 3 * * * /path/to/backup.sh

# A cada 6 horas
0 */6 * * * /path/to/backup.sh

# Diário às 2h e 14h
0 2,14 * * * /path/to/backup.sh

# Apenas dias úteis às 3h
0 3 * * 1-5 /path/to/backup.sh
```

### **Alterar retenção de backups**

Editar `backup.sh`:
```bash
RETENTION_DAYS=30  # Alterar para o número desejado
```

### **Configurar upload para S3**

```bash
# Instalar AWS CLI
apt-get install awscli

# Configurar credenciais
aws configure

# Definir variável de ambiente
export AWS_S3_BUCKET=my-pub-system-backups

# Executar backup
./backup.sh
```

### **Configurar upload para GCS**

```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Autenticar
gcloud auth login

# Definir variável de ambiente
export GCS_BUCKET=my-pub-system-backups

# Executar backup
./backup.sh
```

---

## 📝 Comandos Úteis

### **Ver cron jobs configurados**
```bash
crontab -l
```

### **Ver logs de backup**
```bash
tail -f /var/log/pub-system/backup.log
```

### **Listar backups disponíveis**
```bash
ls -lh /backups/postgres/backup_*.sql.gz
```

### **Ver tamanho total dos backups**
```bash
du -sh /backups/postgres/
```

### **Testar integridade de um backup**
```bash
gunzip -t /backups/postgres/backup_*.sql.gz
```

### **Remover cron job**
```bash
crontab -e
# Remover a linha do backup e salvar
```

---

## 🔍 Troubleshooting

### **Erro: "Container não está rodando"**

**Solução:**
```bash
docker ps  # Verificar containers
docker-compose up -d postgres  # Iniciar container
```

### **Erro: "Permissão negada"**

**Solução:**
```bash
chmod +x backup.sh setup-cron.sh restore.sh
```

### **Erro: "Diretório de backup não existe"**

**Solução:**
```bash
sudo mkdir -p /backups/postgres
sudo chown $USER:$USER /backups/postgres
```

### **Backup muito grande**

**Solução:**
- Verificar se há dados desnecessários
- Aumentar retenção de backups
- Configurar upload para cloud

### **Restore falhou**

**Solução:**
- Verificar integridade do backup: `gunzip -t backup.sql.gz`
- Usar backup de segurança criado automaticamente
- Verificar logs: `/var/log/pub-system/backup.log`

---

## 🎯 Checklist de Produção

- [ ] Scripts executáveis configurados
- [ ] Cron job configurado
- [ ] Backup de teste executado com sucesso
- [ ] Restore de teste executado com sucesso
- [ ] Upload para cloud configurado (opcional)
- [ ] Notificações configuradas (opcional)
- [ ] Monitoramento de logs configurado
- [ ] Documentação lida e compreendida

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `/var/log/pub-system/backup.log`
2. Testar backup manualmente: `./backup.sh`
3. Verificar container: `docker ps`
4. Contatar suporte técnico

---

## 📄 Licença

Pub System - Todos os direitos reservados
