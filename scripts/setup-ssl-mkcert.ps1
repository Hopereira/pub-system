# Script para gerar certificados SSL locais com mkcert
# Pré-requisito: mkcert instalado (choco install mkcert ou scoop install mkcert)

$certsDir = Join-Path $PSScriptRoot "..\backend\certs"

# Criar diretório de certificados
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
    Write-Host "📁 Diretório de certificados criado: $certsDir" -ForegroundColor Green
}

# Verificar se mkcert está instalado
$mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
if (-not $mkcert) {
    Write-Host "❌ mkcert não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com um dos comandos:" -ForegroundColor Yellow
    Write-Host "  choco install mkcert" -ForegroundColor Cyan
    Write-Host "  scoop install mkcert" -ForegroundColor Cyan
    exit 1
}

# Instalar CA raiz (uma vez)
Write-Host "🔐 Instalando CA raiz local..." -ForegroundColor Cyan
mkcert -install

# Gerar certificados
Write-Host "📜 Gerando certificados para *.pubsystem.test..." -ForegroundColor Cyan
Push-Location $certsDir
mkcert "*.pubsystem.test" pubsystem.test localhost 127.0.0.1 ::1
Pop-Location

Write-Host ""
Write-Host "✅ Certificados gerados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos criados em: $certsDir" -ForegroundColor Cyan
Get-ChildItem $certsDir -Filter "*.pem" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}
Write-Host ""
Write-Host "Próximo passo: Configurar o backend para usar HTTPS" -ForegroundColor Yellow
