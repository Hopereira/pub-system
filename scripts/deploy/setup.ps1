#!/usr/bin/env pwsh

# ====================================================
# Script de Setup Completo do Pub System
# ====================================================

Write-Host "🚀 Iniciando configuração do Pub System..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar pré-requisitos
Write-Host "PASSO 1: Verificando pré-requisitos..." -ForegroundColor Yellow
Write-Host ""

.\verify-setup.ps1

Write-Host ""
Read-Host "Pressione ENTER para continuar com o setup (ou Ctrl+C para cancelar)"

# 2. Configurar .env se não existir
Write-Host ""
Write-Host "PASSO 2: Configurando arquivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado a partir do .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Edite o arquivo .env e ajuste as configurações!" -ForegroundColor Yellow
        Write-Host ""
        
        $editNow = Read-Host "Deseja editar o .env agora? (s/n)"
        if ($editNow -eq "s" -or $editNow -eq "S") {
            notepad .env
        }
    } else {
        Write-Host "❌ Arquivo .env.example não encontrado" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# 3. Verificar credenciais GCS
Write-Host ""
Write-Host "PASSO 3: Configurando Google Cloud Storage..." -ForegroundColor Yellow
if (-not (Test-Path "backend/gcs-credentials.json")) {
    Write-Host "❌ Credenciais GCS não encontradas" -ForegroundColor Red
    Write-Host ""
    Write-Host "Siga estes passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://console.cloud.google.com/" -ForegroundColor White
    Write-Host "2. Crie um projeto e um bucket no Cloud Storage" -ForegroundColor White
    Write-Host "3. Crie uma conta de serviço com permissão 'Storage Admin'" -ForegroundColor White
    Write-Host "4. Baixe a chave JSON da conta de serviço" -ForegroundColor White
    Write-Host "5. Salve como: backend/gcs-credentials.json" -ForegroundColor White
    Write-Host ""
    Write-Host "Consulte SETUP.md para instruções detalhadas" -ForegroundColor Yellow
    Write-Host ""
    
    $skipGCS = Read-Host "Deseja pular esta etapa por enquanto? (s/n)"
    if ($skipGCS -ne "s" -and $skipGCS -ne "S") {
        Write-Host "Configuração cancelada. Configure o GCS e execute novamente." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⚠️  Continuando sem GCS. Upload de imagens não funcionará!" -ForegroundColor Yellow
} else {
    Write-Host "✅ Credenciais GCS encontradas" -ForegroundColor Green
}

# 4. Instalar dependências
Write-Host ""
Write-Host "PASSO 4: Instalando dependências..." -ForegroundColor Yellow

$installDeps = Read-Host "Deseja instalar as dependências do Node.js? (s/n)"
if ($installDeps -eq "s" -or $installDeps -eq "S") {
    Write-Host "Instalando dependências do backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Set-Location ..
    
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "⏭️  Pulando instalação de dependências" -ForegroundColor Yellow
}

# 5. Iniciar Docker
Write-Host ""
Write-Host "PASSO 5: Iniciando containers Docker..." -ForegroundColor Yellow

$startDocker = Read-Host "Deseja iniciar os containers Docker? (s/n)"
if ($startDocker -eq "s" -or $startDocker -eq "S") {
    Write-Host "Parando containers antigos..." -ForegroundColor Cyan
    docker-compose down
    
    Write-Host "Iniciando containers..." -ForegroundColor Cyan
    docker-compose up -d --build
    
    Write-Host "Aguardando containers iniciarem..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
    
    Write-Host "✅ Containers iniciados" -ForegroundColor Green
    docker-compose ps
} else {
    Write-Host "⏭️  Pulando inicialização do Docker" -ForegroundColor Yellow
}

# 6. Executar migrations
Write-Host ""
Write-Host "PASSO 6: Executando migrations do banco de dados..." -ForegroundColor Yellow

$runMigrations = Read-Host "Deseja executar as migrations agora? (s/n)"
if ($runMigrations -eq "s" -or $runMigrations -eq "S") {
    Write-Host "Aguardando banco de dados ficar pronto..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    Write-Host "Executando migrations..." -ForegroundColor Cyan
    docker-compose exec backend npm run typeorm:migration:run
    
    Write-Host "✅ Migrations executadas" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations NÃO executadas. Execute manualmente:" -ForegroundColor Yellow
    Write-Host "   docker-compose exec backend npm run typeorm:migration:run" -ForegroundColor White
}

# 7. Resumo final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse os serviços:" -ForegroundColor Cyan
Write-Host "🌐 Frontend:  http://localhost:3001" -ForegroundColor White
Write-Host "🔌 Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "🗄️  PgAdmin:   http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Credenciais padrão (ajuste no .env):" -ForegroundColor Cyan
Write-Host "📧 Email:  admin@admin.com" -ForegroundColor White
Write-Host "🔑 Senha:  admin123" -ForegroundColor White
Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor Cyan
Write-Host "Ver logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "Parar:          docker-compose down" -ForegroundColor White
Write-Host "Reiniciar:      docker-compose restart" -ForegroundColor White
Write-Host "Reconstruir:    docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "📚 Consulte SETUP.md para mais informações" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
