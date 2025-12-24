# Script de Teste Completo - Sprint 3-4
# Data: 17 Dez 2025
# Funcionalidades: Refresh Tokens, Auditoria, Rate Limiting

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🧪 TESTES E VALIDAÇÃO - SPRINT 3-4" -ForegroundColor Cyan
Write-Host "=" * 80

$baseUrl = "http://localhost:3000"
$testResults = @{
    RefreshTokens = @{ Passed = 0; Failed = 0; Tests = @() }
    Auditoria = @{ Passed = 0; Failed = 0; Tests = @() }
    RateLimiting = @{ Passed = 0; Failed = 0; Tests = @() }
}

# Função para registrar resultado de teste
function Add-TestResult {
    param(
        [string]$Category,
        [string]$TestName,
        [bool]$Passed,
        [string]$Message
    )
    
    $result = @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
        Timestamp = Get-Date -Format "HH:mm:ss"
    }
    
    $testResults[$Category].Tests += $result
    
    if ($Passed) {
        $testResults[$Category].Passed++
        Write-Host "   ✅ $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "      $Message" -ForegroundColor Gray }
    } else {
        $testResults[$Category].Failed++
        Write-Host "   ❌ $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "      $Message" -ForegroundColor Yellow }
    }
}

Write-Host "`n" + ("=" * 80)
Write-Host "PARTE 1: TESTES DE REFRESH TOKENS" -ForegroundColor Cyan
Write-Host "=" * 80

# Teste 1.1: Login e obtenção de tokens
Write-Host "`n📝 Teste 1.1: Login e obtenção de access_token + refresh_token"
try {
    $loginBody = @{
        email = "admin@pub.com"
        senha = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    if ($loginResponse.access_token -and $loginResponse.refresh_token) {
        $accessToken = $loginResponse.access_token
        $refreshToken = $loginResponse.refresh_token
        Add-TestResult -Category "RefreshTokens" -TestName "Login retorna access_token e refresh_token" -Passed $true -Message "Tokens obtidos com sucesso"
    } else {
        Add-TestResult -Category "RefreshTokens" -TestName "Login retorna access_token e refresh_token" -Passed $false -Message "Tokens não encontrados na resposta"
    }
} catch {
    Add-TestResult -Category "RefreshTokens" -TestName "Login retorna access_token e refresh_token" -Passed $false -Message $_.Exception.Message
    Write-Host "`n⚠️ Não foi possível fazer login. Verifique se o backend está rodando." -ForegroundColor Yellow
    exit 1
}

# Teste 1.2: Usar access token
Write-Host "`n📝 Teste 1.2: Usar access_token em requisição autenticada"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/produtos" `
        -Headers $headers `
        -ErrorAction Stop
    
    Add-TestResult -Category "RefreshTokens" -TestName "Access token funciona em requisição autenticada" -Passed $true -Message "Requisição autorizada com sucesso"
} catch {
    Add-TestResult -Category "RefreshTokens" -TestName "Access token funciona em requisição autenticada" -Passed $false -Message $_.Exception.Message
}

# Teste 1.3: Renovar access token usando refresh token
Write-Host "`n📝 Teste 1.3: Renovar access_token usando refresh_token"
try {
    $refreshBody = @{
        refresh_token = $refreshToken
    } | ConvertTo-Json

    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" `
        -Method POST `
        -Body $refreshBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    if ($refreshResponse.accessToken) {
        $newAccessToken = $refreshResponse.accessToken
        
        # Se houver rotação, pegar novo refresh token
        if ($refreshResponse.refreshToken) {
            $newRefreshToken = $refreshResponse.refreshToken
            Add-TestResult -Category "RefreshTokens" -TestName "Renovação com rotação de refresh_token" -Passed $true -Message "Novo access_token e refresh_token obtidos"
        } else {
            Add-TestResult -Category "RefreshTokens" -TestName "Renovação sem rotação de refresh_token" -Passed $true -Message "Novo access_token obtido"
        }
    } else {
        Add-TestResult -Category "RefreshTokens" -TestName "Renovar access_token" -Passed $false -Message "Novo access_token não encontrado"
    }
} catch {
    Add-TestResult -Category "RefreshTokens" -TestName "Renovar access_token" -Passed $false -Message $_.Exception.Message
}

# Teste 1.4: Listar sessões ativas
Write-Host "`n📝 Teste 1.4: Listar sessões ativas do usuário"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $sessions = Invoke-RestMethod -Uri "$baseUrl/auth/sessions" `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($sessions -is [Array] -and $sessions.Count -gt 0) {
        Add-TestResult -Category "RefreshTokens" -TestName "Listar sessões ativas" -Passed $true -Message "Encontradas $($sessions.Count) sessões ativas"
    } else {
        Add-TestResult -Category "RefreshTokens" -TestName "Listar sessões ativas" -Passed $false -Message "Nenhuma sessão encontrada"
    }
} catch {
    Add-TestResult -Category "RefreshTokens" -TestName "Listar sessões ativas" -Passed $false -Message $_.Exception.Message
}

# Teste 1.5: Logout (revogar refresh token)
Write-Host "`n📝 Teste 1.5: Logout e revogação de refresh_token"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $logoutBody = @{
        refresh_token = $refreshToken
    } | ConvertTo-Json

    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/auth/logout" `
        -Method POST `
        -Headers $headers `
        -Body $logoutBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Add-TestResult -Category "RefreshTokens" -TestName "Logout revoga refresh_token" -Passed $true -Message "Logout realizado com sucesso"
} catch {
    Add-TestResult -Category "RefreshTokens" -TestName "Logout revoga refresh_token" -Passed $false -Message $_.Exception.Message
}

# Teste 1.6: Tentar usar refresh token revogado
Write-Host "`n📝 Teste 1.6: Tentar usar refresh_token revogado (deve falhar)"
try {
    $refreshBody = @{
        refresh_token = $refreshToken
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" `
        -Method POST `
        -Body $refreshBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Add-TestResult -Category "RefreshTokens" -TestName "Refresh token revogado é rejeitado" -Passed $false -Message "Token revogado foi aceito (ERRO DE SEGURANÇA)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Add-TestResult -Category "RefreshTokens" -TestName "Refresh token revogado é rejeitado" -Passed $true -Message "Token revogado corretamente rejeitado (401)"
    } else {
        Add-TestResult -Category "RefreshTokens" -TestName "Refresh token revogado é rejeitado" -Passed $false -Message $_.Exception.Message
    }
}

Write-Host "`n" + ("=" * 80)
Write-Host "PARTE 2: TESTES DE AUDITORIA" -ForegroundColor Cyan
Write-Host "=" * 80

# Fazer novo login para testes de auditoria
Write-Host "`n📝 Fazendo novo login para testes de auditoria..."
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $accessToken = $loginResponse.access_token
} catch {
    Write-Host "❌ Erro ao fazer login para testes de auditoria" -ForegroundColor Red
}

# Teste 2.1: Verificar registro de login na auditoria
Write-Host "`n📝 Teste 2.1: Verificar registro de LOGIN na auditoria"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $auditLogs = Invoke-RestMethod -Uri "$baseUrl/audit?action=LOGIN&limit=5" `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($auditLogs.data -and $auditLogs.data.Count -gt 0) {
        $loginLog = $auditLogs.data | Where-Object { $_.action -eq "LOGIN" } | Select-Object -First 1
        if ($loginLog) {
            Add-TestResult -Category "Auditoria" -TestName "Login registrado na auditoria" -Passed $true -Message "Registro encontrado: $($loginLog.funcionarioEmail)"
        } else {
            Add-TestResult -Category "Auditoria" -TestName "Login registrado na auditoria" -Passed $false -Message "Nenhum registro de LOGIN encontrado"
        }
    } else {
        Add-TestResult -Category "Auditoria" -TestName "Login registrado na auditoria" -Passed $false -Message "Nenhum log de auditoria encontrado"
    }
} catch {
    Add-TestResult -Category "Auditoria" -TestName "Login registrado na auditoria" -Passed $false -Message $_.Exception.Message
}

# Teste 2.2: Tentar login com senha errada e verificar LOGIN_FAILED
Write-Host "`n📝 Teste 2.2: Verificar registro de LOGIN_FAILED na auditoria"
try {
    $wrongLoginBody = @{
        email = "admin@pub.com"
        senha = "senha_errada"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method POST `
            -Body $wrongLoginBody `
            -ContentType "application/json" `
            -ErrorAction Stop
    } catch {
        # Esperado falhar
    }

    Start-Sleep -Seconds 1

    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $auditLogs = Invoke-RestMethod -Uri "$baseUrl/audit?action=LOGIN_FAILED&limit=5" `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($auditLogs.data -and $auditLogs.data.Count -gt 0) {
        Add-TestResult -Category "Auditoria" -TestName "Login falhado registrado na auditoria" -Passed $true -Message "Tentativa falhada registrada"
    } else {
        Add-TestResult -Category "Auditoria" -TestName "Login falhado registrado na auditoria" -Passed $false -Message "Nenhum registro de LOGIN_FAILED encontrado"
    }
} catch {
    Add-TestResult -Category "Auditoria" -TestName "Login falhado registrado na auditoria" -Passed $false -Message $_.Exception.Message
}

# Teste 2.3: Verificar estatísticas de auditoria
Write-Host "`n📝 Teste 2.3: Verificar estatísticas de auditoria"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $stats = Invoke-RestMethod -Uri "$baseUrl/audit/statistics" `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($stats.totalLogs -gt 0) {
        Add-TestResult -Category "Auditoria" -TestName "Estatísticas de auditoria disponíveis" -Passed $true -Message "Total de logs: $($stats.totalLogs)"
    } else {
        Add-TestResult -Category "Auditoria" -TestName "Estatísticas de auditoria disponíveis" -Passed $false -Message "Nenhuma estatística encontrada"
    }
} catch {
    Add-TestResult -Category "Auditoria" -TestName "Estatísticas de auditoria disponíveis" -Passed $false -Message $_.Exception.Message
}

# Teste 2.4: Verificar tentativas de login falhadas
Write-Host "`n📝 Teste 2.4: Listar tentativas de login falhadas"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $failedLogins = Invoke-RestMethod -Uri "$baseUrl/audit/failed-logins?limit=10" `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($failedLogins -is [Array]) {
        Add-TestResult -Category "Auditoria" -TestName "Endpoint de logins falhados funciona" -Passed $true -Message "Encontradas $($failedLogins.Count) tentativas"
    } else {
        Add-TestResult -Category "Auditoria" -TestName "Endpoint de logins falhados funciona" -Passed $false -Message "Resposta inválida"
    }
} catch {
    Add-TestResult -Category "Auditoria" -TestName "Endpoint de logins falhados funciona" -Passed $false -Message $_.Exception.Message
}

Write-Host "`n" + ("=" * 80)
Write-Host "PARTE 3: TESTES DE RATE LIMITING" -ForegroundColor Cyan
Write-Host "=" * 80

# Teste 3.1: Testar rate limit em login (5 tentativas/15min)
Write-Host "`n📝 Teste 3.1: Testar rate limit em login (5 tentativas permitidas)"
$loginAttempts = 0
$blocked = $false

for ($i = 1; $i -le 7; $i++) {
    try {
        $wrongLoginBody = @{
            email = "test@test.com"
            senha = "wrong_password"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method POST `
            -Body $wrongLoginBody `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $loginAttempts++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $blocked = $true
            break
        }
        $loginAttempts++
    }
    
    Start-Sleep -Milliseconds 100
}

if ($blocked -and $loginAttempts -le 6) {
    Add-TestResult -Category "RateLimiting" -TestName "Rate limit em login funciona" -Passed $true -Message "Bloqueado após $loginAttempts tentativas"
} else {
    Add-TestResult -Category "RateLimiting" -TestName "Rate limit em login funciona" -Passed $false -Message "Não foi bloqueado após $loginAttempts tentativas"
}

# Teste 3.2: Verificar que admin não tem limite
Write-Host "`n📝 Teste 3.2: Verificar que admin não tem rate limit"
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $successCount = 0
    for ($i = 1; $i -le 150; $i++) {
        try {
            Invoke-RestMethod -Uri "$baseUrl/produtos?page=1&limit=5" `
                -Headers $headers `
                -ErrorAction Stop | Out-Null
            $successCount++
        } catch {
            break
        }
    }
    
    if ($successCount -ge 100) {
        Add-TestResult -Category "RateLimiting" -TestName "Admin não tem rate limit" -Passed $true -Message "$successCount requisições bem-sucedidas"
    } else {
        Add-TestResult -Category "RateLimiting" -TestName "Admin não tem rate limit" -Passed $false -Message "Bloqueado após $successCount requisições"
    }
} catch {
    Add-TestResult -Category "RateLimiting" -TestName "Admin não tem rate limit" -Passed $false -Message $_.Exception.Message
}

# Teste 3.3: Testar rate limit em endpoint público
Write-Host "`n📝 Teste 3.3: Testar rate limit em endpoint público (20 req/min)"
$publicAttempts = 0
$publicBlocked = $false

for ($i = 1; $i -le 25; $i++) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/produtos?page=1&limit=5" `
            -ErrorAction Stop | Out-Null
        $publicAttempts++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $publicBlocked = $true
            break
        }
    }
    
    Start-Sleep -Milliseconds 50
}

if ($publicBlocked -and $publicAttempts -ge 15 -and $publicAttempts -le 25) {
    Add-TestResult -Category "RateLimiting" -TestName "Rate limit em endpoint público funciona" -Passed $true -Message "Bloqueado após $publicAttempts requisições"
} else {
    Add-TestResult -Category "RateLimiting" -TestName "Rate limit em endpoint público funciona" -Passed $false -Message "Comportamento inesperado: $publicAttempts requisições"
}

Write-Host "`n" + ("=" * 80)
Write-Host "VERIFICAÇÃO DE LOGS" -ForegroundColor Cyan
Write-Host "=" * 80

Write-Host "`n📝 Verificando logs do backend..."
try {
    $logs = docker-compose logs backend --tail=50 2>$null | Select-String -Pattern "RefreshToken|Auditoria|RateLimit|Invalidando|Cache" | Select-Object -Last 20
    
    if ($logs) {
        Write-Host "`n📋 Últimos 20 logs relevantes:" -ForegroundColor Yellow
        $logs | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   Nenhum log relevante encontrado" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️ Não foi possível acessar logs do Docker" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 80)
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=" * 80

$totalPassed = $testResults.RefreshTokens.Passed + $testResults.Auditoria.Passed + $testResults.RateLimiting.Passed
$totalFailed = $testResults.RefreshTokens.Failed + $testResults.Auditoria.Failed + $testResults.RateLimiting.Failed
$totalTests = $totalPassed + $totalFailed

Write-Host "`n📊 REFRESH TOKENS:" -ForegroundColor Yellow
Write-Host "   ✅ Passou: $($testResults.RefreshTokens.Passed)" -ForegroundColor Green
Write-Host "   ❌ Falhou: $($testResults.RefreshTokens.Failed)" -ForegroundColor Red

Write-Host "`n📊 AUDITORIA:" -ForegroundColor Yellow
Write-Host "   ✅ Passou: $($testResults.Auditoria.Passed)" -ForegroundColor Green
Write-Host "   ❌ Falhou: $($testResults.Auditoria.Failed)" -ForegroundColor Red

Write-Host "`n📊 RATE LIMITING:" -ForegroundColor Yellow
Write-Host "   ✅ Passou: $($testResults.RateLimiting.Passed)" -ForegroundColor Green
Write-Host "   ❌ Falhou: $($testResults.RateLimiting.Failed)" -ForegroundColor Red

Write-Host "`n📊 TOTAL GERAL:" -ForegroundColor Cyan
Write-Host "   Total de testes: $totalTests" -ForegroundColor White
Write-Host "   ✅ Passou: $totalPassed ($([math]::Round(($totalPassed/$totalTests)*100, 2))%)" -ForegroundColor Green
Write-Host "   ❌ Falhou: $totalFailed ($([math]::Round(($totalFailed/$totalTests)*100, 2))%)" -ForegroundColor Red

if ($totalFailed -eq 0) {
    Write-Host "`n🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "✅ Sistema pronto para produção" -ForegroundColor Green
} elseif ($totalFailed -le 2) {
    Write-Host "`n⚠️ ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "Revise os erros antes de ir para produção" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ MUITOS TESTES FALHARAM" -ForegroundColor Red
    Write-Host "Sistema NÃO está pronto para produção" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 80)

# Salvar resultados em arquivo JSON
$testResults | ConvertTo-Json -Depth 10 | Out-File "test-results-sprint-3-4.json"
Write-Host "📄 Resultados salvos em: test-results-sprint-3-4.json" -ForegroundColor Cyan
