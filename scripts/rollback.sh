#!/bin/bash
# =============================================================================
# Rollback — Pub System
# Uso: ./scripts/rollback.sh [--db-only <backup_file>] [--code-only] [--force]
# Executar na Oracle VM: cd ~/pub-system && ./scripts/rollback.sh
#
# Modos:
#   (sem flag)           Rollback completo: codigo + banco (ultimo backup)
#   --db-only <file>     Restaurar apenas o banco de um backup especifico
#   --code-only          Reverter apenas o codigo (git) sem tocar no banco
#   --force              Nao pedir confirmacao
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="docker-compose.micro.yml"
CONTAINER_NAME="pub-backend"
BACKUP_DIR="${PROJECT_DIR}/backups"
HEALTH_URL="http://localhost:3000/health"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=5

MODE="full"
BACKUP_FILE=""
FORCE=false

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

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --db-only)
            MODE="db-only"
            BACKUP_FILE="${2:-}"
            shift 2
            ;;
        --code-only)
            MODE="code-only"
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            echo "Uso: $0 [--db-only <backup_file>] [--code-only] [--force]"
            echo ""
            echo "Modos:"
            echo "  (sem flag)           Rollback completo (codigo + banco)"
            echo "  --db-only <file>     Restaurar apenas o banco"
            echo "  --code-only          Reverter apenas o codigo (git)"
            echo "  --force              Sem confirmacao"
            echo ""
            echo "Exemplos:"
            echo "  $0                                           # Rollback completo"
            echo "  $0 --db-only backups/pre_deploy_20260306.sql.gz  # Apenas banco"
            echo "  $0 --code-only                               # Apenas codigo"
            exit 0
            ;;
        *)
            log_error "Argumento desconhecido: $1"
            exit 1
            ;;
    esac
done

# Carregar .env
if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env" 2>/dev/null || true
    set +a
fi

DB_USER="${DB_USER:-postgres}"
DB_DATABASE="${DB_DATABASE:-pub_system_db}"

# =============================================================================
# FUNCOES
# =============================================================================

find_latest_backup() {
    if [ -n "$BACKUP_FILE" ]; then
        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Backup nao encontrado: $BACKUP_FILE"
            exit 1
        fi
        return 0
    fi

    # Procurar backup mais recente
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/pub_system_*.sql.gz 2>/dev/null | head -1 || true)

    if [ -z "$BACKUP_FILE" ]; then
        log_warn "Nenhum backup encontrado em ${BACKUP_DIR}"
        if [ "$MODE" = "db-only" ]; then
            log_error "Modo --db-only requer um backup"
            exit 1
        fi
        log_warn "Rollback do banco sera pulado"
        return 1
    fi

    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    local AGE=$(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f %Sm "$BACKUP_FILE" 2>/dev/null || echo "desconhecido")
    log_info "Backup encontrado: $(basename $BACKUP_FILE) ($SIZE)"
    log_info "Data: $AGE"
    return 0
}

restore_database() {
    log_step "Restaurando banco de dados"

    if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
        log_warn "Sem backup para restaurar — pulando"
        return 0
    fi

    # Encontrar container PostgreSQL
    local PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "pub-postgres|pub_system_db" | head -1 || true)

    if [ -z "$PG_CONTAINER" ]; then
        # Tentar subir o postgres
        log_info "Container PostgreSQL nao encontrado, iniciando..."
        cd "$PROJECT_DIR"
        docker compose -f "$COMPOSE_FILE" up -d 2>/dev/null || true
        sleep 10
        PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "pub-postgres|pub_system_db" | head -1 || true)

        if [ -z "$PG_CONTAINER" ]; then
            log_error "Nao foi possivel iniciar o container PostgreSQL"
            exit 1
        fi
    fi

    log_info "Usando container: $PG_CONTAINER"

    # Fechar conexoes ativas
    log_info "Fechando conexoes ativas..."
    docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_DATABASE'
        AND pid <> pg_backend_pid();
    " 2>/dev/null || true

    # Drop e recria o banco
    log_info "Recriando banco $DB_DATABASE..."
    docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_DATABASE\";" 2>/dev/null || true
    docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_DATABASE\";" 2>/dev/null || {
        log_error "Falha ao criar banco $DB_DATABASE"
        exit 1
    }

    # Restaurar
    log_info "Restaurando dados do backup..."
    gunzip -c "$BACKUP_FILE" | docker exec -i "$PG_CONTAINER" \
        psql -U "$DB_USER" -d "$DB_DATABASE" --quiet 2>/dev/null

    if [ $? -eq 0 ]; then
        log_info "Banco restaurado com sucesso"
    else
        log_error "Erros durante o restore — verificar dados manualmente"
    fi

    # Validacao rapida
    local TABLE_COUNT=$(docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_DATABASE" -t -c "
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " 2>/dev/null | tr -d ' ')
    log_info "Tabelas restauradas: $TABLE_COUNT"
}

rollback_code() {
    log_step "Revertendo codigo"

    cd "$PROJECT_DIR"

    # Encontrar commit anterior
    local CURRENT=$(git rev-parse --short HEAD)
    local PREVIOUS=$(git rev-parse --short HEAD~1 2>/dev/null || true)

    if [ -z "$PREVIOUS" ]; then
        log_error "Nao ha commit anterior para reverter"
        exit 1
    fi

    log_info "Commit atual: $CURRENT"
    log_info "Revertendo para: $PREVIOUS"

    git checkout HEAD~1 2>/dev/null || {
        log_error "Falha ao reverter git"
        exit 1
    }

    log_info "Codigo revertido para $PREVIOUS"
}

rebuild_container() {
    log_step "Reconstruindo container"

    cd "$PROJECT_DIR"

    # Parar container atual
    log_info "Parando containers..."
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

    # Rebuild
    log_info "Reconstruindo imagem..."
    docker compose -f "$COMPOSE_FILE" build backend 2>&1 | tail -3

    # Subir
    log_info "Iniciando containers..."
    docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tail -3
}

health_check() {
    log_step "Health check"

    local elapsed=0
    local healthy=false

    log_info "Aguardando backend (timeout: ${HEALTH_TIMEOUT}s)..."

    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")

        if [ "$http_code" = "200" ]; then
            healthy=true
            break
        fi

        echo -n "."
        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done

    echo ""

    if [ "$healthy" = true ]; then
        log_info "Sistema online (HTTP 200) apos ${elapsed}s"
        return 0
    else
        log_error "Sistema NAO respondeu apos ${HEALTH_TIMEOUT}s"
        log_error "Verificar manualmente: docker logs $CONTAINER_NAME --tail 50"
        return 1
    fi
}

# =============================================================================
# MAIN
# =============================================================================

echo ""
echo -e "${YELLOW}=========================================="
echo "  ROLLBACK — Pub System"
echo "==========================================${NC}"
echo ""
echo "Modo: $MODE"
echo ""

# Confirmacao
if [ "$FORCE" = false ]; then
    echo -e "${RED}ATENCAO: Rollback pode causar perda de dados recentes!${NC}"
    echo ""
    read -p "Continuar com o rollback? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Rollback cancelado"
        exit 0
    fi
fi

START_TIME=$(date +%s)

case $MODE in
    "full")
        find_latest_backup || true
        rollback_code
        rebuild_container
        restore_database
        health_check || true
        ;;
    "db-only")
        find_latest_backup
        restore_database
        # Restart backend para reconectar ao banco restaurado
        log_info "Reiniciando backend para reconectar..."
        cd "$PROJECT_DIR"
        docker compose -f "$COMPOSE_FILE" restart backend 2>/dev/null || true
        sleep 10
        health_check || true
        ;;
    "code-only")
        rollback_code
        rebuild_container
        health_check || true
        ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}=========================================="
echo "  ROLLBACK CONCLUIDO"
echo "==========================================${NC}"
echo ""
log_info "Modo: $MODE"
log_info "Duracao: ${DURATION}s"
log_info "Commit: $(git -C $PROJECT_DIR rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
[ -n "$BACKUP_FILE" ] && log_info "Backup usado: $(basename $BACKUP_FILE)"
echo ""
log_info "Verificar: curl https://api.pubsystem.com.br/health"
log_info "Logs: docker logs $CONTAINER_NAME -f"
