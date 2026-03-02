# Script para reconstruir containers Docker com dependências limpas
# Uso: .\docker-rebuild.ps1

Write-Host "🐳 Reconstruindo Containers Docker..." -ForegroundColor Cyan
Write-Host ""

# 1. Parar containers
Write-Host "⏹️  Parando containers..." -ForegroundColor Yellow
docker-compose down

# 2. Remover node_modules locais (opcional, mas recomendado)
Write-Host "🗑️  Removendo node_modules locais (se existirem)..." -ForegroundColor Yellow
Remove-Item -Recurse -Force backend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue

# 3. Reconstruir imagens sem cache
Write-Host "🔨 Reconstruindo imagens Docker..." -ForegroundColor Yellow
docker-compose build --no-cache

# 4. Subir containers
Write-Host "🚀 Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d

# 5. Aguardar alguns segundos
Write-Host "⏳ Aguardando inicialização..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 6. Mostrar status
Write-Host ""
Write-Host "✅ Containers reconstruídos e iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📝 Para ver os logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "   docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Aplicação disponível em:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "   PgAdmin:  http://localhost:8080" -ForegroundColor Gray
