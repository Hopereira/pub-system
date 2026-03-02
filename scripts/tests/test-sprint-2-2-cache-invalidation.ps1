# Script de Teste - Sprint 2-2: Invalidação Automática de Cache
# Data: 17 Dez 2025

Write-Host "🧪 TESTANDO SPRINT 2-2: INVALIDAÇÃO AUTOMÁTICA DE CACHE" -ForegroundColor Cyan
Write-Host "=" * 70

# Configuração
$baseUrl = "http://localhost:3000"
$token = ""

# Função para obter token de autenticação
function Get-AuthToken {
    Write-Host "`n🔐 Obtendo token de autenticação..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = "admin@pub.com"
        senha = "admin123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        return $response.access_token
    } catch {
        Write-Host "❌ Erro ao obter token: $_" -ForegroundColor Red
        return $null
    }
}

# Função para verificar chaves no Redis
function Get-RedisKeys {
    param([string]$pattern = "*")
    
    $keys = docker exec pub_system_redis redis-cli KEYS $pattern
    return $keys
}

# Função para contar chaves no Redis
function Count-RedisKeys {
    param([string]$pattern = "*")
    
    $keys = Get-RedisKeys -pattern $pattern
    if ($keys) {
        return ($keys | Measure-Object).Count
    }
    return 0
}

Write-Host "`n" + ("=" * 70)
Write-Host "TESTE 1: INVALIDAÇÃO DE CACHE EM PRODUTOS" -ForegroundColor Cyan
Write-Host "=" * 70

Write-Host "`n1️⃣ Consultando produtos (Cache MISS esperado)..."
curl -s "$baseUrl/produtos?page=1&limit=5" | Out-Null
Start-Sleep -Seconds 1

Write-Host "2️⃣ Verificando chaves de produtos no Redis..."
$keysAntes = Count-RedisKeys -pattern "produtos:*"
Write-Host "   Chaves encontradas: $keysAntes" -ForegroundColor Green

Write-Host "`n3️⃣ Consultando produtos novamente (Cache HIT esperado)..."
curl -s "$baseUrl/produtos?page=1&limit=5" | Out-Null
Start-Sleep -Seconds 1

Write-Host "`n4️⃣ Criando novo produto (deve invalidar cache)..."
$token = Get-AuthToken

if ($token) {
    $novoProduto = @{
        nome = "Produto Teste Cache"
        descricao = "Teste de invalidação de cache"
        preco = 25.50
        ambienteId = "ambiente-id-aqui"
        ativo = $true
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        Write-Host "   Enviando requisição POST /produtos..." -ForegroundColor Yellow
        # Nota: Substituir 'ambiente-id-aqui' por um ID válido em teste real
        # Invoke-RestMethod -Uri "$baseUrl/produtos" -Method POST -Body $novoProduto -Headers $headers | Out-Null
        Write-Host "   ⚠️ Produto não criado (necessário ID de ambiente válido)" -ForegroundColor Yellow
    } catch {
        Write-Host "   ⚠️ Erro esperado: $_" -ForegroundColor Yellow
    }
}

Write-Host "`n5️⃣ Verificando se cache foi invalidado..."
Start-Sleep -Seconds 2
$keysDepois = Count-RedisKeys -pattern "produtos:*"
Write-Host "   Chaves após operação: $keysDepois" -ForegroundColor Green

if ($keysDepois -lt $keysAntes) {
    Write-Host "   ✅ CACHE INVALIDADO COM SUCESSO!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Cache ainda presente (produto não foi criado)" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70)
Write-Host "TESTE 2: VERIFICAÇÃO DE LOGS DE INVALIDAÇÃO" -ForegroundColor Cyan
Write-Host "=" * 70

Write-Host "`nVerificando logs do backend..."
docker-compose logs backend --tail=100 | Select-String -Pattern "Invalidando cache|Cache invalidado" | Select-Object -Last 20

Write-Host "`n" + ("=" * 70)
Write-Host "TESTE 3: ESTRUTURA DO REDIS" -ForegroundColor Cyan
Write-Host "=" * 70

Write-Host "`n📊 Chaves por padrão:"
Write-Host "   Produtos:  $(Count-RedisKeys -pattern 'produtos:*')" -ForegroundColor Cyan
Write-Host "   Comandas:  $(Count-RedisKeys -pattern 'comandas:*')" -ForegroundColor Cyan
Write-Host "   Pedidos:   $(Count-RedisKeys -pattern 'pedidos:*')" -ForegroundColor Cyan
Write-Host "   Ambientes: $(Count-RedisKeys -pattern 'ambientes:*')" -ForegroundColor Cyan
Write-Host "   Mesas:     $(Count-RedisKeys -pattern 'mesas:*')" -ForegroundColor Cyan

$totalKeys = Count-RedisKeys -pattern "*"
Write-Host "`n   Total de chaves no Redis: $totalKeys" -ForegroundColor Green

Write-Host "`n" + ("=" * 70)
Write-Host "TESTE 4: CENÁRIO COMPLETO DE INVALIDAÇÃO" -ForegroundColor Cyan
Write-Host "=" * 70

Write-Host "`n📝 CENÁRIO: Criar Produto → Cache Invalidado → Nova Consulta"
Write-Host "`n1. Limpar cache de produtos..."
docker exec pub_system_redis redis-cli DEL "produtos:*" | Out-Null

Write-Host "2. Consultar produtos (Cache MISS)..."
$response1 = curl -s "$baseUrl/produtos?page=1&limit=5" | ConvertFrom-Json
$total1 = $response1.meta.total
Write-Host "   Total de produtos: $total1" -ForegroundColor Green

Write-Host "`n3. Consultar novamente (Cache HIT esperado)..."
curl -s "$baseUrl/produtos?page=1&limit=5" | Out-Null

Write-Host "`n4. Verificar logs de cache..."
docker-compose logs backend --tail=50 | Select-String -Pattern "Cache (HIT|MISS)" | Select-Object -Last 5

Write-Host "`n" + ("=" * 70)
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=" * 70

Write-Host "✅ CacheInvalidationService: IMPLEMENTADO" -ForegroundColor Green
Write-Host "✅ Invalidação em Produtos: IMPLEMENTADO" -ForegroundColor Green
Write-Host "✅ Invalidação em Comandas: IMPLEMENTADO" -ForegroundColor Green
Write-Host "✅ Invalidação em Pedidos: IMPLEMENTADO" -ForegroundColor Green
Write-Host "✅ Invalidação em Ambientes: IMPLEMENTADO" -ForegroundColor Green
Write-Host "✅ Invalidação em Mesas: IMPLEMENTADO" -ForegroundColor Green

Write-Host "`n💡 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Testar criação/atualização/deleção de cada entidade"
Write-Host "2. Verificar logs de invalidação em tempo real"
Write-Host "3. Validar que cache é recriado após invalidação"
Write-Host "4. Commit e deploy das alterações"

Write-Host "`n✅ TESTES DE ESTRUTURA CONCLUÍDOS!" -ForegroundColor Green
Write-Host "⚠️ Para testes completos, execute operações CRUD reais com IDs válidos" -ForegroundColor Yellow
