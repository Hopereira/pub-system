# Scripts de Banco de Dados

Scripts SQL e de migracao para o PostgreSQL.

| Arquivo | Descricao |
|---------|-----------|
| `add-ordem-column.sql` | Adiciona coluna de ordem |
| `check-ambiente.sql` | Verifica ambientes cadastrados |
| `check-pedido.sql` | Verifica pedidos |
| `check-users.sql` | Verifica usuarios |
| `create-admin.sql` | Cria usuario administrador |
| `create-agregados-table.sql` | Cria tabela de agregados |
| `create-test-empresas.sql` | Cria empresas de teste |
| `rename-agregados.sql` | Renomeia tabela de agregados |
| `test-quase-pronto.sql` | Script de teste para status quase-pronto |
| `executar-migration-avaliacao.ps1` | Executa migration de avaliacoes |
| `executar-migration-tempo.ps1` | Executa migration de tempo |

## Uso

```bash
# Executar SQL diretamente no container
docker exec -i pub-postgres psql -U pubuser -d pubsystem < scripts/db/check-users.sql
```
