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
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pub-postgres:5432/${POSTGRES_DB}
```

`DB_SSL` deve ser `false` pois o banco esta na mesma rede Docker.

As variaveis individuais (`DB_HOST`, `DB_USER`, etc.) existem apenas para compatibilidade com scripts de migracao e ferramentas externas.

### Variaveis do Container

O container PostgreSQL usa estas variaveis na inicializacao:

```env
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}   # Definir no .env (NUNCA versionar)
POSTGRES_DB=${POSTGRES_DB}
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
docker exec -it pub-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# Listar tabelas
\dt

# Listar schemas
\dn
```

### Healthcheck

O container possui healthcheck configurado no docker-compose:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

O backend depende do healthcheck para iniciar (`depends_on: condition: service_healthy`).

### Multi-tenancy

O sistema opera com multi-tenancy logico. Todas as entidades possuem coluna `tenant_id` com FK para `tenants(id)` ON DELETE CASCADE. O isolamento e feito via `TenantInterceptor` + `BaseTenantRepository` no backend, que injeta o tenant do JWT em cada requisicao.

Nao ha schemas separados por tenant.
