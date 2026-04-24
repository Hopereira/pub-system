# Sprint 3 — Escalabilidade

**Branch:** `sprint-3-scalability`
**Data:** 2026-04-24

---

## Arquitetura de Escala

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Backend    │────▶│  PostgreSQL  │
│   Vercel     │     │  NestJS     │     │  Neon        │
└──────────────┘     └──────┬──────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │   Redis     │
                     │  7-alpine   │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │  Cache  │  │  Rate   │  │  BullMQ │
         │ Manager │  │  Limit  │  │  Queues │
         └─────────┘  └─────────┘  └─────────┘
```

---

## 1. Redis Centralizado

### Status: ✅ JÁ IMPLEMENTADO

O `AppCacheModule` (`cache/cache.module.ts`) já conecta ao Redis via `cache-manager-redis-yet`:
- **Conexão:** `REDIS_HOST:REDIS_PORT` (default `localhost:6379`)
- **Fallback:** In-memory (keyv) se Redis indisponível
- **TTL default:** 1 hora
- **Max entries:** 500 (Redis), 100 (in-memory)
- **Reconnect:** Exponential backoff, máximo 5 tentativas

### Docker
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  ports:
    - "6380:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

### Usos do Redis
| Componente | Chave | TTL | Uso |
|---|---|---|---|
| CacheInvalidationService | `{entidade}:{tenantId}:{params}` | 1h | Cache de queries |
| TenantRateLimitGuard | `ratelimit:{tenantId}:{window}` | 1-3600s | Contadores rate limit |
| FeatureGuard | In-memory Map (não Redis) | 5min | Cache de plano do tenant |
| CustomThrottlerGuard | Throttler interno | 1-60s | Rate limit global |

---

## 2. Rate Limit por Tenant

### Status: ✅ JÁ IMPLEMENTADO

**Dois níveis de proteção:**

#### 2.1 CustomThrottlerGuard (global)
- Tracking por `tenant:userId` ou `tenant:ip`
- Limites: 30/s, 200/10s, 1000/min
- Módulo: `@nestjs/throttler`

#### 2.2 TenantRateLimitGuard (por plano)
| Plano | /min | /hora | Burst/s |
|---|---|---|---|
| FREE | 60 | 1000 | 20 |
| BASIC | 120 | 3000 | 40 |
| PRO | 300 | 10000 | 80 |
| ENTERPRISE | 1000 | 50000 | 200 |

- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Type`
- **Cache:** Tenant plan cached por 5min via `CACHE_MANAGER` (Redis)
- **Fallback IP:** Requisições sem tenant usam limite `default` (60/min)

---

## 3. Filas BullMQ

### Status: ✅ IMPLEMENTADO NESTE SPRINT

**Pacotes:** `@nestjs/bullmq`, `bullmq`

### Arquitetura
```
Request → AuditService.log()
                │
                ├── Redis disponível? → auditQueue.add() → AuditProcessor → DB
                │
                └── Redis indisponível → escrita direta (sync fallback)
```

### Filas registradas
| Fila | Uso | Processor |
|---|---|---|
| `audit` | Registros de auditoria | `AuditProcessor` |
| `notifications` | Notificações (futuro) | — |

### AuditService — Comportamento
1. **Com Redis:** Audit logs são despachados para a fila BullMQ. Processamento assíncrono com retry (3 tentativas, backoff exponencial).
2. **Sem Redis:** Fallback para escrita direta no banco (comportamento original).
3. **Erro na fila:** Fallback automático para sync.

### Configuração BullMQ
```typescript
{
  removeOnComplete: 100,   // mantém últimos 100 jobs concluídos
  removeOnFail: 500,       // mantém últimos 500 jobs falhados
  attempts: 3,             // 3 tentativas
  backoff: { type: 'exponential', delay: 1000 },
}
```

### Rollback
- Remover `QueuesModule` do `AppModule.imports`
- `AuditService` faz fallback automático para sync (`@Optional()` na injeção)

---

## 4. Logs Estruturados

### Status: ✅ IMPLEMENTADO NESTE SPRINT

### LoggerService
- **Produção:** JSON puro no console + arquivos rotativos
- **Desenvolvimento:** Console colorido com prefixo `[tenant:xxxxxxxx]`
- **Arquivos:** `logs/app-YYYY-MM-DD.log` (14d), `logs/error-YYYY-MM-DD.log` (30d)

### Formato JSON (produção)
```json
{
  "level": "info",
  "message": "📤 GET /api/pedidos | 45ms | OK",
  "service": "pub-system",
  "timestamp": "2026-04-24 15:30:00",
  "tenantId": "6fa1447d-3696-4496-90b2-ecc6113d6976",
  "method": "GET",
  "url": "/api/pedidos",
  "duration": 45,
  "status": "OK"
}
```

### LogMeta interface
```typescript
interface LogMeta {
  tenantId?: string;
  module?: string;
  [key: string]: any;
}
```

Qualquer service pode passar metadata:
```typescript
this.logger.log('Operação concluída', { tenantId, module: 'Pedidos', orderId: '...' });
```

### TenantLoggingInterceptor
- Intercepta todas as requisições HTTP
- Adiciona `tenantId` como campo estruturado nos logs JSON
- Console: `[tenant:6fa1447d] 📥 GET /api/pedidos | IP: 127.0.0.1`

---

## 5. Limites Atuais

| Recurso | Limite | Observação |
|---|---|---|
| DB connections | 10 max, 2 min | Pool TypeORM |
| Redis memory | 256MB | `allkeys-lru` eviction |
| VM RAM | 1GB | Oracle Free Tier |
| Cache entries | 500 (Redis) | TTL 1h default |
| Rate limit FREE | 60 req/min | Por tenant |
| Rate limit PRO | 300 req/min | Por tenant |
| Audit queue | 3 retries | Exponential backoff |
| Log retention | 14d app, 30d errors | DailyRotateFile |

---

## 6. Próximos Passos

1. **Notification queue:** Implementar processor para emails/push via fila `notifications`
2. **WebSocket scaling:** Usar Redis adapter para Socket.IO (múltiplas instâncias)
3. **Connection pooling:** PgBouncer na frente do PostgreSQL
4. **Horizontal scaling:** Load balancer com múltiplos containers backend
5. **Monitoring:** Dashboard de filas BullMQ (Bull Board)
6. **Feature flag cache:** Migrar FeatureGuard in-memory Map para Redis

---

## Rollback

Todas as alterações são retrocompatíveis:

| Componente | Rollback |
|---|---|
| **Redis cache** | Remove `REDIS_HOST` do `.env` → fallback in-memory |
| **BullMQ queues** | Remove `QueuesModule` → AuditService fallback sync |
| **Rate limiting** | Desabilitar via `@SkipRateLimit()` ou remover guard |
| **Structured logs** | Compatível com interface `NestLoggerService` padrão |
