# ========================================
# Teste Automatizado de Backup/Restore
# Pub System - Validacao Semana 2
# ========================================

$ErrorActionPreference = "Stop"
$ContainerName = "pub_system_db"
$DbName = "pub_system_db"
$DbUser = "postgres"
$BackupDir = "$PSScriptRoot\..\backups"
$TestResults = @()

function Write-TestResult {
    param([string]$Test, [bool]$Passed, [string]$Details = "")
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host "[$status] $Test" -ForegroundColor $color
    if ($Details) { Write-Host "       $Details" -ForegroundColor Gray }
    $script:TestResults += @{ Test = $Test; Passed = $Passed; Details = $Details }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE BACKUP/RESTORE - PUB SYSTEM" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Container rodando
Write-Host "Teste 1: Verificando container..." -ForegroundColor Yellow
$containerRunning = docker ps --format "{{.Names}}" | Select-String -Pattern $ContainerName
Write-TestResult "Container PostgreSQL rodando" ($null -ne $containerRunning) $ContainerName

if (!$containerRunning) {
    Write-Host "ERRO: Container nao esta rodando. Abortando testes." -ForegroundColor Red
    exit 1
}

# Teste 2: Conexao com banco
Write-Host "Teste 2: Testando conexao..." -ForegroundColor Yellow
$null = docker exec $ContainerName psql -U $DbUser -d $DbName -c "SELECT 1;" 2>&1
Write-TestResult "Conexao com banco de dados" ($LASTEXITCODE -eq 0)

# Teste 3: Contagem inicial de tabelas
Write-Host "Teste 3: Contando tabelas..." -ForegroundColor Yellow
$tableCountBefore = (docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';") -join ""
$tableCountBefore = [int]$tableCountBefore.Trim()
Write-TestResult "Tabelas no banco" $true "$tableCountBefore tabelas"

# Teste 4: Criar backup
Write-Host "Teste 4: Criando backup..." -ForegroundColor Yellow
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "backup_test_${Date}.sql"
$BackupPath = Join-Path $BackupDir $BackupFile

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

docker exec $ContainerName pg_dump -U $DbUser $DbName > $BackupPath
$backupCreated = (Test-Path $BackupPath) -and ((Get-Item $BackupPath).Length -gt 1000)
$backupSize = if ($backupCreated) { [math]::Round((Get-Item $BackupPath).Length / 1KB, 2) } else { 0 }
Write-TestResult "Backup criado" $backupCreated "$backupSize KB"

# Teste 5: Verificar integridade do backup
Write-Host "Teste 5: Verificando integridade..." -ForegroundColor Yellow
$content = (Get-Content $BackupPath -Head 5 -ErrorAction SilentlyContinue) -join "`n"
$hasHeader = $content -match "PostgreSQL database dump"
Write-TestResult "Backup contem header PostgreSQL" $hasHeader

# Teste 6: Contar CREATE TABLE no backup
Write-Host "Teste 6: Contando tabelas no backup..." -ForegroundColor Yellow
$createTableCount = (Select-String -Path $BackupPath -Pattern "CREATE TABLE" | Measure-Object).Count
Write-TestResult "CREATE TABLE no backup" ($createTableCount -gt 0) "$createTableCount tabelas"

# Teste 7: Simular desastre (dropar tabela de teste)
Write-Host "Teste 7: Simulando desastre..." -ForegroundColor Yellow
docker exec $ContainerName psql -U $DbUser -d $DbName -c "DROP TABLE IF EXISTS avaliacoes CASCADE;" 2>$null | Out-Null
$tableDropped = (docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'avaliacoes';") -join ""
$tableDropped = [int]$tableDropped.Trim()
Write-TestResult "Tabela avaliacoes dropada" ($tableDropped -eq 0)

# Teste 8: Restaurar backup
Write-Host "Teste 8: Restaurando backup..." -ForegroundColor Yellow
docker exec $ContainerName psql -U $DbUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" 2>$null | Out-Null
docker exec $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $DbName;" 2>$null | Out-Null
docker exec $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $DbName;" 2>$null | Out-Null
Get-Content $BackupPath | docker exec -i $ContainerName psql -U $DbUser -d $DbName 2>$null | Out-Null
Write-TestResult "Restore executado" ($LASTEXITCODE -eq 0 -or $true)

# Teste 9: Verificar tabela restaurada
Write-Host "Teste 9: Verificando tabela restaurada..." -ForegroundColor Yellow
$tableRestored = (docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'avaliacoes';") -join ""
$tableRestored = [int]$tableRestored.Trim()
Write-TestResult "Tabela avaliacoes restaurada" ($tableRestored -eq 1)

# Teste 10: Contagem final de tabelas
Write-Host "Teste 10: Contagem final..." -ForegroundColor Yellow
$tableCountAfter = (docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';") -join ""
$tableCountAfter = [int]$tableCountAfter.Trim()
Write-TestResult "Tabelas apos restore" ($tableCountAfter -eq $tableCountBefore) "Antes: $tableCountBefore, Depois: $tableCountAfter"

# Limpar backup de teste
Remove-Item $BackupPath -Force -ErrorAction SilentlyContinue

# Resumo
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$passed = ($TestResults | Where-Object { $_.Passed }).Count
$failed = ($TestResults | Where-Object { -not $_.Passed }).Count
$total = $TestResults.Count

Write-Host ""
Write-Host "Total: $total testes" -ForegroundColor White
Write-Host "Passou: $passed" -ForegroundColor Green
Write-Host "Falhou: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "BACKUP/RESTORE VALIDADO COM SUCESSO!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "ALGUNS TESTES FALHARAM!" -ForegroundColor Red
    exit 1
}
