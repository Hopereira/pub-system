# Script para configurar o arquivo hosts para multi-tenancy local
# Execute como Administrador!

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$marker = "# PubSystem Multi-Tenancy Local"

# Entradas a adicionar
$entries = @"

$marker
127.0.0.1  pubsystem.test
127.0.0.1  admin.pubsystem.test
127.0.0.1  bar-do-ze.pubsystem.test
127.0.0.1  pub-da-hora.pubsystem.test
127.0.0.1  boteco-do-joao.pubsystem.test
# End PubSystem
"@

# Verificar se já existe
$content = Get-Content $hostsPath -Raw
if ($content -match [regex]::Escape($marker)) {
    Write-Host "✅ Entradas do PubSystem já existem no arquivo hosts" -ForegroundColor Green
    Write-Host "Para remover, edite manualmente: $hostsPath" -ForegroundColor Yellow
    exit 0
}

# Adicionar entradas
try {
    Add-Content -Path $hostsPath -Value $entries -ErrorAction Stop
    Write-Host "✅ Entradas adicionadas com sucesso ao arquivo hosts!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Domínios configurados:" -ForegroundColor Cyan
    Write-Host "  - pubsystem.test"
    Write-Host "  - admin.pubsystem.test"
    Write-Host "  - bar-do-ze.pubsystem.test"
    Write-Host "  - pub-da-hora.pubsystem.test"
    Write-Host "  - boteco-do-joao.pubsystem.test"
    Write-Host ""
    Write-Host "Próximo passo: Gerar certificado SSL com mkcert" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro ao adicionar entradas. Execute como Administrador!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
