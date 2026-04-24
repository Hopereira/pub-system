# Performance Monitoring — Pub System

> Monitoramento de performance sob crescimento real.

---

## Queries Lentas (Slow Queries)

### Detecção automática

O `SlowQueryLogger` captura automaticamente queries acima de `SLOW_QUERY_THRESHOLD_MS` (default: 200ms).

Logs gerados:
```
🐢 SLOW QUERY (312ms > 200ms): SELECT * FROM pedidos WHERE tenant_id = $1 AND...
{
  "event": "SLOW_QUERY",
  "durationMs": 312,
  "threshold": 200,
  "query": "SELECT * FROM pedidos...",
  "suggestion": "Consider composite index on (tenant_id, status)"
}
```

### Sugestão automática de índices

O logger analisa queries lentas e sugere:
- Índices compostos `(tenant_id, <coluna>)` quando WHERE inclui tenant_id
- `LIMIT` quando ORDER BY sem paginação

### Métricas via API

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .performance.slowQueries
```

Retorna:
```json
{
  "totalQueries": 15000,
  "slowQueries": 12,
  "failedQueries": 0,
  "avgDurationMs": 280,
  "slowQueryPercent": "0.08%"
}
```

### Índices recomendados para tabelas de alto volume

```sql
-- Pedidos (consulta mais frequente)
CREATE INDEX CONCURRENTLY idx_pedidos_tenant_status ON pedidos(tenant_id, status);
CREATE INDEX CONCURRENTLY idx_pedidos_tenant_created ON pedidos(tenant_id, "createdAt" DESC);

-- Itens de Pedido
CREATE INDEX CONCURRENTLY idx_itens_pedido_tenant_status ON itens_pedido(tenant_id, status);

-- Comandas
CREATE INDEX CONCURRENTLY idx_comandas_tenant_status ON comandas(tenant_id, status);

-- Produtos
CREATE INDEX CONCURRENTLY idx_produtos_tenant_active ON produtos(tenant_id, "isActive");
```

> Use `CONCURRENTLY` para não bloquear tabela em produção.

---

## Filas (BullMQ)

### Métricas a monitorar

| Métrica | Saudável | Alerta |
|---------|----------|--------|
| Jobs pendentes | < 100 | > 500 |
| Jobs falhos | < 5/hora | > 10/hora |
| Tempo médio processamento | < 1s | > 5s |
| Backlog (acumulado) | < 50 | > 200 |

### Verificação

```bash
# Via /internal/status
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .queues

# Via Redis diretamente
docker exec pub-redis redis-cli LLEN bull:audit:wait
docker exec pub-redis redis-cli LLEN bull:audit:failed
```

### Filas existentes

| Fila | Finalidade | Prioridade |
|------|-----------|------------|
| `audit` | Log de auditoria | Baixa (assíncrona) |
| `notifications` | Notificações push | Média |

---

## WebSocket

### Métricas a monitorar

| Métrica | Saudável | Alerta |
|---------|----------|--------|
| Conexões simultâneas | < 500/instância | > 1000 |
| Auth failures | < 5/min | > 10/min |
| Latência média evento | < 100ms | > 500ms |

### Verificação

```bash
# Logs do gateway
docker logs pub-backend 2>&1 | grep "Gateway\|WebSocket"

# Conexões por tenant
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .services
```

### Load test

```bash
npm run load:test:ws
```

---

## Memória e CPU

### Limites recomendados

| Recurso | Saudável | Alerta |
|---------|----------|--------|
| Heap usado | < 60% do total | > 80% |
| RSS | < 400MB | > 500MB |
| CPU user time | crescimento linear | picos sustentados |

### Verificação

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .performance.memory
```

---

## Connection Pool (PostgreSQL)

### Configuração atual

```typescript
extra: {
  max: 10,       // máximo de conexões
  min: 2,        // mínimo idle
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}
```

### Limites recomendados

| Tenants | max | min |
|---------|-----|-----|
| 1-5 | 10 | 2 |
| 5-20 | 20 | 5 |
| 20-50 | 30 | 10 |
| 50+ | PgBouncer (ver scale-plan.md) |

### Verificação

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/status | jq .database.pool
```

---

## Gargalos Conhecidos

1. **Connection pool fixo em 10** — suficiente para fase atual, precisa PgBouncer para > 50 tenants
2. **Cache in-memory** — não compartilhado entre instâncias, migrar para Redis cache quando multi-node
3. **WebSocket single-node default** — ativar Redis adapter para multi-node
4. **Slow queries sem índice automático** — sugestões são manuais, requerem migration
5. **Logs em disco** — rotação de 14 dias, mas VM com pouco espaço requer monitoramento
