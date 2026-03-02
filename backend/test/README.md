# Testes E2E

## Configuração

Os testes E2E requerem um banco de dados PostgreSQL configurado.

### Opção 1: Usar banco de dados local

1. Certifique-se de que o PostgreSQL está rodando localmente
2. Crie um banco de dados para testes:
```sql
CREATE DATABASE pub_system_test;
```

3. Configure as variáveis de ambiente (ou use os valores padrão):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=pub_system_test
```

### Opção 2: Usar Docker

```bash
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pub_system_test \
  -p 5432:5432 \
  postgres:15-alpine
```

## Executar testes

```bash
# Todos os testes E2E
npm run test:e2e

# Teste específico
npm run test:e2e -- test/app.e2e-spec.ts

# Com coverage
npm run test:e2e -- --coverage
```

## Notas

- Os testes usam `synchronize: true` e `dropSchema: true`, então o banco é recriado a cada execução
- Não use o mesmo banco de desenvolvimento para testes E2E
- O módulo `TestAppModule` substitui o `AppModule` para usar configurações simplificadas
