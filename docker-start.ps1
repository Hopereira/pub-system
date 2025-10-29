# Script para iniciar containers Docker (uso diário)
# Uso: .\docker-start.ps1

Write-Host "🐳 Iniciando Containers Docker..." -ForegroundColor Cyan
Write-Host ""

# Verificar se .dockerignore existe
if (-not (Test-Path "backend\.dockerignore")) {
    Write-Host "⚠️  Aviso: backend\.dockerignore não encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando arquivo para evitar problemas com node_modules..." -ForegroundColor Yellow
    "node_modules`ndist`n.env.local" | Out-File -FilePath "backend\.dockerignore" -Encoding UTF8
}

if (-not (Test-Path "frontend\.dockerignore")) {
    Write-Host "⚠️  Aviso: frontend\.dockerignore não encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando arquivo para evitar problemas com node_modules..." -ForegroundColor Yellow
    "node_modules`n.next`nout`n.env.local" | Out-File -FilePath "frontend\.dockerignore" -Encoding UTF8
}

# Subir containers
Write-Host "🚀 Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar alguns segundos
Write-Host "⏳ Aguardando inicialização..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Mostrar status
Write-Host ""
Write-Host "✅ Containers iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📝 Para ver os logs em tempo real:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Aplicação disponível em:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "   PgAdmin:  http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Para parar: docker-compose down" -ForegroundColor Gray
