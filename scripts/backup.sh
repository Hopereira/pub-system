#!/bin/bash
# =============================================================================
# Backup PostgreSQL — Pub System
# Uso: ./scripts/backup.sh [--daily] [--weekly]
# Executar na Oracle VM: cd ~/pub-system && ./scripts/backup.sh
#
# Env vars (do .env ou exportadas):
#   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
#
# Retencao padrao:
#   --daily   : 7 dias
#   --weekly  : 30 dias
#   (default) : 72 horas (pre-deploy)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"; }

# Parse argumentos
BACKUP_TYPE="deploy"
MAX_AGE_HOURS=72

for arg in "$@"; do
    case $arg in
        --daily)
            BACKUP_TYPE="daily"
            MAX_AGE_HOURS=168  # 7 dias
            ;;
        --weekly)
            BACKUP_TYPE="weekly"
            MAX_AGE_HOURS=720  # 30 dias
            ;;
        --help|-h)
            echo "Uso: $0 [--daily] [--weekly]"
            echo ""
            echo "Opcoes:"
            echo "  (sem flag)  Backup pre-deploy (retencao 72h)"
            echo "  --daily     Backup diario (retencao 7 dias)"
            echo "  --weekly    Backup semanal (retencao 30 dias)"
            exit 0
            ;;
    esac
done

FILENAME="pub_system_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

# Carregar .env se existir
if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env" 2>/dev/null || true
    set +a
fi

# Defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_DATABASE="${DB_DATABASE:-pub_system_db}"

echo ""
echo "=========================================="
echo "  BACKUP — Pub System"
echo "=========================================="
echo ""
log_info "Tipo: $BACKUP_TYPE"
log_info "Banco: ${DB_DATABASE}@${DB_HOST}:${DB_PORT}"
log_info "Retencao: ${MAX_AGE_HOURS}h"

# Criar diretorio
mkdir -p "$BACKUP_DIR"

# Tentar backup via Docker primeiro
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "pub-postgres|pub_system_db" | head -1 || true)

if [ -n "$PG_CONTAINER" ]; then
    log_info "Usando container Docker: $PG_CONTAINER"

    docker exec "$PG_CONTAINER" pg_dump \
        -U "$DB_USER" \
        -d "$DB_DATABASE" \
        --no-owner \
        --no-privileges \
        --format=plain \
        | gzip > "${BACKUP_DIR}/${FILENAME}"

elif command -v pg_dump &> /dev/null; then
    log_info "Usando pg_dump local"

    PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_DATABASE" \
        --no-owner \
        --no-privileges \
        --format=plain \
        | gzip > "${BACKUP_DIR}/${FILENAME}"
else
    log_error "Nenhum metodo de backup disponivel"
    log_error "Necessario: container PostgreSQL rodando OU pg_dump instalado"
    exit 1
fi

# Verificar resultado
if [ ! -f "${BACKUP_DIR}/${FILENAME}" ] || [ ! -s "${BACKUP_DIR}/${FILENAME}" ]; then
    log_error "Backup falhou — arquivo vazio ou nao criado"
    rm -f "${BACKUP_DIR}/${FILENAME}"
    exit 1
fi

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
log_info "Backup criado: ${FILENAME} (${SIZE})"

# Validar backup (verificar se o gzip e valido)
if ! gzip -t "${BACKUP_DIR}/${FILENAME}" 2>/dev/null; then
    log_error "Backup corrompido — arquivo gzip invalido"
    rm -f "${BACKUP_DIR}/${FILENAME}"
    exit 1
fi
log_info "Integridade verificada (gzip OK)"

# Limpar backups antigos do mesmo tipo
if [ "$MAX_AGE_HOURS" -gt 0 ]; then
    DELETED=$(find "$BACKUP_DIR" -name "pub_system_${BACKUP_TYPE}_*.sql.gz" -mmin +$((MAX_AGE_HOURS * 60)) -delete -print 2>/dev/null | wc -l)
    if [ "$DELETED" -gt 0 ]; then
        log_info "${DELETED} backup(s) antigo(s) removido(s) (>${MAX_AGE_HOURS}h)"
    fi
fi

# Listar backups atuais
echo ""
log_info "Backups disponiveis:"
ls -lh "${BACKUP_DIR}"/pub_system_*.sql.gz 2>/dev/null | while read line; do
    echo "  $line"
done

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log_info "Total em disco: $TOTAL_SIZE"

echo ""
echo -e "${GREEN}=========================================="
echo "  BACKUP CONCLUIDO COM SUCESSO"
echo "==========================================${NC}"
echo ""
echo "Arquivo: ${BACKUP_DIR}/${FILENAME}"
echo "Tamanho: ${SIZE}"
echo ""
echo "Para restaurar:"
echo "  ./scripts/rollback.sh --db-only ${BACKUP_DIR}/${FILENAME}"
echo "  # ou"
echo "  ./scripts/restore-db.sh ${BACKUP_DIR}/${FILENAME}"
