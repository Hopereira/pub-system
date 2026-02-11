#!/bin/bash
# =============================================================================
# Health Monitor — Pub System
# Uso: ./scripts/health-monitor.sh [interval_seconds]
# Monitora continuamente a saúde do sistema e alerta em caso de falhas
# =============================================================================

set -euo pipefail

INTERVAL="${1:-60}"  # Intervalo padrão: 60 segundos
API_URL="${API_URL:-https://api.pubsystem.com.br}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"  # Opcional: URL do webhook Slack
MAX_FAILURES=3
FAILURE_COUNT=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }

send_alert() {
    local message="$1"
    local severity="$2"
    
    log_error "ALERTA: $message"
    
    # Enviar para Slack se configurado
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="danger"
        [ "$severity" = "warning" ] && color="warning"
        
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"🚨 Pub System Health Alert\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Ambiente\", \"value\": \"${NODE_ENV:-production}\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"short\": true}
                    ]
                }]
            }" > /dev/null
    fi
}

check_health() {
    local endpoint="$1"
    local name="$2"
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" --max-time 10 "$API_URL$endpoint" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        log_info "✅ $name: OK (HTTP $http_code)"
        return 0
    else
        log_error "❌ $name: FALHOU (HTTP $http_code)"
        return 1
    fi
}

echo ""
echo "=========================================="
echo "  HEALTH MONITOR - Pub System"
echo "=========================================="
echo ""
log_info "API URL: $API_URL"
log_info "Intervalo: ${INTERVAL}s"
log_info "Max falhas antes de alerta: $MAX_FAILURES"
[ -n "$SLACK_WEBHOOK" ] && log_info "Slack webhook: Configurado"
echo ""

while true; do
    echo "--- Verificação $(date '+%H:%M:%S') ---"
    
    # Health check principal
    if check_health "/health" "Health Check"; then
        FAILURE_COUNT=0
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        
        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            send_alert "Sistema não responde após $FAILURE_COUNT tentativas consecutivas" "danger"
            FAILURE_COUNT=0  # Reset para não spammar alertas
        fi
    fi
    
    # Liveness probe
    check_health "/health/live" "Liveness" || true
    
    # Readiness probe
    check_health "/health/ready" "Readiness" || true
    
    echo ""
    sleep "$INTERVAL"
done
