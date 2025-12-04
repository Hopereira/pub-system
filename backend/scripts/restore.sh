#!/bin/bash

# ========================================
# Script de Restore de Backup PostgreSQL
# Pub System
# ========================================

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

# Configurações
BACKUP_DIR="/backups/postgres"
DB_NAME="${POSTGRES_DB:-pub_system_db}"
DB_USER="${POSTGRES_USER:-postgres}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-pub_system_postgres}"

# Verificar parâmetros
if [ -z "$1" ]; then
    error "Uso: $0 <arquivo_backup.sql.gz>"
    echo ""
    echo "Backups disponíveis:"
    ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -10
    exit 1
fi

BACKUP_FILE="$1"

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    # Tentar no diretório de backups
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        error "Arquivo de backup não encontrado: $BACKUP_FILE"
        exit 1
    fi
fi

log "========================================="
log "🔄 RESTORE DE BACKUP"
log "========================================="
log "Arquivo: $BACKUP_FILE"
log "Banco: $DB_NAME"
log "Container: $CONTAINER_NAME"
log "========================================="

# Confirmar ação
warning "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!"
warning "⚠️  Todos os dados atuais serão PERDIDOS!"
echo ""
read -p "Deseja continuar? Digite 'SIM' para confirmar: " confirmation

if [ "$confirmation" != "SIM" ]; then
    log "Operação cancelada pelo usuário"
    exit 0
fi

# Verificar se container está rodando
log "Verificando container PostgreSQL..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    error "Container $CONTAINER_NAME não está rodando"
    exit 1
fi

# Verificar integridade do backup
log "Verificando integridade do backup..."
if ! gunzip -t $BACKUP_FILE 2>/dev/null; then
    error "Arquivo de backup corrompido!"
    exit 1
fi
log "✅ Backup íntegro"

# Criar backup de segurança antes do restore
log "Criando backup de segurança do estado atual..."
SAFETY_BACKUP="/tmp/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $SAFETY_BACKUP

if [ $? -eq 0 ]; then
    log "✅ Backup de segurança criado: $SAFETY_BACKUP"
else
    error "Falha ao criar backup de segurança"
    exit 1
fi

# Desconectar usuários ativos
log "Desconectando usuários ativos..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1

# Dropar banco existente
log "Removendo banco de dados atual..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "✅ Banco de dados removido"
else
    error "Falha ao remover banco de dados"
    exit 1
fi

# Criar novo banco
log "Criando novo banco de dados..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "✅ Banco de dados criado"
else
    error "Falha ao criar banco de dados"
    exit 1
fi

# Restaurar backup
log "Restaurando backup..."
gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "✅ Backup restaurado com sucesso!"
else
    error "Falha ao restaurar backup"
    warning "Restaurando backup de segurança..."
    
    # Tentar restaurar backup de segurança
    docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1
    docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    gunzip -c $SAFETY_BACKUP | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Backup de segurança restaurado"
    else
        error "Falha crítica! Entre em contato com o suporte"
    fi
    
    exit 1
fi

# Verificar restore
log "Verificando restore..."
TABLE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

log "========================================="
log "✅ RESTORE CONCLUÍDO COM SUCESSO!"
log "========================================="
log "📊 Estatísticas:"
log "   Tabelas restauradas: $TABLE_COUNT"
log "   Backup usado: $(basename $BACKUP_FILE)"
log "   Backup de segurança: $SAFETY_BACKUP"
log "========================================="
log ""
log "💡 Dica: Teste o sistema antes de remover o backup de segurança"
log ""

exit 0
