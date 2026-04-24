# Load Testing — Pub System

## Ferramentas

| Tipo | Ferramenta | Script |
|------|-----------|--------|
| HTTP | [k6](https://k6.io/) | `scripts/load-test/http-load.js` |
| Queue | ts-node (BullMQ) | `scripts/load-test/queue-stress.ts` |
| WebSocket | ts-node (socket.io-client) | `scripts/load-test/websocket-stress.ts` |

## Cenários HTTP (k6)

### Pré-requisitos
```bash
# Instalar k6
# Windows: choco install k6
# Mac: brew install k6
# Linux: snap install k6
```

### Executar
```bash
# Cenário padrão (ramp 1→10 VUs, 50s)
k6 run -e TENANT_ID=<uuid> -e ADMIN_EMAIL=admin@admin.com -e ADMIN_PASSWORD=admin123 scripts/load-test/http-load.js

# Multi-tenant (5 VUs por tenant)
k6 run --vus 20 --duration 60s -e TENANT_ID=<uuid> scripts/load-test/http-load.js
```

### Endpoints testados
- `GET /health/live` (público)
- `GET /mesas` (autenticado)
- `GET /produtos` (autenticado)
- `GET /comandas` (autenticado)
- `GET /funcionarios` (autenticado)
- `GET /ambientes` (autenticado)

### Thresholds
- P95 response time < 2000ms
- Error rate < 10%

## Cenário Queue Stress

### Executar
```bash
# 100 jobs (padrão)
npm run load:test:queue

# 500 jobs
STRESS_JOBS=500 npm run load:test:queue
```

### O que testa
- Burst de N jobs audit no BullMQ
- Todos os jobs completam dentro de 30s
- Mede throughput (jobs/sec) e latência de adição
- Verifica jobs falhos

### Limites esperados
- Add latency: < 5ms/job
- Throughput: > 100 jobs/sec
- Falhas: 0 (com Redis e worker ativos)

## Cenário WebSocket

### Executar
```bash
# 100 conexões (padrão, sem auth)
npm run load:test:ws

# 500 conexões com auth
WS_CONNECTIONS=500 WS_TOKEN=<jwt> WS_TENANT_ID=<uuid> npm run load:test:ws
```

### O que testa
- N conexões simultâneas
- Latência de conexão (min/avg/p95/max)
- Taxa de sucesso
- Isolamento por tenant rooms (com JWT)

### Limites esperados
- 100 conexões: taxa sucesso > 95%
- 500 conexões: taxa sucesso > 90%
- Latência P95 < 1000ms

## Multi-node WebSocket

### Status: PRONTO ✅

O Socket.IO está preparado para múltiplas instâncias via Redis adapter:

```env
SOCKET_IO_REDIS_ENABLED=true
```

### Como funciona
1. `RedisIoAdapter` conecta ao Redis pub/sub
2. Socket.IO propaga eventos entre instâncias
3. Tenant rooms funcionam cross-instance
4. Fallback: se Redis falhar, volta a single-node automaticamente

### Testar multi-node localmente
```bash
# Terminal 1
PORT=3000 SOCKET_IO_REDIS_ENABLED=true npm run start:dev

# Terminal 2
PORT=3001 SOCKET_IO_REDIS_ENABLED=true npm run start:dev

# Testar: conectar WS no :3000, emitir evento, verificar recebimento no :3001
```

### Rollback
`SOCKET_IO_REDIS_ENABLED=false` + restart

## Gargalos Conhecidos

1. **PostgreSQL**: pool de 10 conexões max — pode limitar throughput em > 50 VUs
2. **Redis**: single instance — adequado até ~5000 req/s
3. **WebSocket**: sem clustering ativo por padrão — ativar `SOCKET_IO_REDIS_ENABLED` antes de escalar
4. **BullMQ**: jobs síncronos se Redis estiver offline

## Recomendações antes de escalar

- [ ] Aumentar pool PG (`extra.max` em `app.module.ts`) para 20-30
- [ ] Ativar `SOCKET_IO_REDIS_ENABLED=true`
- [ ] Configurar Redis Sentinel ou cluster para HA
- [ ] Monitorar `/health/metrics` para uso de memória
- [ ] Implementar connection pooling externo (PgBouncer) se > 100 req/s sustentado
