# Relatório de Sessão — 2026-04-04

**Data:** 04 de Abril de 2026  
**Duração estimada:** ~3 horas  
**Status final:** ✅ Backend operacional, API respondendo 200

---

## 1. Situação Inicial

O sistema apresentava **502 Bad Gateway** em `https://api.pubsystem.com.br`.  
O frontend `pub-demo.pubsystem.com.br` mostrava erros de CORS e falha ao carregar tenant.

Erros no console do browser:
```
GET https://api.pubsystem.com.br/registro/tenant/pub-demo 502 (Bad Gateway)
Access to fetch... blocked by CORS policy: No 'Access-Control-Allow-Origin'
WebSocket connection to 'wss://api.pubsystem.com.br/socket.io/...' failed
```

---

## 2. Diagnóstico

### 2.1 Problema de deploy (CI/CD)

O job `deploy-staging` do CI usava:
```bash
docker compose -f docker-compose.micro.yml up -d --build
```

Ao tentar recriar o container `pub-postgres` que já existia com outro nome de rede,
o Docker lançava erro de conflito de container. Como o step tinha `continue-on-error: true`,
a falha era silenciada e o backend nunca era atualizado.

**Fix aplicado:** `.github/workflows/ci.yml` — mudar para:
```bash
docker compose -f docker-compose.micro.yml build backend
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

### 2.2 Problema de rede Docker (EAI_AGAIN postgres)

Ao recriar apenas o backend com `--no-deps`, o container `pub-backend` era colocado
numa rede Docker diferente do `pub-postgres`:

| Container | Rede |
|-----------|------|
| `pub-backend` (recriado) | `pub-system_default` |
| `pub-postgres` (original) | `infra_pub-network` |

O hostname `postgres` não resolvia dentro do container backend porque pertencia
a uma rede diferente → `getaddrinfo EAI_AGAIN postgres` → crash em loop → 502.

**Causa raiz:** O `docker-compose.micro.yml` não declarava rede explícita.
O postgres havia sido criado originalmente pelo compose da pasta `infra/` (agora removida)
e ficou preso na rede `infra_pub-network`.

### 2.3 Problema de volume (banco vazio)

Ao recriar o postgres via compose, o volume mapeado era `pub_postgres_data` (vazio).
Os dados reais de produção estavam em `infra_postgres_data` (criado pelo compose antigo).

---

## 3. Correções Aplicadas

### 3.1 CI/CD — `.github/workflows/ci.yml`

- Removido `continue-on-error: true` que mascarava falhas
- Deploy agora reconstrói apenas `backend` com `--no-deps --force-recreate`
- Adicionado `ConnectTimeout` no SSH para evitar timeout silencioso

### 3.2 Docker Compose — `docker-compose.micro.yml`

- Adicionada rede explícita `pub-network` com `name: pub-network` para TODOS os serviços
- Volume alterado de `pub_postgres_data` → `infra_postgres_data: external: true`
- Redes declaradas no nível raiz com nome fixo (não gerado automaticamente pelo compose)

```yaml
networks:
  pub-network:
    name: pub-network   # nome fixo, não muda entre deploys
    driver: bridge

volumes:
  infra_postgres_data:
    external: true      # volume existente com dados reais
```

### 3.3 Remoção de duplicatas

Removidos 4 arquivos docker-compose que causavam confusão:

| Arquivo removido | Motivo |
|-----------------|--------|
| `docker-compose.prod.yml` (raiz) | Obsoleto — frontend vai para Vercel |
| `infra/docker-compose.yml` | Duplicata do arquivo dev |
| `infra/docker-compose.prod.yml` | Duplicata com `NEXT_PUBLIC_API_URL` errado |
| `infra/docker-compose.micro.yml` | Versão antiga sem postgres/rede/vars |

### 3.4 Intervenção manual na VM (fix emergencial)

```bash
# Reconectar postgres à rede correta
docker network connect pub-network pub-postgres

# Recriar postgres com volume correto e rede correta
docker stop pub-postgres && docker rm pub-postgres
docker run -d --name pub-postgres \
  --network pub-network \
  --network-alias postgres \
  -e POSTGRES_USER=pubuser \
  -e POSTGRES_PASSWORD=PubS3nhaF0rte2026 \
  -e POSTGRES_DB=pubsystem \
  -v infra_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:17-alpine

# Recriar backend
docker compose -f docker-compose.micro.yml up -d --no-deps --force-recreate backend
```

---

## 4. Estado Final dos Containers

| Container | Status | Rede | Volume |
|-----------|--------|------|--------|
| `pub-postgres` | ✅ healthy | `pub-network` (alias: `postgres`) | `infra_postgres_data` |
| `pub-backend` | ✅ healthy | `pub-network` | — |
| `watchtower` | ✅ running | `pub-network` | — |

---

## 5. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| `curl http://localhost:3000/health` na VM | ✅ `{"status":"ok","database":{"status":"up"}}` |
| `curl https://api.pubsystem.com.br/health` externo | ✅ HTTP 200 |
| `docker exec pub-postgres psql -c '\dt'` | ✅ 30 tabelas presentes |
| Frontend `pub-demo.pubsystem.com.br` | ✅ Carrega sem 502/CORS |

---

## 6. Commits desta Sessão

| Hash | Mensagem |
|------|---------|
| `eefcaa4` | `fix(ci): corrigir deploy para rebuild apenas o backend sem recriar postgres` |
| `52d07bd` | `fix(docker): adicionar rede pub-network explícita para garantir comunicação backend-postgres` |
| `0f9567e` | `chore(infra): remover docker-compose duplicados e documentar rede Docker` |
| `bb3bb7f` | `fix(docker): usar volume infra_postgres_data (dados reais de producao)` |

---

## 7. Risco Residual

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Volume `infra_postgres_data` sem backup automático | 🔴 Alta | Ver `docs/infra/backup-e-restore.md` — configurar cron |
| Sem monitoramento de uptime | 🟡 Média | Configurar UptimeRobot ou similar |
| `pub-postgres` criado manualmente (fora do compose) | 🟡 Média | Já corrigido no compose — próximo rebuild vai usar rede/volume corretos |

---

## 8. Próximas Ações Recomendadas

1. **Configurar backup automático** do PostgreSQL (`pg_dump` diário via cron)
2. **Configurar monitoramento** de uptime para `api.pubsystem.com.br/health`
3. **Testar próximo CI deploy** após merge deste PR para validar que rede é correta automaticamente
