#!/bin/bash

# ========================================
# Setup Cron Job para Backup Automático
# Pub System
# ========================================

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    error "Este script precisa ser executado como root ou com sudo"
    exit 1
fi

# Caminho absoluto do script de backup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
LOG_DIR="/var/log/pub-system"
LOG_FILE="$LOG_DIR/backup.log"

# Verificar se script de backup existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Script de backup não encontrado: $BACKUP_SCRIPT"
    exit 1
fi

# Tornar script de backup executável
log "Tornando script de backup executável..."
chmod +x $BACKUP_SCRIPT

if [ $? -eq 0 ]; then
    log "✅ Script de backup configurado"
else
    error "Falha ao configurar permissões"
    exit 1
fi

# Criar diretório de logs
log "Criando diretório de logs..."
mkdir -p $LOG_DIR

if [ $? -eq 0 ]; then
    log "✅ Diretório de logs criado: $LOG_DIR"
else
    error "Falha ao criar diretório de logs"
    exit 1
fi

# Verificar se cron job já existe
log "Verificando cron jobs existentes..."
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    warning "Cron job já existe. Removendo..."
    crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Adicionar cron job
log "Adicionando cron job..."

# Backup diário às 3h da manhã
CRON_SCHEDULE="0 3 * * *"
CRON_JOB="$CRON_SCHEDULE $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    log "✅ Cron job adicionado com sucesso!"
else
    error "Falha ao adicionar cron job"
    exit 1
fi

# Exibir cron jobs atuais
log "========================================="
log "📋 Cron jobs configurados:"
log "========================================="
crontab -l | grep -v "^#"
log "========================================="

# Informações sobre o agendamento
log ""
log "⏰ Agendamento configurado:"
log "   Frequência: Diário"
log "   Horário: 3h da manhã (03:00)"
log "   Script: $BACKUP_SCRIPT"
log "   Log: $LOG_FILE"
log ""

# Testar backup manualmente
log "Deseja executar um backup de teste agora? (s/n)"
read -r response

if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    log "Executando backup de teste..."
    $BACKUP_SCRIPT
    
    if [ $? -eq 0 ]; then
        log "✅ Backup de teste concluído com sucesso!"
    else
        error "Backup de teste falhou"
        exit 1
    fi
else
    log "Backup de teste ignorado"
fi

# Instruções finais
log ""
log "========================================="
log "✅ Configuração concluída!"
log "========================================="
log ""
log "📝 Comandos úteis:"
log ""
log "   Ver cron jobs:"
log "   $ crontab -l"
log ""
log "   Ver logs de backup:"
log "   $ tail -f $LOG_FILE"
log ""
log "   Executar backup manualmente:"
log "   $ $BACKUP_SCRIPT"
log ""
log "   Remover cron job:"
log "   $ crontab -e"
log "   (Remova a linha do backup)"
log ""
log "========================================="

exit 0
