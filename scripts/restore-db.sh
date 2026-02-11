#!/bin/bash
# =============================================================================
# Restore PostgreSQL — Pub System
# Uso: ./scripts/restore-db.sh <backup_file.sql.gz>
# Requer: psql, gunzip
# Env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
# =============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
TARGET_DB="${2:-${DB_DATABASE:-pub_system_restore_test}}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validar argumentos
if [ -z "$BACKUP_FILE" ]; then
    log_error "Uso: $0 <backup_file.sql.gz> [target_database]"
    echo ""
    echo "Exemplos:"
    echo "  $0 ./backups/pub_system_20260211_120000.sql.gz"
    echo "  $0 ./backups/pub_system_20260211_120000.sql.gz pub_system_staging"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

# Configurações
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

log_info "=========================================="
log_info "  RESTORE DATABASE - Pub System"
log_info "=========================================="
echo ""
log_info "Backup: $BACKUP_FILE"
log_info "Target DB: $TARGET_DB"
log_info "Host: $DB_HOST:$DB_PORT"
log_info "User: $DB_USER"
echo ""

# Confirmar antes de prosseguir (exceto em CI)
if [ -z "${CI:-}" ]; then
    read -p "Continuar com o restore? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Operação cancelada pelo usuário"
        exit 0
    fi
fi

# Verificar se o banco de destino existe, senão criar
log_info "Verificando banco de dados..."
if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$TARGET_DB"; then
    log_warn "Banco $TARGET_DB já existe. Dropando..."
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS \"$TARGET_DB\";" postgres
fi

log_info "Criando banco $TARGET_DB..."
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE \"$TARGET_DB\";" postgres

# Executar restore
log_info "Restaurando backup..."
START_TIME=$(date +%s)

gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$TARGET_DB" \
    --quiet \
    --set ON_ERROR_STOP=on

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_info "Restore concluído em ${DURATION}s"

# Validar integridade
log_info "Validando integridade..."
echo ""

# Contar registros nas tabelas principais
TABLES=("empresa" "funcionario" "ambiente" "mesa" "produto" "cliente" "comanda" "pedido")
TOTAL_RECORDS=0

for TABLE in "${TABLES[@]}"; do
    COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null | tr -d ' ' || echo "0")
    if [ -n "$COUNT" ] && [ "$COUNT" != "0" ]; then
        log_info "  $TABLE: $COUNT registros"
        TOTAL_RECORDS=$((TOTAL_RECORDS + COUNT))
    else
        log_warn "  $TABLE: 0 registros ou tabela não existe"
    fi
done

echo ""
log_info "Total de registros validados: $TOTAL_RECORDS"

# Verificar migrations
log_info "Verificando migrations..."
MIGRATIONS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM migrations;" 2>/dev/null | tr -d ' ' || echo "0")
log_info "  Migrations aplicadas: $MIGRATIONS"

echo ""
log_info "=========================================="
log_info "  RESTORE COMPLETO COM SUCESSO ✅"
log_info "=========================================="
echo ""
log_info "Banco restaurado: $TARGET_DB"
log_info "Para conectar: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TARGET_DB"
echo ""

# Limpar banco de teste (opcional)
if [ "$TARGET_DB" = "pub_system_restore_test" ]; then
    log_warn "Este é um banco de teste. Para remover:"
    echo "  PGPASSWORD=\$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c 'DROP DATABASE \"$TARGET_DB\";' postgres"
fi
