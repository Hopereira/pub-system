# ====================================================
# Script de Verificação de Configuração do Pub System
# ====================================================

Write-Host "🔍 Verificando configuração do Pub System..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. Verificar arquivo .env
Write-Host "1. Verificando arquivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
    
    # Verificar variáveis críticas
    $envContent = Get-Content ".env" -Raw
    
    $criticalVars = @(
        "DB_HOST",
        "DB_PASSWORD",
        "JWT_SECRET",
        "GCS_BUCKET_NAME",
        "GOOGLE_APPLICATION_CREDENTIALS"
    )
    
    foreach ($var in $criticalVars) {
        if ($envContent -match "$var=.+") {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var NÃO encontrado ou vazio" -ForegroundColor Red
            $errors++
        }
    }
    
    # Verificar se JWT_SECRET é forte
    if ($envContent -match "JWT_SECRET=(.+)") {
        $secret = $matches[1].Trim()
        if ($secret.Length -lt 32) {
            Write-Host "   ⚠️  JWT_SECRET deve ter pelo menos 32 caracteres" -ForegroundColor Yellow
            $warnings++
        }
        if ($secret -eq "sua-chave-secreta-jwt-aqui" -or $secret -match "exemplo|example|teste|test") {
            Write-Host "   ⚠️  JWT_SECRET parece ser um valor de exemplo. Troque em produção!" -ForegroundColor Yellow
            $warnings++
        }
    }
} else {
    Write-Host "   ❌ Arquivo .env NÃO encontrado" -ForegroundColor Red
    Write-Host "   💡 Copie .env.example para .env e ajuste os valores" -ForegroundColor Cyan
    $errors++
}

Write-Host ""

# 2. Verificar credenciais GCS
Write-Host "2. Verificando credenciais Google Cloud Storage..." -ForegroundColor Yellow
if (Test-Path "backend/gcs-credentials.json") {
    Write-Host "   ✅ Arquivo gcs-credentials.json encontrado" -ForegroundColor Green
    
    # Verificar se é um JSON válido
    try {
        $gcsContent = Get-Content "backend/gcs-credentials.json" -Raw | ConvertFrom-Json
        if ($gcsContent.type -eq "service_account") {
            Write-Host "   ✅ Credenciais válidas (service_account)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Tipo de credencial desconhecido" -ForegroundColor Yellow
            $warnings++
        }
    } catch {
        Write-Host "   ❌ Arquivo JSON inválido" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ❌ Arquivo gcs-credentials.json NÃO encontrado" -ForegroundColor Red
    Write-Host "   💡 Siga o guia SETUP.md para criar e configurar as credenciais GCS" -ForegroundColor Cyan
    $errors++
}

Write-Host ""

# 3. Verificar Docker
Write-Host "3. Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "   ✅ Docker instalado" -ForegroundColor Green
    
    # Verificar se Docker está rodando
    try {
        docker ps | Out-Null
        Write-Host "   ✅ Docker está rodando" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Docker não está rodando. Inicie o Docker Desktop" -ForegroundColor Yellow
        $warnings++
    }
} catch {
    Write-Host "   ❌ Docker não encontrado" -ForegroundColor Red
    Write-Host "   💡 Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    $errors++
}

Write-Host ""

# 4. Verificar Node.js
Write-Host "4. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    
    # Verificar versão mínima (16.x)
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -lt 16) {
            Write-Host "   ⚠️  Node.js versão $majorVersion é antiga. Recomendado: v16 ou superior" -ForegroundColor Yellow
            $warnings++
        }
    }
} catch {
    Write-Host "   ❌ Node.js não encontrado" -ForegroundColor Red
    Write-Host "   💡 Instale o Node.js: https://nodejs.org/" -ForegroundColor Cyan
    $errors++
}

Write-Host ""

# 5. Verificar estrutura de pastas
Write-Host "5. Verificando estrutura do projeto..." -ForegroundColor Yellow
$requiredDirs = @("backend", "frontend", "backend/src", "frontend/src")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "   ✅ Pasta $dir encontrada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Pasta $dir NÃO encontrada" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# 6. Verificar migrations
Write-Host "6. Verificando migrations..." -ForegroundColor Yellow
if (Test-Path "backend/src/database/migrations") {
    $migrations = Get-ChildItem "backend/src/database/migrations" -Filter "*.ts"
    if ($migrations.Count -gt 0) {
        Write-Host "   ✅ $($migrations.Count) migration(s) encontrada(s)" -ForegroundColor Green
        Write-Host "   💡 Execute: docker-compose exec backend npm run typeorm:migration:run" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Nenhuma migration encontrada" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "   ❌ Pasta de migrations não encontrada" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Resumo
if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ TUDO CONFIGURADO CORRETAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. docker-compose up -d" -ForegroundColor White
    Write-Host "2. docker-compose exec backend npm run typeorm:migration:run" -ForegroundColor White
    Write-Host "3. Acesse http://localhost:3001 (Frontend)" -ForegroundColor White
} elseif ($errors -eq 0) {
    Write-Host "⚠️  CONFIGURAÇÃO OK, MAS COM AVISOS ($warnings)" -ForegroundColor Yellow
    Write-Host "Revise os avisos acima antes de continuar" -ForegroundColor Yellow
} else {
    Write-Host "❌ ERROS ENCONTRADOS: $errors" -ForegroundColor Red
    Write-Host "⚠️  AVISOS: $warnings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os erros acima antes de continuar." -ForegroundColor Red
    Write-Host "Consulte o arquivo SETUP.md para mais detalhes." -ForegroundColor Cyan
}

Write-Host "========================================" -ForegroundColor Cyan
