# Script para executar migration de tempo de preparo
# Data: 04/11/2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION: Tempo de Preparo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Executando migration no container Docker..." -ForegroundColor Yellow
Write-Host ""

# Executa migration dentro do container
docker-compose exec backend npm run typeorm:migration:run

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration executada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Novos campos adicionados:" -ForegroundColor Cyan
    Write-Host "  - iniciadoEm (timestamp)" -ForegroundColor White
    Write-Host "  - prontoEm (timestamp)" -ForegroundColor White
    Write-Host "  - entregueEm (timestamp)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Testar criação de pedido" -ForegroundColor White
    Write-Host "  2. Iniciar preparo e verificar timestamp" -ForegroundColor White
    Write-Host "  3. Marcar como pronto e verificar tempo" -ForegroundColor White
    Write-Host "  4. Verificar dashboard com tempo médio" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro ao executar migration!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
