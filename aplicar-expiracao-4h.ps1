# ⏰ Script para Aplicar Expiração de Token de 4 Horas
# Data: 13/11/2025

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   APLICAR EXPIRAÇÃO DE TOKEN JWT (4 HORAS)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    Write-Host "   Diretório atual: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Resumo da Alteração:" -ForegroundColor Yellow
Write-Host "   - Arquivo: backend/src/auth/auth.module.ts" -ForegroundColor White
Write-Host "   - Linha 19: expiresIn: '1h' → '4h'" -ForegroundColor White
Write-Host "   - Funcionários precisarão fazer login a cada 4 horas" -ForegroundColor White
Write-Host ""

# Verificar se a mudança foi aplicada
Write-Host "🔍 Verificando configuração atual..." -ForegroundColor Yellow
$authModule = Get-Content "backend\src\auth\auth.module.ts" -Raw

if ($authModule -match "expiresIn:\s*'4h'") {
    Write-Host "   ✅ Configuração encontrada: expiresIn: '4h'" -ForegroundColor Green
} elseif ($authModule -match "expiresIn:\s*'1h'") {
    Write-Host "   ❌ Configuração antiga ainda presente: expiresIn: '1h'" -ForegroundColor Red
    Write-Host "   Por favor, verifique se a alteração foi salva corretamente" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "   ⚠️  Não foi possível verificar a configuração" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🐳 Reiniciando container do backend..." -ForegroundColor Yellow

# Verificar se Docker está rodando
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Docker não está rodando" -ForegroundColor Red
    Write-Host "   Inicie o Docker Desktop e tente novamente" -ForegroundColor Yellow
    exit 1
}

# Reiniciar apenas o backend
Write-Host "   Parando backend..." -ForegroundColor White
docker-compose stop backend 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend parado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Aviso ao parar backend" -ForegroundColor Yellow
}

Write-Host "   Iniciando backend..." -ForegroundColor White
docker-compose up -d backend 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend iniciado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao iniciar backend" -ForegroundColor Red
    exit 1
}

# Aguardar backend inicializar
Write-Host ""
Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar se backend está saudável
Write-Host "🏥 Verificando saúde do backend..." -ForegroundColor Yellow
$backendStatus = docker ps --filter "name=pub_system_backend" --format "{{.Status}}"

if ($backendStatus -match "Up") {
    Write-Host "   ✅ Backend está rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend não está rodando corretamente" -ForegroundColor Red
    Write-Host "   Status: $backendStatus" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✅ CONFIGURAÇÃO APLICADA COM SUCESSO!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. ✅ Configuração de 4h está ativa" -ForegroundColor White
Write-Host "   2. 🔄 Usuários ativos ainda podem ter token antigo (1h)" -ForegroundColor White
Write-Host "   3. 🆕 Novos logins receberão token de 4h" -ForegroundColor White
Write-Host "   4. 🧪 Teste fazendo novo login" -ForegroundColor White
Write-Host ""

Write-Host "🔗 URLs do Sistema:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "📄 Documentação completa:" -ForegroundColor Yellow
Write-Host "   CONFIGURACAO_EXPIRACAO_TOKEN.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Script concluído!" -ForegroundColor Green
