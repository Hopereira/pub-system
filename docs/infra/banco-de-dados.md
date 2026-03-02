# Banco de Dados

## PostgreSQL 17

O banco de dados roda em um container Docker (`pub-postgres`) na mesma VM do backend.

### Configuracao

| Parametro | Valor |
|-----------|-------|
| Imagem | `postgres:17-alpine` |
| Container | `pub-postgres` |
| Porta interna | 5432 |
| Volume | `pub_postgres_data` |
| Banco | `pubsystem` |
| Usuario | `pubuser` |

### Conexao

O backend usa exclusivamente a variavel `DATABASE_URL`:

```
DATABASE_URL=postgresql://pubuser:SenhaForte123@pub-postgres:5432/pubsystem
```

`DB_SSL` deve ser `false` pois o banco esta na mesma rede Docker.

As variaveis individuais (`DB_HOST`, `DB_USER`, etc.) existem apenas para compatibilidade com scripts de migracao e ferramentas externas.

### Variaveis do Container

O container PostgreSQL usa estas variaveis na inicializacao:

```env
POSTGRES_USER=pubuser
POSTGRES_PASSWORD=SenhaForte123
POSTGRES_DB=pubsystem
```

### Volume Persistente

Os dados ficam no volume Docker `pub_postgres_data`, montado em `/var/lib/postgresql/data` dentro do container.

```bash
# Criar volume (caso nao exista)
docker volume create pub_postgres_data

# Verificar volume
docker volume inspect pub_postgres_data
```

### Acesso Direto

```bash
# psql dentro do container
docker exec -it pub-postgres psql -U pubuser -d pubsystem

# Listar tabelas
\dt

# Listar schemas
\dn
```

### Healthcheck

O container possui healthcheck configurado no docker-compose:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U pubuser -d pubsystem"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

O backend depende do healthcheck para iniciar (`depends_on: condition: service_healthy`).

### Multi-tenancy

O sistema opera com multi-tenancy logico. Todas as entidades possuem coluna `empresaId` e o isolamento e feito via `TenantInterceptor` no backend, que injeta o tenant do JWT em cada requisicao.

Nao ha schemas separados por tenant.
