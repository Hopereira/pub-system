# Scripts de Deploy

Scripts para configuracao, inicializacao e verificacao do ambiente.

| Arquivo | Descricao |
|---------|-----------|
| `setup.ps1` | Setup automatizado completo do projeto |
| `verify-setup.ps1` | Verifica se o ambiente esta configurado corretamente |
| `docker-start.ps1` | Inicia containers Docker (uso diario) |
| `docker-rebuild.ps1` | Rebuild completo dos containers |
| `setup-local-hosts.ps1` | Configura hosts locais para desenvolvimento |
| `setup-ssl-mkcert.ps1` | Configura SSL local com mkcert |
| `instalar-dependencias.ps1` | Instala dependencias do projeto |

## Uso

```powershell
# Setup inicial
.\scripts\deploy\setup.ps1

# Uso diario
.\scripts\deploy\docker-start.ps1

# Verificar configuracao
.\scripts\deploy\verify-setup.ps1
```
