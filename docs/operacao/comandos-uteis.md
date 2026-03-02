# Comandos Uteis

## Acesso SSH

```bash
ssh -i ~/.ssh/oracle_key ubuntu@<IP_PUBLICO>
```

## Docker

```bash
# Status dos containers
docker ps

# Logs do backend (tempo real)
docker logs pub-backend -f

# Ultimas 100 linhas de log
docker logs pub-backend --tail 100

# Consumo de recursos por container
docker stats

# Subir containers (producao)
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build

# Parar containers
docker compose -f infra/docker-compose.prod.yml down

# Reiniciar backend sem rebuild
docker compose -f infra/docker-compose.prod.yml restart pub-backend

# Rebuild sem cache
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build --no-cache --force-recreate

# Limpar imagens nao utilizadas
docker image prune -f
```

## Banco de Dados

```bash
# Conectar ao psql
docker exec -it pub-postgres psql -U pubuser -d pubsystem

# Listar tabelas
docker exec -it pub-postgres psql -U pubuser -d pubsystem -c '\dt'

# Contar registros
docker exec -it pub-postgres psql -U pubuser -d pubsystem -c "
  SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
"

# Backup manual
mkdir -p ~/backups
docker exec pub-postgres pg_dump -U pubuser -d pubsystem -F c > ~/backups/pubsystem-$(date +%Y%m%d-%H%M).dump

# Restore
docker exec -i pub-postgres pg_restore -U pubuser -d pubsystem --clean --if-exists < ~/backups/arquivo.dump
```

## Nginx

```bash
# Status
sudo systemctl status nginx

# Testar configuracao
sudo nginx -t

# Recarregar configuracao
sudo systemctl reload nginx

# Logs de erro
sudo tail -f /var/log/nginx/error.log

# Logs de acesso
sudo tail -f /var/log/nginx/access.log
```

## Atualizacao de Codigo

```bash
cd ~/pub-system
git pull origin main
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
docker logs pub-backend --tail 50
```

## Monitoramento

```bash
# CPU e memoria
htop

# Disco
df -h

# Verificar healthcheck
curl http://localhost:3000/health
curl https://api.pubsystem.com.br/health

# Verificar backup cron
crontab -l | grep pg_dump

# Listar backups
ls -lh ~/backups/
```

## Migrations

```bash
cd ~/pub-system/backend

# Executar migrations pendentes
npm run typeorm:migration:run

# Verificar status
npm run typeorm:migration:show
```
