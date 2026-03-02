# Migrations

## Configuracao

O TypeORM CLI usa o arquivo `backend/src/database/data-source.ts` como fonte de configuracao.

Variaveis obrigatorias para executar migrations:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_SSL` (deve ser `false` para PostgreSQL local)

## Diretorio

As migrations ficam em `backend/src/database/migrations/`. O padrao glob aceita `.ts` (desenvolvimento) e `.js` (producao/dist).

## Comandos

```bash
cd backend

# Gerar nova migration a partir de diferencas nas entidades
npm run typeorm:migration:generate -- -n NomeDaMigration

# Criar migration vazia
npm run typeorm:migration:create -- -n NomeDaMigration

# Executar migrations pendentes
npm run typeorm:migration:run

# Reverter a ultima migration
npm run typeorm:migration:revert

# Verificar status
npm run typeorm:migration:show
```

## Fluxo de Trabalho

1. Alterar a entidade (`.entity.ts`)
2. Gerar migration automatica: `npm run typeorm:migration:generate`
3. Revisar o SQL gerado na migration
4. Executar: `npm run typeorm:migration:run`
5. Commitar a migration junto com a entidade

## Producao

Em producao, migrations sao executadas automaticamente antes do NestJS iniciar (configurado no entrypoint do Docker). A flag `migrationsRun: false` no data-source impede execucao duplicada pelo TypeORM.

O `synchronize` deve estar sempre `false` em producao. Usar `DB_SYNC=true` apenas no primeiro deploy para criar tabelas iniciais se nao houver migrations.

## Cuidados

- Nunca alterar uma migration ja executada em producao
- Sempre fazer backup antes de executar migrations destrutivas
- Testar migrations localmente antes de aplicar em producao
- Migrations devem ser idempotemtes quando possivel
