# Reset Completo do Pub System
# Este script para, remove e recria tudo do zero

Write-Host "🔄 RESET COMPLETO DO PUB SYSTEM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Confirmar ação
$confirmacao = Read-Host "⚠️  ATENÇÃO: Isso vai APAGAR TODO O BANCO DE DADOS e builds. Continuar? (S/N)"
if ($confirmacao -ne "S" -and $confirmacao -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📦 Passo 1/6: Parando todos os containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "🗑️  Passo 2/6: Removendo volumes (banco de dados)..." -ForegroundColor Yellow
docker volume rm pub-system_postgres_data 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Volume do banco removido" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Volume não existia ou já foi removido" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🧹 Passo 3/6: Limpando caches do Docker..." -ForegroundColor Yellow
docker system prune -f

Write-Host ""
Write-Host "🏗️  Passo 4/6: Removendo builds antigos..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host ""
Write-Host "🚀 Passo 5/6: Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "⏳ Passo 6/6: Aguardando backend inicializar (60s)..." -ForegroundColor Yellow
Write-Host "   O seeder será executado automaticamente..." -ForegroundColor Gray

# Contador visual
for ($i = 60; $i -gt 0; $i--) {
    Write-Host -NoNewline "`r   Aguardando... $i segundos restantes  "
    Start-Sleep -Seconds 1
}
Write-Host "`r   ✅ Tempo de espera concluído!                    " -ForegroundColor Green

Write-Host ""
Write-Host "📊 Verificando status dos containers..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "pub_system"

Write-Host ""
Write-Host "✅ RESET COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Dados criados pelo seeder:" -ForegroundColor Cyan
Write-Host "   • 8 Ambientes (5 preparo + 3 atendimento)" -ForegroundColor White
Write-Host "   • 22 Mesas distribuídas" -ForegroundColor White
Write-Host "   • 42 Produtos variados" -ForegroundColor White
Write-Host "   • 5 Clientes com CPF válido" -ForegroundColor White
Write-Host "   • 5 Comandas abertas (4 com mesa + 1 balcão)" -ForegroundColor White
Write-Host "   • 1 Admin: admin@admin.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs do Sistema:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   • Swagger:  http://localhost:3000/api" -ForegroundColor White
Write-Host "   • PgAdmin:  http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Credenciais:" -ForegroundColor Cyan
Write-Host "   • Admin: admin@admin.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para verificar logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "   docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Pronto para testar!" -ForegroundColor Green
