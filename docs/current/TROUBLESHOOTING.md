# Troubleshooting — Pub System

**Última atualização:** 2026-04-04  
**Fonte da verdade:** `docs/troubleshooting/`, experiência de desenvolvimento  
**Status:** Ativo

---

## Docker e Infraestrutura

### Backend não inicia — "Connection refused" ao banco
**Sintoma:** `Error: connect ECONNREFUSED 127.0.0.1:5432`  
**Causa:** Container `db` ainda não está healthy.  
**Solução (desenvolvimento):**
```bash
docker compose ps          # Verificar status
docker compose logs db     # Ver logs do PostgreSQL
docker compose restart db  # Reiniciar se necessário
```
Aguarde até `db` mostrar `(healthy)`.

### Backend não inicia — "EAI_AGAIN postgres" (produção)
**Sintoma:** `Error: getaddrinfo EAI_AGAIN postgres` nos logs do backend  
**Causa:** Container `pub-backend` está numa rede Docker diferente do `pub-postgres`.  
Isso acontece quando o backend é recriado com `--no-deps` e os containers ficam em redes distintas.  
**Diagnóstico:**
```bash
docker network inspect pub-network 2>&1 | grep -A2 'Name'
# Se pub-postgres não aparecer → está na rede errada
```
**Solução:**
```bash
docker network connect pub-network pub-postgres
docker restart pub-backend
```
Ver detalhes completos em `docs/sessions/2026-04-04/DOCKER_REDE_DIAGNOSTICO.md`.

### Backend não conecta ao Redis
**Sintoma:** `Error: connect ECONNREFUSED redis:6379`  
**Causa:** Container `redis` não está rodando ou não está healthy.  
**Solução:**
```bash
docker compose ps
docker compose restart redis
```

### Erro de memória no frontend
**Sintoma:** `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`  
**Causa:** Next.js 16 com Turbopack consome muita memória.  
**Solução:** Já configurado no `docker-compose.yml`:
```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
deploy:
  resources:
    limits:
      memory: 2.5G
```
Se persistir, aumentar o limite de memória do Docker Desktop.

### Porta já em uso
**Sintoma:** `Error: listen EADDRINUSE :::3000`  
**Solução:**
```bash
docker compose down        # Parar todos containers
# Ou encontrar e matar o processo
netstat -ano | findstr :3000   # Windows
lsof -i :3000                  # Linux/Mac
```

### Volumes corrompidos / banco inconsistente
**Sintoma:** Erros de migration ou dados inconsistentes.  
**Solução:** Reset completo:
```bash
docker compose down -v     # Remove volumes (APAGA TODOS OS DADOS)
docker compose up -d       # Recria tudo do zero
```

---

## Autenticação

### Token expirado / 401 Unauthorized
**Sintoma:** Requisições retornam 401 após algum tempo.  
**Causa:** Access token expirou.  
**Solução:** O frontend deve usar o refresh token automaticamente via `POST /auth/refresh`. Se o refresh token também expirou, redirecionar para login.

### Swagger não aparece
**Sintoma:** `http://localhost:3000/api` retorna 404.  
**Causa:** Swagger é desabilitado quando `NODE_ENV=production`.  
**Solução:** Usar apenas em desenvolvimento. Em produção, consultar [API.md](./API.md).

### "JWT_SECRET must be at least 32 characters"
**Sintoma:** Backend não inicia com erro de validação Joi.  
**Causa:** `JWT_SECRET` no `.env` tem menos de 32 caracteres.  
**Solução:** Gerar segredo forte:
```bash
openssl rand -base64 32
```

---

## Banco de Dados

### Migration falha
**Sintoma:** `Error during migration run`  
**Causa:** Schema do banco diverge do esperado pela migration.  
**Solução:**
```bash
# Ver status das migrations
docker compose exec backend npm run typeorm -- migration:show

# Se necessário, reverter última migration
docker compose exec backend npm run typeorm -- migration:revert

# Executar novamente
docker compose exec backend npm run typeorm:migration:run
```

### TypeORM "relation not found"
**Sintoma:** `QueryFailedError: relation "xxx" does not exist`  
**Causa:** Migration não foi executada ou tabela não existe.  
**Solução:** Executar migrations:
```bash
docker compose exec backend npm run typeorm:migration:run
```

### PostgreSQL integer overflow com CPF
**Sintoma:** `Error: integer out of range` ao salvar CPF.  
**Causa:** CPF armazenado como integer em vez de string.  
**Solução:** CPF deve ser armazenado como `varchar` sem formatação. Verificar DTO e entity.

---

## Frontend

### CORS error
**Sintoma:** `Access to XMLHttpRequest blocked by CORS policy`  
**Causa:** URL do frontend não está na lista de origens permitidas do backend.  
**Solução:** Verificar `FRONTEND_URL` no `.env` e a configuração CORS em `backend/src/main.ts`.

### "Failed to fetch" / Network Error
**Sintoma:** Requisições falham sem resposta.  
**Causa:** Backend não está rodando ou `NEXT_PUBLIC_API_URL` está errado.  
**Solução:**
1. Verificar se backend está rodando: `curl http://localhost:3000/health`
2. Verificar `NEXT_PUBLIC_API_URL` no `.env`
3. Se usando Docker, verificar que `API_URL_SERVER=http://backend:3000` para SSR

### Página em branco / hydration error
**Sintoma:** Página carrega em branco ou erro de hydration no console.  
**Causa:** Divergência entre SSR e client-side rendering.  
**Solução:** Verificar se componentes que usam `window` ou `localStorage` estão protegidos com `useEffect` ou `typeof window !== 'undefined'`.

### WebSocket não conecta
**Sintoma:** Notificações em tempo real não funcionam.  
**Causa:** WebSocket não consegue conectar ao backend.  
**Solução:**
1. Verificar que `NEXT_PUBLIC_API_URL` aponta para o backend correto
2. Em produção, verificar que Nginx tem headers de WebSocket:
   ```nginx
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection 'upgrade';
   ```
3. Verificar CORS no gateway WebSocket

---

## Multi-Tenancy

### "Tenant not found" / 403 em todas rotas
**Sintoma:** Após login, todas requisições retornam 403 ou "tenant not found".  
**Causa:** TenantGuard não consegue resolver o tenant do usuário.  
**Solução:**
1. Verificar que o usuário tem `tenantId` no JWT (campo correto — não `empresaId` que é legado)
2. Usar endpoint de debug: `GET /ambientes/debug/tenant-info`
3. Verificar que o tenant está com status ATIVO

### Dados de outro tenant aparecendo
**Sintoma:** Usuário vê dados que não são do seu estabelecimento.  
**Causa:** TenantInterceptor não está filtrando corretamente.  
**Solução:** Verificar que a entidade tem coluna `tenantId` e que o repository usa o filtro de tenant.

### Subdomínio não funciona
**Sintoma:** `casarao-pub.pubsystem.com.br` não carrega.  
**Causa:** DNS não configurado ou middleware não reescrevendo.  
**Solução:**
1. Verificar registro DNS no Cloudflare
2. Verificar middleware em `frontend/src/middleware.ts`
3. Verificar que o slug existe: `GET /registro/tenant/casarao-pub`

---

## Upload de Imagens

### Upload falha silenciosamente
**Sintoma:** Imagem não aparece após upload, sem erro visível.  
**Causa:** GCS não configurado ou credenciais inválidas.  
**Solução:**
1. Verificar `GCS_BUCKET_NAME` e `GOOGLE_APPLICATION_CREDENTIALS` no `.env`
2. Verificar que `gcs-credentials.json` existe e é válido
3. Verificar permissões do bucket no GCS Console

### "File too large"
**Sintoma:** `413 Payload Too Large` ou erro de validação.  
**Causa:** Arquivo excede o limite.  
**Solução:** Limites configurados:
- Imagens de produto/evento: 10 MB
- Fotos de funcionário: 5 MB
- Body JSON global: 10 MB (`main.ts:77`)

---

## Produção

### Backend não responde em produção
**Sintoma:** `https://api.pubsystem.com.br` timeout.  
**Checklist:**
1. VM está rodando? `ssh` na Oracle VM
2. Container Docker ativo? `docker ps` ou `docker compose -f docker-compose.micro.yml ps`
3. Nginx rodando? `sudo systemctl status nginx`
4. Porta 80 aberta? Verificar Security List da Oracle Cloud e iptables
5. Cloudflare proxy ativo? Verificar nuvem laranja no DNS

### SSL error em produção
**Sintoma:** `ERR_SSL_PROTOCOL_ERROR`  
**Causa:** Cloudflare SSL configurado como "Full" mas servidor não tem certificado.  
**Solução:** Usar modo **Flexível** no Cloudflare (SSL/TLS → Overview → Flexible).

### PostgreSQL connection timeout
**Sintoma:** `Error: Connection terminated unexpectedly`  
**Causa:** Container `pub-postgres` parado ou sem memória.  
**Solução:** `docker ps` para verificar status. Reiniciar apenas o backend sem tocar no postgres:
```bash
cd ~/pub-system
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

### Backend conecta mas banco parece vazio ("relation X does not exist")
**Sintoma:** `QueryFailedError: relation "ambientes" does not exist` nos logs  
**Causa:** Container postgres foi recriado apontando para volume errado (`pub_postgres_data` vazio).  
Os dados reais de produção estão em `infra_postgres_data`.  
**Diagnóstico:**
```bash
docker exec pub-postgres psql -U pubuser -d pubsystem -c '\dt'
# Se retornar "Did not find any relations" → volume errado
```
**Solução:**
```bash
docker stop pub-postgres && docker rm pub-postgres
docker run -d --name pub-postgres \
  --network pub-network --network-alias postgres \
  -e POSTGRES_USER=pubuser -e POSTGRES_PASSWORD=<senha> -e POSTGRES_DB=pubsystem \
  -v infra_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 --restart unless-stopped \
  postgres:17-alpine
```
