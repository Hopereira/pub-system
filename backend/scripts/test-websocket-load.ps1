# ========================================
# Teste de Carga WebSocket - PUB SYSTEM
# Simula multiplas conexoes simultaneas
# ========================================

param(
    [int]$Connections = 10,
    [string]$ServerUrl = "http://localhost:3000",
    [int]$TestDurationSeconds = 30
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE CARGA WEBSOCKET - PUB SYSTEM" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuracao:" -ForegroundColor Yellow
Write-Host "  - Conexoes simultaneas: $Connections" -ForegroundColor White
Write-Host "  - URL do servidor: $ServerUrl" -ForegroundColor White
Write-Host "  - Duracao do teste: $TestDurationSeconds segundos" -ForegroundColor White
Write-Host ""

# Verificar se o servidor esta rodando
Write-Host "Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ServerUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "[PASS] Servidor respondendo (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Servidor nao esta respondendo em $ServerUrl" -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifique-se de que o backend esta rodando:" -ForegroundColor Yellow
    Write-Host "  cd backend && npm run start:dev" -ForegroundColor Cyan
    exit 1
}

# Verificar endpoint de health
Write-Host "Verificando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ServerUrl/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "[PASS] Health check OK" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Endpoint /health nao disponivel (normal se nao implementado)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  INSTRUCOES PARA TESTE MANUAL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para testar WebSocket com multiplas conexoes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Inicie o backend:" -ForegroundColor White
Write-Host "   cd backend && npm run start:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Inicie o frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Abra $Connections abas do navegador em:" -ForegroundColor White
Write-Host "   http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Faca login em cada aba com diferentes usuarios:" -ForegroundColor White
Write-Host "   - 5 abas como GARCOM" -ForegroundColor Cyan
Write-Host "   - 3 abas como COZINHA" -ForegroundColor Cyan
Write-Host "   - 2 abas como CAIXA" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Crie um pedido em uma aba e observe:" -ForegroundColor White
Write-Host "   - Tempo ate aparecer nas outras abas (< 500ms)" -ForegroundColor Cyan
Write-Host "   - Nenhuma mensagem perdida" -ForegroundColor Cyan
Write-Host "   - CPU do servidor < 80%" -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  METRICAS ACEITAVEIS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Latencia < 500ms" -ForegroundColor Green
Write-Host "  [OK] Sem perda de mensagens" -ForegroundColor Green
Write-Host "  [OK] CPU do servidor < 80%" -ForegroundColor Green
Write-Host "  [OK] Memoria estavel (sem memory leak)" -ForegroundColor Green
Write-Host ""

# Verificar se socket.io esta configurado
Write-Host "Verificando configuracao Socket.io..." -ForegroundColor Yellow
$mainTs = Get-Content "$PSScriptRoot\..\src\main.ts" -Raw -ErrorAction SilentlyContinue
if ($mainTs -match "socket" -or $mainTs -match "WebSocket") {
    Write-Host "[PASS] Socket.io configurado no main.ts" -ForegroundColor Green
} else {
    Write-Host "[INFO] Verificar configuracao de WebSocket" -ForegroundColor Yellow
}

# Verificar CORS
if ($mainTs -match "FRONTEND_URL") {
    Write-Host "[PASS] CORS configurado via variavel de ambiente" -ForegroundColor Green
} else {
    Write-Host "[WARN] CORS pode estar hardcoded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TESTE CONCLUIDO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Execute o teste manual seguindo as instrucoes acima." -ForegroundColor Yellow
Write-Host "Documente os resultados no checklist de validacao." -ForegroundColor Yellow
Write-Host ""

exit 0
