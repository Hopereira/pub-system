#!/bin/bash
# =============================================================================
# Deploy Seguro — Pub System
# Uso: ./scripts/deploy.sh [--skip-backup] [--force]
# Requer: Docker, Docker Compose, git, pg_dump
# Executar na Oracle VM: cd ~/pub-system && ./scripts/deploy.sh
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

SKIP_BACKUP=false
FORCE=false
DEPLOY_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PREVIOUS_COMMIT=""
BACKUP_FILE=""

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
for arg in "$@"; do
    case $arg in
        --skip-backup) SKIP_BACKUP=true ;;
        --force) FORCE=true ;;
        --help|-h)
            echo "Uso: $0 [--skip-backup] [--force]"
            echo ""
            echo "Opcoes:"
            echo "  --skip-backup  Pular backup do banco (NAO recomendado)"
            echo "  --force        Nao pedir confirmacao"
            exit 0
            ;;
    esac
done

# =============================================================================
# FUNCOES
# =============================================================================

preflight_checks() {
    log_step "1/7 — Pre-flight checks"

    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker nao encontrado"
        exit 1
    fi
    log_info "Docker: $(docker --version | head -1)"

    # Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose nao encontrado"
        exit 1
    fi
    log_info "Docker Compose: $(docker compose version --short)"

    # Git
    if ! command -v git &> /dev/null; then
        log_error "Git nao encontrado"
        exit 1
    fi

    # .env
    if [ ! -f "${PROJECT_DIR}/.env" ]; then
        log_error "Arquivo .env nao encontrado em ${PROJECT_DIR}"
        exit 1
    fi
    log_info ".env encontrado"

    # Compose file
    if [ ! -f "${PROJECT_DIR}/${COMPOSE_FILE}" ]; then
        log_error "${COMPOSE_FILE} nao encontrado"
        exit 1
    fi
    log_info "${COMPOSE_FILE} encontrado"

    # Disco (minimo 500MB livre)
    DISK_FREE_MB=$(df -m "${PROJECT_DIR}" | tail -1 | awk '{print $4}')
    if [ "$DISK_FREE_MB" -lt 500 ]; then
        log_error "Disco quase cheio: ${DISK_FREE_MB}MB livres (minimo 500MB)"
        exit 1
    fi
    log_info "Espaco em disco: ${DISK_FREE_MB}MB livres"

    # Salvar commit atual para rollback
    PREVIOUS_COMMIT=$(git -C "${PROJECT_DIR}" rev-parse HEAD)
    log_info "Commit atual: ${PREVIOUS_COMMIT:0:8}"
}

do_backup() {
    log_step "2/7 — Backup do banco de dados"

    if [ "$SKIP_BACKUP" = true ]; then
        log_warn "Backup pulado (--skip-backup)"
        return 0
    fi

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="${BACKUP_DIR}/pre_deploy_${DEPLOY_TIMESTAMP}.sql.gz"

    # Verificar se o container postgres esta rodando
    if ! docker ps --format '{{.Names}}' | grep -q "pub-postgres\|pub_system_db"; then
        log_warn "Container PostgreSQL nao encontrado. Tentando backup via host..."
        # Tentar com variaveis do .env
        source "${PROJECT_DIR}/.env" 2>/dev/null || true
        if command -v pg_dump &> /dev/null; then
            PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
                -h "${DB_HOST:-localhost}" \
                -p "${DB_PORT:-5432}" \
                -U "${DB_USER:-postgres}" \
                -d "${DB_DATABASE:-pub_system_db}" \
                --no-owner --no-privileges --format=plain \
                | gzip > "$BACKUP_FILE" 2>/dev/null || {
                    log_warn "Backup falhou — continuando sem backup"
                    BACKUP_FILE=""
                    return 0
                }
        else
            log_warn "pg_dump nao disponivel no host — tentando via Docker"
        fi
    fi

    # Backup via Docker exec se nao fez via host
    if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
        BACKUP_FILE="${BACKUP_DIR}/pre_deploy_${DEPLOY_TIMESTAMP}.sql.gz"
        local PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "pub-postgres|pub_system_db" | head -1)
        if [ -n "$PG_CONTAINER" ]; then
            docker exec "$PG_CONTAINER" pg_dump -U "${DB_USER:-postgres}" -d "${DB_DATABASE:-pub_system_db}" \
                --no-owner --no-privileges \
                | gzip > "$BACKUP_FILE" 2>/dev/null || {
                    log_warn "Backup via Docker falhou"
                    BACKUP_FILE=""
                    return 0
                }
        else
            log_warn "Nenhum container PostgreSQL encontrado — sem backup"
            BACKUP_FILE=""
            return 0
        fi
    fi

    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Backup criado: $BACKUP_FILE ($SIZE)"
    fi
}

pull_code() {
    log_step "3/7 — Atualizando codigo"

    cd "$PROJECT_DIR"

    # Verificar se ha mudancas locais nao commitadas
    if [ -n "$(git status --porcelain)" ]; then
        if [ "$FORCE" = true ]; then
            log_warn "Mudancas locais encontradas — stashing (--force)"
            git stash
        else
            log_error "Mudancas locais nao commitadas encontradas"
            log_error "Commit ou stash antes de fazer deploy, ou use --force"
            exit 1
        fi
    fi

    git pull origin main 2>&1 | tail -5
    NEW_COMMIT=$(git rev-parse HEAD)

    if [ "$PREVIOUS_COMMIT" = "$NEW_COMMIT" ]; then
        log_warn "Nenhuma mudanca no codigo (commit identico)"
        if [ "$FORCE" = false ]; then
            log_info "Use --force para forcar rebuild mesmo sem mudancas"
            exit 0
        fi
    else
        log_info "Atualizado: ${PREVIOUS_COMMIT:0:8} -> ${NEW_COMMIT:0:8}"
        # Mostrar commits novos
        git log --oneline "${PREVIOUS_COMMIT}..${NEW_COMMIT}" 2>/dev/null | head -10
    fi
}

build_image() {
    log_step "4/7 — Build da imagem Docker"

    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" build --no-cache backend 2>&1 | tail -5
    log_info "Imagem construida com sucesso"
}

run_deploy() {
    log_step "5/7 — Deploy do container"

    cd "$PROJECT_DIR"

    # Parar container antigo
    log_info "Parando container antigo..."
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

    # Subir novo container
    log_info "Iniciando novo container..."
    docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tail -5

    log_info "Container iniciado"
}

health_check() {
    log_step "6/7 — Health check"

    local elapsed=0
    local healthy=false

    log_info "Aguardando backend ficar saudavel (timeout: ${HEALTH_TIMEOUT}s)..."

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
        log_info "Health check OK (HTTP 200) apos ${elapsed}s"
        return 0
    else
        log_error "Health check FALHOU apos ${HEALTH_TIMEOUT}s"
        log_error "Ultimo HTTP code: $http_code"
        return 1
    fi
}

do_rollback() {
    log_step "ROLLBACK — Revertendo deploy"

    cd "$PROJECT_DIR"

    # 1. Parar container atual
    log_warn "Parando container com falha..."
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

    # 2. Reverter codigo
    if [ -n "$PREVIOUS_COMMIT" ]; then
        log_warn "Revertendo para commit ${PREVIOUS_COMMIT:0:8}..."
        git checkout "$PREVIOUS_COMMIT" 2>/dev/null || true
    fi

    # 3. Rebuild com codigo anterior
    log_warn "Reconstruindo imagem anterior..."
    docker compose -f "$COMPOSE_FILE" build backend 2>/dev/null || true

    # 4. Restaurar backup do banco se existir
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        log_warn "Restaurando backup do banco..."
        # Subir apenas o postgres primeiro
        docker compose -f "$COMPOSE_FILE" up -d 2>/dev/null || true
        sleep 10

        local PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "pub-postgres|pub_system_db" | head -1)
        if [ -n "$PG_CONTAINER" ]; then
            gunzip -c "$BACKUP_FILE" | docker exec -i "$PG_CONTAINER" \
                psql -U "${DB_USER:-postgres}" -d "${DB_DATABASE:-pub_system_db}" --quiet 2>/dev/null || {
                    log_error "Restore do backup falhou — banco pode estar inconsistente"
                }
        fi
    fi

    # 5. Subir tudo
    docker compose -f "$COMPOSE_FILE" up -d 2>/dev/null || true

    # 6. Verificar
    sleep 15
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$http_code" = "200" ]; then
        log_info "Rollback bem sucedido — sistema online"
    else
        log_error "Rollback pode ter falhado — verificar manualmente"
        log_error "docker logs $CONTAINER_NAME --tail 50"
    fi
}

cleanup_old_backups() {
    log_step "7/7 — Limpeza"

    # Remover backups de deploy com mais de 72h
    if [ -d "$BACKUP_DIR" ]; then
        local DELETED=$(find "$BACKUP_DIR" -name "pre_deploy_*.sql.gz" -mmin +4320 -delete -print 2>/dev/null | wc -l)
        if [ "$DELETED" -gt 0 ]; then
            log_info "${DELETED} backup(s) antigo(s) removido(s) (>72h)"
        fi
    fi

    # Limpar imagens Docker dangling
    docker image prune -f 2>/dev/null | tail -1 || true
}

# =============================================================================
# MAIN
# =============================================================================

echo ""
echo -e "${BLUE}=========================================="
echo "  DEPLOY — Pub System"
echo "==========================================${NC}"
echo ""
echo "Timestamp: $DEPLOY_TIMESTAMP"
echo "Compose:   $COMPOSE_FILE"
echo "Container: $CONTAINER_NAME"
echo ""

# Confirmacao
if [ "$FORCE" = false ]; then
    read -p "Iniciar deploy? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Deploy cancelado"
        exit 0
    fi
fi

# Executar passos
START_TIME=$(date +%s)

preflight_checks
do_backup
pull_code
build_image
run_deploy

if health_check; then
    cleanup_old_backups

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo -e "${GREEN}=========================================="
    echo "  DEPLOY CONCLUIDO COM SUCESSO"
    echo "==========================================${NC}"
    echo ""
    log_info "Duracao: ${DURATION}s"
    log_info "Commit: $(git rev-parse --short HEAD)"
    [ -n "$BACKUP_FILE" ] && log_info "Backup: $BACKUP_FILE"
    echo ""
    log_info "Verificar: curl https://api.pubsystem.com.br/health"
    log_info "Logs: docker logs $CONTAINER_NAME -f"
else
    log_error "Deploy FALHOU — iniciando rollback automatico"
    do_rollback

    echo ""
    echo -e "${RED}=========================================="
    echo "  DEPLOY FALHOU — ROLLBACK EXECUTADO"
    echo "==========================================${NC}"
    echo ""
    log_error "Verificar logs: docker logs $CONTAINER_NAME --tail 100"
    [ -n "$BACKUP_FILE" ] && log_info "Backup preservado: $BACKUP_FILE"
    exit 1
fi
