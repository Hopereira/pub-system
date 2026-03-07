# Backup e Restore

## Backup Manual

Exporta o banco completo em formato custom (`-F c`) para restauracao posterior.

```bash
mkdir -p ~/backups

docker exec pub-postgres pg_dump \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  -F c \
  -f /tmp/pubsystem.dump

docker cp pub-postgres:/tmp/pubsystem.dump \
  ~/backups/pubsystem-$(date +%Y%m%d-%H%M).dump

docker exec pub-postgres rm /tmp/pubsystem.dump
```

## Backup Automatico (Cron)

Editar o crontab do usuario `ubuntu`:

```bash
crontab -e
```

Adicionar linha para backup diario as 03h:

```
0 3 * * * /usr/bin/docker exec pub-postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F c > /home/ubuntu/backups/pubsystem-$(date +\%Y\%m\%d).dump 2>> /home/ubuntu/backups/backup.log
```

Verificar se o cron esta ativo:

```bash
crontab -l
ls -lh ~/backups/
```

## Restore

Copiar o arquivo `.dump` para a VM e executar:

```bash
docker exec -i pub-postgres pg_restore \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  --clean \
  --if-exists \
  < ~/backups/pubsystem-20260301.dump
```

Flags:
- `--clean`: remove objetos existentes antes de restaurar
- `--if-exists`: evita erros caso o objeto nao exista

## Restore em Banco Limpo

Se o banco precisar ser recriado do zero:

```bash
# Dropar e recriar banco
docker exec pub-postgres dropdb -U $POSTGRES_USER $POSTGRES_DB
docker exec pub-postgres createdb -U $POSTGRES_USER $POSTGRES_DB

# Restaurar
docker exec -i pub-postgres pg_restore \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  < ~/backups/pubsystem-20260301.dump
```

## Estrategia de Retencao

| Tipo | Frequencia | Retencao |
|------|------------|----------|
| Diario | Cron 03h | 7 dias |
| Semanal | Manual | 30 dias |
| Pre-deploy | Antes de cada deploy | 3 versoes |

Script para limpar backups antigos (adicionar ao cron):

```bash
# Remover backups com mais de 7 dias
find ~/backups -name "pubsystem-*.dump" -mtime +7 -delete
```

## Verificacao de Integridade

Testar restore em ambiente separado mensalmente:

```bash
# Criar container temporario para teste
docker run --rm -d \
  --name pg-test \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=pubsystem_test \
  postgres:17-alpine

# Aguardar inicializacao
sleep 5

# Restaurar backup
docker exec -i pg-test pg_restore \
  -U testuser \
  -d pubsystem_test \
  < ~/backups/pubsystem-latest.dump

# Verificar tabelas
docker exec pg-test psql -U testuser -d pubsystem_test -c '\dt'

# Remover container de teste
docker stop pg-test
```
