# Script para executar a migration de avaliações
# Data: 04/11/2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION: Sistema de Avaliação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se o Docker está rodando
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker está rodando" -ForegroundColor Green
Write-Host ""

# Verifica se o container do backend está rodando
Write-Host "2. Verificando container do backend..." -ForegroundColor Yellow
$backendContainer = docker ps --filter "name=pub_system_backend" --format "{{.Names}}"
if ([string]::IsNullOrEmpty($backendContainer)) {
    Write-Host "❌ Container do backend não está rodando!" -ForegroundColor Red
    Write-Host "Execute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Container do backend encontrado: $backendContainer" -ForegroundColor Green
Write-Host ""

# Executa a migration
Write-Host "3. Executando migration..." -ForegroundColor Yellow
Write-Host "   Migration: 1730739700000-CreateAvaliacaoTable" -ForegroundColor Cyan
Write-Host ""

docker-compose exec backend npm run typeorm:migration:run

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ MIGRATION EXECUTADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Registrar AvaliacaoModule no app.module.ts" -ForegroundColor White
    Write-Host "   2. Reiniciar o backend: docker-compose restart backend" -ForegroundColor White
    Write-Host "   3. Testar o sistema de avaliação" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentação:" -ForegroundColor Cyan
    Write-Host "   SISTEMA_AVALIACAO_SATISFACAO.md" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ ERRO AO EXECUTAR MIGRATION!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Migration já foi executada" -ForegroundColor White
    Write-Host "   - Erro de conexão com o banco" -ForegroundColor White
    Write-Host "   - Erro de sintaxe na migration" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Soluções:" -ForegroundColor Yellow
    Write-Host "   1. Verifique os logs: docker-compose logs backend" -ForegroundColor White
    Write-Host "   2. Verifique o banco de dados" -ForegroundColor White
    Write-Host "   3. Reverta a migration se necessário: npm run migration:revert" -ForegroundColor White
    Write-Host ""
}

Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
