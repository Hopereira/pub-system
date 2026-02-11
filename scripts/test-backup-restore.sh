#!/bin/bash
# =============================================================================
# Teste Completo de Backup e Restore — Pub System
# Uso: ./scripts/test-backup-restore.sh
# Este script executa um ciclo completo: backup → restore → validação
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
TEST_DB="pub_system_backup_test_$(date +%s)"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}[STEP]${NC} $1"; }
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

cleanup() {
    log_step "Limpando recursos de teste..."
    if [ -n "${TEST_DB:-}" ]; then
        PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" \
            -c "DROP DATABASE IF EXISTS \"$TEST_DB\";" postgres 2>/dev/null || true
        log_info "Banco de teste $TEST_DB removido"
    fi
    if [ -n "${TEST_BACKUP:-}" ] && [ -f "$TEST_BACKUP" ]; then
        rm -f "$TEST_BACKUP"
        log_info "Backup de teste removido"
    fi
}

trap cleanup EXIT

echo ""
echo "=========================================="
echo "  TESTE DE BACKUP E RESTORE - Pub System"
echo "=========================================="
echo ""

# Verificar variáveis de ambiente
log_step "Verificando configuração..."
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
: "${DB_USER:=postgres}"
: "${DB_PASSWORD:?Variável DB_PASSWORD não definida}"
: "${DB_DATABASE:=pub_system_db}"

log_info "Host: $DB_HOST:$DB_PORT"
log_info "Database: $DB_DATABASE"
log_info "Test DB: $TEST_DB"

# Step 1: Criar backup
log_step "1/5 - Criando backup do banco de produção..."
mkdir -p "$BACKUP_DIR"
TEST_BACKUP="$BACKUP_DIR/test_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_DATABASE" \
    --no-owner \
    --no-privileges \
    --format=plain \
    | gzip > "$TEST_BACKUP"

BACKUP_SIZE=$(du -h "$TEST_BACKUP" | cut -f1)
log_success "Backup criado: $TEST_BACKUP ($BACKUP_SIZE)"

# Step 2: Criar banco de teste
log_step "2/5 - Criando banco de dados de teste..."
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    -c "CREATE DATABASE \"$TEST_DB\";" postgres
log_success "Banco $TEST_DB criado"

# Step 3: Restaurar backup
log_step "3/5 - Restaurando backup no banco de teste..."
START_TIME=$(date +%s)

gunzip -c "$TEST_BACKUP" | PGPASSWORD="${DB_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$TEST_DB" \
    --quiet

END_TIME=$(date +%s)
RESTORE_DURATION=$((END_TIME - START_TIME))
log_success "Restore concluído em ${RESTORE_DURATION}s"

# Step 4: Validar integridade
log_step "4/5 - Validando integridade dos dados..."

# Função para contar registros
count_records() {
    local db=$1
    local table=$2
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" \
        -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0"
}

TABLES=("empresa" "funcionario" "ambiente" "mesa" "produto" "cliente" "comanda" "pedido" "item_pedido")
VALIDATION_PASSED=true

echo ""
printf "%-20s %15s %15s %10s\n" "Tabela" "Produção" "Restore" "Status"
printf "%-20s %15s %15s %10s\n" "--------------------" "---------------" "---------------" "----------"

for TABLE in "${TABLES[@]}"; do
    PROD_COUNT=$(count_records "$DB_DATABASE" "$TABLE")
    TEST_COUNT=$(count_records "$TEST_DB" "$TABLE")
    
    if [ "$PROD_COUNT" = "$TEST_COUNT" ]; then
        STATUS="${GREEN}✓ OK${NC}"
    else
        STATUS="${RED}✗ DIFF${NC}"
        VALIDATION_PASSED=false
    fi
    
    printf "%-20s %15s %15s %b\n" "$TABLE" "$PROD_COUNT" "$TEST_COUNT" "$STATUS"
done

echo ""

# Step 5: Resultado final
log_step "5/5 - Resultado do teste..."

if [ "$VALIDATION_PASSED" = true ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✅ TESTE DE BACKUP/RESTORE PASSOU!"
    echo "==========================================${NC}"
    echo ""
    log_info "Backup size: $BACKUP_SIZE"
    log_info "Restore time: ${RESTORE_DURATION}s"
    log_info "Todas as tabelas validadas com sucesso"
    exit 0
else
    echo ""
    echo -e "${RED}=========================================="
    echo "  ❌ TESTE DE BACKUP/RESTORE FALHOU!"
    echo "==========================================${NC}"
    echo ""
    log_error "Diferenças encontradas entre produção e restore"
    log_error "Verifique os logs acima para detalhes"
    exit 1
fi
