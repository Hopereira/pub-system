#!/bin/bash

# ========================================
# Script de Backup Automático PostgreSQL
# Pub System - Backup Diário
# ========================================

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="${POSTGRES_DB:-pub_system_db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-pub_system_postgres}"
RETENTION_DAYS=30

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Criar diretório de backup se não existir
log "Criando diretório de backup..."
mkdir -p $BACKUP_DIR

if [ $? -ne 0 ]; then
    error "Falha ao criar diretório de backup"
    exit 1
fi

# Verificar se container está rodando
log "Verificando container PostgreSQL..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    error "Container $CONTAINER_NAME não está rodando"
    exit 1
fi

# Nome do arquivo de backup
BACKUP_FILE="backup_${DB_NAME}_${DATE}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Realizar backup
log "Iniciando backup do banco $DB_NAME..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_PATH

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h $BACKUP_PATH | cut -f1)
    log "✅ Backup concluído com sucesso!"
    log "   Arquivo: $BACKUP_FILE"
    log "   Tamanho: $BACKUP_SIZE"
else
    error "Falha ao realizar backup"
    exit 1
fi

# Verificar integridade do backup
log "Verificando integridade do backup..."
if gunzip -t $BACKUP_PATH 2>/dev/null; then
    log "✅ Backup íntegro"
else
    error "Backup corrompido!"
    exit 1
fi

# Upload para cloud (AWS S3) - Opcional
if [ ! -z "$AWS_S3_BUCKET" ]; then
    log "Enviando backup para S3..."
    aws s3 cp $BACKUP_PATH s3://$AWS_S3_BUCKET/backups/postgres/
    
    if [ $? -eq 0 ]; then
        log "✅ Backup enviado para S3"
    else
        warning "Falha ao enviar backup para S3"
    fi
fi

# Upload para cloud (Google Cloud Storage) - Opcional
if [ ! -z "$GCS_BUCKET" ]; then
    log "Enviando backup para GCS..."
    gsutil cp $BACKUP_PATH gs://$GCS_BUCKET/backups/postgres/
    
    if [ $? -eq 0 ]; then
        log "✅ Backup enviado para GCS"
    else
        warning "Falha ao enviar backup para GCS"
    fi
fi

# Limpar backups antigos (manter apenas últimos 30 dias)
log "Limpando backups antigos (>${RETENTION_DAYS} dias)..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

DELETED_COUNT=$(find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ $DELETED_COUNT -gt 0 ]; then
    log "✅ $DELETED_COUNT backup(s) antigo(s) removido(s)"
else
    log "Nenhum backup antigo para remover"
fi

# Listar backups existentes
log "Backups disponíveis:"
ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -5

# Estatísticas
TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

log "========================================="
log "📊 Estatísticas:"
log "   Total de backups: $TOTAL_BACKUPS"
log "   Espaço utilizado: $TOTAL_SIZE"
log "   Retenção: $RETENTION_DAYS dias"
log "========================================="

# Notificar sucesso (webhook opcional)
if [ ! -z "$WEBHOOK_URL" ]; then
    curl -X POST $WEBHOOK_URL \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Backup do Pub System concluído com sucesso!\n📦 Arquivo: $BACKUP_FILE\n📊 Tamanho: $BACKUP_SIZE\"}" \
        > /dev/null 2>&1
fi

log "✅ Script de backup finalizado com sucesso!"
exit 0
