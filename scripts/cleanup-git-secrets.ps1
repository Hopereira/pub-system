# Script de Limpeza de Secrets do Histórico Git
# Pub System - Preparação para Produção
# Data: 2026-02-11

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LIMPEZA DE SECRETS DO HISTÓRICO GIT  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se git-filter-repo está instalado
$filterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue
if (-not $filterRepo) {
    Write-Host "[AVISO] git-filter-repo não encontrado. Instalando via pip..." -ForegroundColor Yellow
    pip install git-filter-repo
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar git-filter-repo. Instale manualmente:" -ForegroundColor Red
        Write-Host "  pip install git-filter-repo" -ForegroundColor White
        Write-Host "  OU" -ForegroundColor White
        Write-Host "  choco install git-filter-repo" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "[1/5] Verificando arquivos sensíveis no histórico..." -ForegroundColor Yellow

# Lista de padrões de arquivos sensíveis
$sensitivePatterns = @(
    "ssh-key-2025-12-11.key",
    "*.key",
    "*.pem",
    "id_rsa*",
    "gcs-credentials.json",
    "service-account*.json"
)

Write-Host ""
Write-Host "[2/5] Criando backup do repositório..." -ForegroundColor Yellow
$backupDir = "..\pub-system-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -Path "." -Destination $backupDir -Recurse -Force
Write-Host "  Backup criado em: $backupDir" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Removendo arquivos sensíveis do histórico..." -ForegroundColor Yellow

# Remover arquivo específico da SSH key
Write-Host "  Removendo ssh-key-2025-12-11.key..." -ForegroundColor White
git filter-repo --path ssh-key-2025-12-11.key --invert-paths --force 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Arquivo removido do histórico" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Arquivo pode já ter sido removido ou não existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/5] Limpando referências e garbage collection..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "[5/5] Verificando resultado..." -ForegroundColor Yellow
$remaining = git log --all --full-history -- "ssh-key-2025-12-11.key" --oneline 2>$null
if ($remaining) {
    Write-Host "  [AVISO] Ainda existem referências no histórico" -ForegroundColor Yellow
    Write-Host $remaining
} else {
    Write-Host "  [OK] Nenhuma referência encontrada no histórico" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS MANUAIS OBRIGATÓRIOS  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. FORCE PUSH para o repositório remoto:" -ForegroundColor Yellow
Write-Host "   git push origin main --force" -ForegroundColor White
Write-Host ""
Write-Host "2. REVOGAR a chave SSH no servidor Oracle VM:" -ForegroundColor Yellow
Write-Host "   ssh ubuntu@134.65.248.235" -ForegroundColor White
Write-Host "   nano ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "   # Remover a linha da chave comprometida" -ForegroundColor Gray
Write-Host ""
Write-Host "3. GERAR nova chave SSH:" -ForegroundColor Yellow
Write-Host "   ssh-keygen -t ed25519 -C 'pub-system-deploy'" -ForegroundColor White
Write-Host "   # Adicionar nova chave ao servidor" -ForegroundColor Gray
Write-Host ""
Write-Host "4. NOTIFICAR colaboradores para re-clonar:" -ForegroundColor Yellow
Write-Host "   O histórico foi reescrito. Todos devem:" -ForegroundColor White
Write-Host "   git clone <repo-url> pub-system-fresh" -ForegroundColor White
Write-Host ""
Write-Host "5. SCAN de secrets adicional:" -ForegroundColor Yellow
Write-Host "   gitleaks detect --source . --verbose" -ForegroundColor White
Write-Host ""
Write-Host "[CONCLUÍDO] Script de limpeza finalizado." -ForegroundColor Green
