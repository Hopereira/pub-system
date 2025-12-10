# ========================================
# Script de Backup PostgreSQL - Windows
# Pub System
# ========================================

param(
    [string]$ContainerName = "pub_system_db",
    [string]$DbName = "pub_system_db",
    [string]$DbUser = "postgres",
    [string]$BackupDir = "$PSScriptRoot\..\backups"
)

$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# Criar diretório de backup se não existir
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Criando diretório de backup..." -ForegroundColor Green
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Verificar se container está rodando
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Verificando container PostgreSQL..." -ForegroundColor Green
$containerRunning = docker ps --format "{{.Names}}" | Select-String -Pattern $ContainerName
if (!$containerRunning) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Container $ContainerName não está rodando" -ForegroundColor Red
    exit 1
}

# Nome do arquivo de backup
$BackupFile = "backup_${DbName}_${Date}.sql"
$BackupPath = Join-Path $BackupDir $BackupFile

# Realizar backup
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Iniciando backup do banco $DbName..." -ForegroundColor Green
docker exec $ContainerName pg_dump -U $DbUser $DbName > $BackupPath

if ($LASTEXITCODE -eq 0) {
    $BackupSize = (Get-Item $BackupPath).Length / 1KB
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backup concluído com sucesso!" -ForegroundColor Green
    Write-Host "   Arquivo: $BackupFile" -ForegroundColor Cyan
    Write-Host "   Tamanho: $([math]::Round($BackupSize, 2)) KB" -ForegroundColor Cyan
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Falha ao realizar backup" -ForegroundColor Red
    exit 1
}

# Verificar integridade básica (arquivo não vazio e contém SQL)
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Verificando integridade do backup..." -ForegroundColor Green
$content = Get-Content $BackupPath -Head 10
if ($content -match "PostgreSQL database dump") {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backup íntegro" -ForegroundColor Green
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: Backup pode estar incompleto" -ForegroundColor Yellow
}

# Contar tabelas no backup
$tableCount = (Select-String -Path $BackupPath -Pattern "CREATE TABLE" | Measure-Object).Count
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 📊 Tabelas no backup: $tableCount" -ForegroundColor Cyan

# Listar backups existentes
Write-Host ""
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backups disponíveis:" -ForegroundColor Green
Get-ChildItem $BackupDir -Filter "backup_*.sql" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    ForEach-Object { Write-Host "   $($_.Name) - $([math]::Round($_.Length/1KB, 2)) KB" -ForegroundColor Cyan }

Write-Host ""
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Script de backup finalizado!" -ForegroundColor Green
Write-Host "   Caminho completo: $BackupPath" -ForegroundColor Cyan

# Retornar caminho do backup para uso em scripts
return $BackupPath
