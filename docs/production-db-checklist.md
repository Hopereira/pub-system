# Production Database Checklist

## Antes de cada deploy

- [ ] **Backup**: `scripts/backup-db.sh` executado com sucesso
- [ ] **Migrations pendentes**: verificar `npm run typeorm -- migration:show`
- [ ] **Impacto**: listar tabelas afetadas pela migration
- [ ] **Locks possíveis**: verificar se migration cria index em tabela grande
- [ ] **Tempo estimado**: avaliar tamanho da tabela (< 1M rows → rápido, > 10M → planejar)
- [ ] **Plano de rollback**: confirmar que migration tem `down()` funcional
- [ ] **Horário**: preferir baixo tráfego (madrugada ou início manhã)

## Regras absolutas

1. **NUNCA** executar `DROP TABLE` sem backup verificado
2. **NUNCA** executar `ALTER COLUMN` que mude tipo sem plano de rollback
3. **NUNCA** executar migration sem `down()` em produção
4. Índices devem ser criados com `CREATE INDEX CONCURRENTLY` (não bloqueia reads)
5. Colunas novas devem ser `NULL` por padrão (evita lock em tabela grande)
6. Remoção de colunas: primeiro remover referência no código, deploy, depois migration

## Comandos seguros

```bash
# Verificar migrations pendentes
npm run typeorm -- migration:show

# Executar migrations
npm run typeorm:migration:run

# Reverter última migration
npm run typeorm -- migration:revert

# Backup antes do deploy
bash scripts/backup-db.sh

# Restore em caso de emergência
bash scripts/restore-db.sh <arquivo_backup>

# Verificar locks ativos
SELECT pid, state, query, age(clock_timestamp(), query_start) AS age
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY age DESC;

# Verificar tamanho de tabelas
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

## Validação pós-deploy

- [ ] Health check: `curl https://api.pubsystem.com.br/health/ready`
- [ ] Migrations aplicadas: verificar no log do deploy
- [ ] Sem erros no Sentry nos primeiros 5 minutos
- [ ] Teste manual de login + listagem
- [ ] Verificar logs por `[RLS_RISK]` (se RLS ativo)

## RLS — Cuidados específicos

- **Ativar RLS**: seguir plano gradual em `docs/observability.md`
- **FORCE ROW LEVEL SECURITY**: somente após 7 dias sem alerta crítico
- **Rollback RLS**: `RLS_ENABLED=false` + restart (sem migration)
- **Verificar readiness**: `npm run rls:readiness`
