# Incident Playbook — Pub System

> Guia de resposta a incidentes para a equipe operacional.
> Cada seção descreve: sintoma, causa provável, diagnóstico, correção e rollback.

---

## 1. HTTP 500 — Erro interno em cascata

**Sintoma:** Aumento de erros 500 nos logs ou no Sentry.

**Causa provável:**
- Bug em deploy recente
- Banco inacessível
- Redis down
- Dependência externa falhando

**Diagnóstico:**
```bash
# Verificar health
curl -s http://localhost:3000/health/ready | jq .

# Verificar logs recentes
docker logs pub-backend --tail 100

# Verificar status detalhado (requer token admin)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .
```

**Correção:**
1. Se banco down → verificar container postgres e rede Docker
2. Se Redis down → reiniciar container Redis
3. Se bug de código → rollback para versão anterior

**Rollback:**
```bash
# Rollback rápido para imagem anterior
docker tag pub-backend:previous pub-backend:latest
docker compose -f docker-compose.micro.yml up -d --no-deps backend
```

---

## 2. RLS Risk Detected — Vazamento potencial de tenant

**Sintoma:** Log `[RLS_RISK]` ou alerta webhook com `rls_risk_detected`.

**Causa provável:**
- Request sem tenant context chegando a endpoint protegido
- Super admin executando operação sem tenant scoping
- Middleware de RLS não configurado na rota

**Diagnóstico:**
```bash
# Buscar nos logs
docker logs pub-backend 2>&1 | grep "RLS_RISK"

# Verificar RLS readiness
npm run rls:readiness
```

**Correção:**
1. Verificar rota que gerou o risco no log (url + method)
2. Se é rota pública que não deveria expor dados → adicionar guard
3. Se é SUPER_ADMIN legítimo → normal, sem ação

**Rollback:** N/A (RLS_DRY_RUN apenas audita, não bloqueia)

---

## 3. BullMQ Queue Backlog — Jobs acumulando

**Sintoma:** Jobs pendentes crescendo, processamento lento.

**Causa provável:**
- Worker crashou
- Redis sobrecarregado
- Job com retry infinito

**Diagnóstico:**
```bash
# Verificar status das filas (via /internal/status)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .queues

# Verificar Redis
docker exec pub-redis redis-cli ping
docker exec pub-redis redis-cli info memory
```

**Correção:**
1. Reiniciar worker: `docker restart pub-backend`
2. Se Redis cheio: `docker exec pub-redis redis-cli flushdb` (⚠️ perde cache)
3. Se job travado: limpar jobs falhos no Redis

**Rollback:** Reiniciar backend limpa workers e reconecta.

---

## 4. WebSocket Desconectando — Clientes perdem tempo real

**Sintoma:** Clientes reportam que pedidos não atualizam em tempo real.

**Causa provável:**
- Backend reiniciou sem reconexão
- Redis adapter falhou (se multi-node)
- Firewall/proxy cortando WebSocket

**Diagnóstico:**
```bash
# Verificar gateway ativo nos logs
docker logs pub-backend 2>&1 | grep "Gateway.*inicializado"

# Verificar conexões WebSocket
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .services
```

**Correção:**
1. Se adapter Redis falhou → desabilitar `SOCKET_IO_REDIS_ENABLED=false` e reiniciar
2. Se proxy → verificar headers `Upgrade: websocket` no nginx/load balancer
3. Frontend faz reconnect automático — aguardar 30s

**Rollback:** `SOCKET_IO_REDIS_ENABLED=false` + restart

---

## 5. Database Lenta — Queries > 200ms

**Sintoma:** Logs `[SLOW_QUERY]` frequentes, latência alta.

**Causa provável:**
- Falta de índice em tabela com muitos registros
- Lock contention
- Connection pool esgotado

**Diagnóstico:**
```bash
# Verificar slow queries no /internal/status
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .performance.slowQueries

# Verificar pool de conexões
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .database.pool

# Verificar locks no PostgreSQL
docker exec pub-postgres psql -U admin -d pub_system -c \
  "SELECT pid, state, wait_event_type, query FROM pg_stat_activity WHERE state='active'"
```

**Correção:**
1. Adicionar índice sugerido pelo slow query logger
2. Se pool esgotado → aumentar `max` no TypeORM config (padrão: 10)
3. Se locks → identificar transação bloqueante e resolver

**Rollback:** Índices podem ser removidos com `DROP INDEX IF EXISTS`.

---

## 6. Rate Limit Excessivo — Usuários legítimos bloqueados

**Sintoma:** Usuários recebem 429 Too Many Requests.

**Causa provável:**
- Limites muito baixos para produção
- Ataque DDoS real
- Frontend fazendo polling excessivo

**Diagnóstico:**
```bash
# Verificar rate limit stats nos logs
docker logs pub-backend 2>&1 | grep "Rate Limit"

# Verificar counters de alerta
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .alerts
```

**Correção:**
1. Se DDoS → manter limites, bloquear IP no firewall
2. Se legítimo → aumentar limites em `ThrottlerModule` no `app.module.ts`
3. Se frontend → corrigir polling interval

**Rollback:** Ajustar limites e reiniciar.

---

## 7. Sentry Indisponível — Erros não rastreados

**Sintoma:** Sentry dashboard vazio, mas erros estão ocorrendo.

**Causa provável:**
- SENTRY_DSN incorreto
- Rede bloqueando saída para sentry.io
- SDK não inicializou

**Diagnóstico:**
```bash
# Verificar se Sentry inicializou
docker logs pub-backend 2>&1 | grep "Sentry"

# Verificar feature flag
curl -s http://localhost:3000/health/metrics | jq .features.sentry
```

**Correção:**
1. Verificar SENTRY_DSN no .env
2. Testar conectividade: `curl -I https://sentry.io`
3. Se DSN correto → reiniciar backend

**Rollback:** Sistema funciona sem Sentry (graceful degradation).

---

## 8. Tenant Isolation Failure — Dados de outro tenant visíveis

**Sintoma:** Usuário vê dados que não são do seu bar/restaurante.

**PRIORIDADE: P0 — CRÍTICO**

**Diagnóstico:**
```bash
# Verificar RLS status
npm run rls:readiness

# Verificar tenant context no request
docker logs pub-backend 2>&1 | grep "TENANT_MISMATCH"

# Verificar se RLS está ativo
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .security.rls
```

**Correção:**
1. **IMEDIATO:** Ativar RLS se não estiver: `RLS_ENABLED=true` + restart
2. Verificar endpoint que vazou dados — pode faltar `WHERE tenant_id` na query
3. Verificar se getTenantId() está retornando null silenciosamente

**Rollback:** Se RLS causa problema: `RLS_ENABLED=false` + `RLS_DRY_RUN=true`

---

## Checklist de Resposta a Incidentes

1. ☐ Identificar sintoma (logs, alerta, report de usuário)
2. ☐ Verificar `/health/ready` e `/internal/status`
3. ☐ Consultar este playbook
4. ☐ Aplicar correção documentada
5. ☐ Verificar que correção funcionou
6. ☐ Documentar incidente (quando, o quê, como corrigiu)
7. ☐ Criar post-mortem se P0/P1

---

## Contatos de Emergência

| Nível | Ação |
|-------|------|
| P0 (vazamento dados) | Parar tráfego imediatamente. Ativar RLS. |
| P1 (sistema down) | Rollback para versão anterior. |
| P2 (degradação) | Monitorar, corrigir em próximo deploy. |
| P3 (cosmético) | Ticket para próximo sprint. |
