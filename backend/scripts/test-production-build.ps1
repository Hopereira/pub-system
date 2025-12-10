# ========================================
# Teste de Build de Producao - PUB SYSTEM
# Valida que o sistema compila para producao
# ========================================

$ErrorActionPreference = "Stop"
$BackendDir = "$PSScriptRoot\.."
$FrontendDir = "$PSScriptRoot\..\..\frontend"
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
Write-Host "  TESTE DE BUILD DE PRODUCAO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Verificar package.json do backend
Write-Host "Teste 1: Verificando package.json do backend..." -ForegroundColor Yellow
$backendPackage = Get-Content "$BackendDir\package.json" | ConvertFrom-Json
$hasBuildScript = $backendPackage.scripts.build -ne $null
Write-TestResult "Backend tem script de build" $hasBuildScript $backendPackage.scripts.build

# Teste 2: Verificar package.json do frontend
Write-Host "Teste 2: Verificando package.json do frontend..." -ForegroundColor Yellow
$frontendPackage = Get-Content "$FrontendDir\package.json" | ConvertFrom-Json
$hasFrontendBuild = $frontendPackage.scripts.build -ne $null
Write-TestResult "Frontend tem script de build" $hasFrontendBuild $frontendPackage.scripts.build

# Teste 3: Verificar tsconfig do backend
Write-Host "Teste 3: Verificando tsconfig do backend..." -ForegroundColor Yellow
$hasTsConfig = Test-Path "$BackendDir\tsconfig.json"
Write-TestResult "Backend tem tsconfig.json" $hasTsConfig

# Teste 4: Verificar .env.example
Write-Host "Teste 4: Verificando .env.example..." -ForegroundColor Yellow
$hasEnvExample = Test-Path "$BackendDir\.env.example"
Write-TestResult "Backend tem .env.example" $hasEnvExample

# Teste 5: Build do backend (dry run - apenas verificar compilacao)
Write-Host "Teste 5: Testando compilacao do backend..." -ForegroundColor Yellow
Write-Host "       (Isso pode levar alguns segundos...)" -ForegroundColor Gray
Push-Location $BackendDir
try {
    $buildOutput = npm run build 2>&1
    $buildSuccess = $LASTEXITCODE -eq 0
    Write-TestResult "Backend compila sem erros" $buildSuccess
    
    if (!$buildSuccess) {
        Write-Host "       Erros de compilacao:" -ForegroundColor Red
        $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-Host "       $_" -ForegroundColor Red }
    }
} catch {
    Write-TestResult "Backend compila sem erros" $false $_.Exception.Message
}
Pop-Location

# Teste 6: Verificar se dist foi criado
Write-Host "Teste 6: Verificando pasta dist..." -ForegroundColor Yellow
$hasDistFolder = Test-Path "$BackendDir\dist"
$distFileCount = if ($hasDistFolder) { (Get-ChildItem "$BackendDir\dist" -Recurse -File).Count } else { 0 }
Write-TestResult "Pasta dist criada" $hasDistFolder "$distFileCount arquivos"

# Teste 7: Verificar main.js no dist
Write-Host "Teste 7: Verificando main.js..." -ForegroundColor Yellow
$hasMainJs = Test-Path "$BackendDir\dist\main.js"
Write-TestResult "main.js existe no dist" $hasMainJs

# Teste 8: Verificar variaveis de ambiente criticas
Write-Host "Teste 8: Verificando variaveis de ambiente..." -ForegroundColor Yellow
$envExample = Get-Content "$BackendDir\.env.example" -Raw -ErrorAction SilentlyContinue
$hasJwtSecret = $envExample -match "JWT_SECRET"
$hasDbConfig = $envExample -match "DB_HOST"
$hasFrontendUrl = $envExample -match "FRONTEND_URL"
$allEnvVars = $hasJwtSecret -and $hasDbConfig -and $hasFrontendUrl
Write-TestResult "Variaveis de ambiente documentadas" $allEnvVars "JWT_SECRET, DB_HOST, FRONTEND_URL"

# Teste 9: Verificar Dockerfile
Write-Host "Teste 9: Verificando Dockerfile..." -ForegroundColor Yellow
$hasDockerfile = Test-Path "$BackendDir\Dockerfile"
Write-TestResult "Dockerfile existe" $hasDockerfile

# Teste 10: Verificar docker-compose
Write-Host "Teste 10: Verificando docker-compose..." -ForegroundColor Yellow
$hasDockerCompose = Test-Path "$BackendDir\..\docker-compose.yml"
Write-TestResult "docker-compose.yml existe" $hasDockerCompose

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
    Write-Host "BUILD DE PRODUCAO VALIDADO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar em producao:" -ForegroundColor Yellow
    Write-Host "  cd backend && npm run start:prod" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "ALGUNS TESTES FALHARAM!" -ForegroundColor Red
    exit 1
}
