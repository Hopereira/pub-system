# Script para Instalar Dependências - Pub System
# Data: 23/10/2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalando Dependências - Pub System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ ERRO: Execute este script no diretório raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Instalar dependências do Backend
Write-Host "📦 Instalando dependências do Backend..." -ForegroundColor Yellow
Set-Location backend

if (Test-Path "package.json") {
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências do Backend instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar dependências do Backend!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "❌ package.json não encontrado no backend!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Instalar dependências do Frontend
Write-Host ""
Write-Host "📦 Instalando dependências do Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "package.json") {
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências do Frontend instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar dependências do Frontend!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "❌ package.json não encontrado no frontend!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Instalação Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Configure o arquivo .env no backend" -ForegroundColor White
Write-Host "     - Adicione: FRONTEND_URL=http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Execute as migrations:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm run typeorm:migration:run" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Inicie o backend:" -ForegroundColor White
Write-Host "     npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Em outro terminal, inicie o frontend:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentação das correções:" -ForegroundColor Yellow
Write-Host "  - CORRECOES_REALIZADAS.md" -ForegroundColor White
Write-Host "  - ANALISE_BUGS_E_PROBLEMAS.md" -ForegroundColor White
Write-Host "  - PLANO_CORRECAO_BUGS.md" -ForegroundColor White
Write-Host ""
