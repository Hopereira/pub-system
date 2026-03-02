# Troubleshooting

## API nao responde (Erro 502/522)

**Causa provavel**: Backend ou Nginx parado.

```bash
# Verificar containers
docker ps

# Verificar Nginx
sudo systemctl status nginx

# Reiniciar tudo
sudo systemctl restart nginx
docker compose -f infra/docker-compose.prod.yml restart
```

## Backend nao inicia

**Causa provavel**: Variavel de ambiente ausente ou banco indisponivel.

```bash
# Ver logs de erro
docker logs pub-backend --tail 200

# Verificar se o banco esta healthy
docker exec pub-postgres pg_isready -U pubuser -d pubsystem

# Verificar variaveis
docker exec pub-backend env | grep DB_
```

## Banco nao conecta

**Causa provavel**: Container do postgres parado ou volume corrompido.

```bash
# Status do container
docker ps -a | grep pub-postgres

# Logs do postgres
docker logs pub-postgres --tail 100

# Verificar volume
docker volume inspect pub_postgres_data

# Reiniciar apenas o banco
docker compose -f infra/docker-compose.prod.yml restart postgres
```

Confirmar que `DB_SSL=false` esta no `.env`. SSL ativo causa falha pois o banco e local.

## Erro de CORS

**Causa provavel**: `FRONTEND_URL` incorreta ou desatualizada.

```bash
# Verificar variavel no container
docker exec pub-backend env | grep FRONTEND_URL

# Atualizar .env e rebuild
nano ~/pub-system/.env
docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
```

## Login nao funciona

Verificar em sequencia:

1. Backend rodando: `docker ps`
2. Healthcheck: `curl http://localhost:3000/health`
3. Nginx ativo: `sudo systemctl status nginx`
4. API publica: `curl https://api.pubsystem.com.br/health`
5. CORS correto: `FRONTEND_URL` no `.env` bate com URL do Vercel

## WebSocket nao conecta

**Causa provavel**: Nginx nao esta encaminhando upgrade de protocolo.

Verificar se a configuracao do Nginx inclui:

```nginx
location /socket.io/ {
    proxy_pass http://localhost:3000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Disco cheio

```bash
# Verificar uso
df -h

# Limpar imagens Docker antigas
docker image prune -a -f

# Limpar logs antigos
docker system prune -f

# Limpar backups antigos
find ~/backups -name "*.dump" -mtime +7 -delete
```

## Migration falhou

```bash
cd ~/pub-system/backend

# Ver status das migrations
npm run typeorm:migration:show

# Reverter ultima migration
npm run typeorm:migration:revert

# Re-executar
npm run typeorm:migration:run
```

Se o erro persistir, restaurar backup antes de tentar novamente (ver `docs/infra/backup-e-restore.md`).

## Container em restart loop

```bash
# Ver motivo do restart
docker logs pub-backend --tail 200

# Verificar eventos
docker events --filter container=pub-backend --since 10m
```

Causas comuns:
- Falta de memoria (verificar `docker stats`)
- Variavel de ambiente invalida
- Banco indisponivel na inicializacao
