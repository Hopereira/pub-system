# Performance do Banco de Dados

## Configuracao Atual

| Parametro | Valor |
|-----------|-------|
| Imagem | `postgres:17-alpine` |
| RAM disponivel | Compartilhada com backend na VM (1GB total) |
| Volume | `pub_postgres_data` (disco local) |
| Conexoes | Pool gerenciado pelo TypeORM |

## Indices

O TypeORM cria indices automaticamente para:

- Chaves primarias (`id` UUID)
- Colunas com `@Index()` decorator
- Foreign keys (`empresaId`, etc.)

Para verificar indices existentes:

```bash
docker exec -it pub-postgres psql -U pubuser -d pubsystem -c "
  SELECT indexname, tablename, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

## Monitoramento

### Queries lentas

```bash
docker exec -it pub-postgres psql -U pubuser -d pubsystem -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
  FROM pg_stat_activity
  WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle';
"
```

### Tamanho das tabelas

```bash
docker exec -it pub-postgres psql -U pubuser -d pubsystem -c "
  SELECT relname AS table,
         pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
         pg_size_pretty(pg_relation_size(relid)) AS data_size,
         n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(relid) DESC;
"
```

### Uso de disco do volume

```bash
docker system df -v | grep pub_postgres_data
```

## Otimizacoes Aplicadas

- Cache no backend reduz queries repetitivas (ver `docs/backend/cache.md`)
- Paginacao nos endpoints de listagem (comandas, pedidos, produtos)
- `autoLoadEntities: true` evita carregamento manual
- Pool de conexoes gerenciado pelo TypeORM (padrao: 10 conexoes)

## Recomendacoes para Escala

Se o volume de dados crescer significativamente:

1. Adicionar indices compostos em colunas de filtro frequente (`empresaId` + `status`)
2. Configurar `pg_stat_statements` para identificar queries mais custosas
3. Aumentar recursos da VM ou migrar para instancia dedicada
4. Considerar read replicas se houver carga de leitura alta
