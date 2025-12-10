# ========================================
# Script de Restore PostgreSQL - Windows
# Pub System
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "pub_system_db",
    [string]$DbName = "pub_system_db",
    [string]$DbUser = "postgres",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$BackupDir = "$PSScriptRoot\..\backups"

# Verificar se arquivo existe
if (!(Test-Path $BackupFile)) {
    # Tentar no diretório de backups
    $altPath = Join-Path $BackupDir $BackupFile
    if (Test-Path $altPath) {
        $BackupFile = $altPath
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Arquivo de backup não encontrado: $BackupFile" -ForegroundColor Red
        Write-Host ""
        Write-Host "Backups disponíveis:" -ForegroundColor Yellow
        Get-ChildItem $BackupDir -Filter "backup_*.sql" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 10 | 
            ForEach-Object { Write-Host "   $($_.Name)" -ForegroundColor Cyan }
        exit 1
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🔄 RESTORE DE BACKUP" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Arquivo: $BackupFile" -ForegroundColor White
Write-Host "Banco: $DbName" -ForegroundColor White
Write-Host "Container: $ContainerName" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

# Confirmar ação
if (!$Force) {
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!" -ForegroundColor Yellow
    Write-Host "⚠️  Todos os dados atuais serão PERDIDOS!" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Deseja continuar? Digite 'SIM' para confirmar"
    
    if ($confirmation -ne "SIM") {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Operação cancelada pelo usuário" -ForegroundColor Yellow
        exit 0
    }
}

# Verificar se container está rodando
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Verificando container PostgreSQL..." -ForegroundColor Green
$containerRunning = docker ps --format "{{.Names}}" | Select-String -Pattern $ContainerName
if (!$containerRunning) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Container $ContainerName não está rodando" -ForegroundColor Red
    exit 1
}

# Criar backup de segurança antes do restore
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Criando backup de segurança do estado atual..." -ForegroundColor Green
$SafetyBackup = Join-Path $env:TEMP "safety_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
docker exec $ContainerName pg_dump -U $DbUser $DbName > $SafetyBackup 2>$null

if ($LASTEXITCODE -eq 0 -and (Test-Path $SafetyBackup)) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backup de segurança criado: $SafetyBackup" -ForegroundColor Green
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: Não foi possível criar backup de segurança (banco pode estar vazio)" -ForegroundColor Yellow
}

# Desconectar usuários ativos
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Desconectando usuários ativos..." -ForegroundColor Green
docker exec $ContainerName psql -U $DbUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" 2>$null | Out-Null

# Dropar banco existente
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Removendo banco de dados atual..." -ForegroundColor Green
docker exec $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $DbName;" 2>$null | Out-Null

# Criar novo banco
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Criando novo banco de dados..." -ForegroundColor Green
docker exec $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $DbName;" 2>$null | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Falha ao criar banco de dados" -ForegroundColor Red
    exit 1
}

# Restaurar backup
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restaurando backup..." -ForegroundColor Green
Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backup restaurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Falha ao restaurar backup" -ForegroundColor Red
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restaurando backup de segurança..." -ForegroundColor Yellow
    
    # Tentar restaurar backup de segurança
    docker exec $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $DbName;" 2>$null | Out-Null
    docker exec $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $DbName;" 2>$null | Out-Null
    Get-Content $SafetyBackup | docker exec -i $ContainerName psql -U $DbUser -d $DbName 2>$null | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backup de segurança restaurado" -ForegroundColor Green
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERRO CRÍTICO! Entre em contato com o suporte" -ForegroundColor Red
    }
    
    exit 1
}

# Verificar restore
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Verificando restore..." -ForegroundColor Green
$tableCount = docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$tableCount = $tableCount.Trim()

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ RESTORE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📊 Estatísticas:" -ForegroundColor White
Write-Host "   Tabelas restauradas: $tableCount" -ForegroundColor Cyan
Write-Host "   Backup usado: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Cyan
Write-Host "   Backup de segurança: $SafetyBackup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Dica: Teste o sistema antes de remover o backup de segurança" -ForegroundColor Yellow

exit 0
