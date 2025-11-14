# Script de teste dos endpoints de medalhas
Write-Host "🧪 Testando Sistema de Medalhas" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1️⃣ Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@admin.com"
    senha = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
    $token = $loginResponse.access_token
    Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))...`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Buscar ranking
Write-Host "2️⃣ Buscando ranking de garçons..." -ForegroundColor Yellow
try {
    $ranking = Invoke-RestMethod -Uri 'http://localhost:3000/analytics/garcons/ranking?periodo=hoje' -Method GET -Headers $headers
    Write-Host "✅ Ranking obtido: $($ranking.ranking.Count) garçons" -ForegroundColor Green
    $ranking.ranking | ForEach-Object {
        Write-Host "   #$($_.posicao) - $($_.funcionarioNome) - $($_.pontos) pontos" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar ranking: $_" -ForegroundColor Red
}

# 3. Buscar medalhas de um garçom
Write-Host "3️⃣ Buscando medalhas do garçom..." -ForegroundColor Yellow
$garcomId = "a3a3158c-72d6-4291-bcb1-b26e9f1de2d6" # hop
try {
    $medalhas = Invoke-RestMethod -Uri "http://localhost:3000/medalhas/garcom/$garcomId" -Method GET -Headers $headers
    Write-Host "✅ Medalhas encontradas: $($medalhas.Count)" -ForegroundColor Green
    $medalhas | ForEach-Object {
        Write-Host "   $($_.icone) $($_.nome) ($($_.nivel)) - Conquistada em: $($_.conquistadaEm)" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar medalhas: $_" -ForegroundColor Red
}

# 4. Buscar progresso de medalhas
Write-Host "4️⃣ Buscando progresso de medalhas..." -ForegroundColor Yellow
try {
    $progresso = Invoke-RestMethod -Uri "http://localhost:3000/medalhas/garcom/$garcomId/progresso" -Method GET -Headers $headers
    Write-Host "✅ Progresso obtido:" -ForegroundColor Green
    Write-Host "   Conquistadas: $($progresso.medalhasConquistadas)/$($progresso.totalMedalhas)" -ForegroundColor White
    Write-Host "   Próximas conquistas:" -ForegroundColor White
    $progresso.proximasConquistas | Select-Object -First 3 | ForEach-Object {
        Write-Host "   - $($_.medalha.icone) $($_.medalha.nome): $($_.progresso.ToString('0.0'))% (faltam $($_.faltam))" -ForegroundColor Cyan
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar progresso: $_" -ForegroundColor Red
}

# 5. Verificar novas medalhas
Write-Host "5️⃣ Verificando novas medalhas..." -ForegroundColor Yellow
try {
    $novas = Invoke-RestMethod -Uri "http://localhost:3000/medalhas/garcom/$garcomId/verificar" -Method GET -Headers $headers
    if ($novas.Count -gt 0) {
        Write-Host "🎉 Novas medalhas conquistadas: $($novas.Count)" -ForegroundColor Green
        $novas | ForEach-Object {
            Write-Host "   $($_.icone) $($_.nome) ($($_.nivel))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Nenhuma nova medalha (já verificadas)" -ForegroundColor Green
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao verificar medalhas: $_" -ForegroundColor Red
}

# 6. Buscar estatísticas
Write-Host "6️⃣ Buscando estatísticas do garçom..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/analytics/garcons/$garcomId/estatisticas?periodo=hoje" -Method GET -Headers $headers
    Write-Host "✅ Estatísticas obtidas:" -ForegroundColor Green
    Write-Host "   Total de entregas: $($stats.totalEntregas)" -ForegroundColor White
    Write-Host "   Tempo médio: $($stats.tempoMedioReacaoMinutos.ToString('0.00')) min" -ForegroundColor White
    Write-Host "   SLA: $($stats.percentualSLA)%" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar estatísticas: $_" -ForegroundColor Red
}

Write-Host "`n🎯 Testes concluídos!" -ForegroundColor Cyan
