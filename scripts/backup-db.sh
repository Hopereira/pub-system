#!/bin/bash
# =============================================================================
# Backup PostgreSQL — Pub System
# Uso: ./scripts/backup-db.sh
# Requer: pg_dump, gzip
# Env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
# =============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-72}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pub_system_${TIMESTAMP}.sql.gz"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup do banco ${DB_DATABASE:-pub_system_db}..."

# Executar pg_dump comprimido
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-postgres}" \
  -d "${DB_DATABASE:-pub_system_db}" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup concluído: ${FILENAME} (${SIZE})"

# Limpar backups antigos
if [ "$MAX_AGE_HOURS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "pub_system_*.sql.gz" -mmin +$((MAX_AGE_HOURS * 60)) -delete -print | wc -l)
  if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] ${DELETED} backup(s) antigo(s) removido(s) (>${MAX_AGE_HOURS}h)"
  fi
fi

echo "[$(date)] Backups atuais:"
ls -lh "${BACKUP_DIR}"/pub_system_*.sql.gz 2>/dev/null || echo "  Nenhum backup encontrado"
