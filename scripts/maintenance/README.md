# Scripts de Manutencao

Scripts para manutencao e operacoes periodicas do sistema.

| Arquivo | Descricao |
|---------|-----------|
| `reset-sistema.ps1` | Reset completo do sistema (limpa dados) |
| `aplicar-expiracao-4h.ps1` | Aplica regra de expiracao de 4 horas em comandas |

## Uso

```powershell
# Reset do sistema (CUIDADO: apaga dados)
.\scripts\maintenance\reset-sistema.ps1

# Aplicar expiracao
.\scripts\maintenance\aplicar-expiracao-4h.ps1
```
