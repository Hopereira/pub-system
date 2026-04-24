# Scale Plan — Pub System

> Plano de escala horizontal para múltiplas instâncias reais.

---

## Estágio Atual: Single-Node

- 1 container backend
- PostgreSQL com pool de 10 conexões
- Redis para cache e BullMQ
- WebSocket single-node
- Suporta ~5-20 tenants simultâneos

---

## Fase 1: Multi-Node Backend (5-50 tenants)

### Requisitos

1. **Socket.IO Redis Adapter** (já implementado)
   ```env
   SOCKET_IO_REDIS_ENABLED=true
   ```

2. **Load Balancer (nginx)**
   ```nginx
   upstream backend {
     # Sticky sessions para WebSocket
     ip_hash;
     server backend-1:3000;
     server backend-2:3000;
   }

   server {
     listen 80;

     location / {
       proxy_pass http://backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }

     # Health check para load balancer
     location /health {
       proxy_pass http://backend;
     }
   }
   ```

3. **Docker Compose multi-instância**
   ```yaml
   backend-1:
     image: pub-backend:latest
     environment:
       - SOCKET_IO_REDIS_ENABLED=true
     networks:
       - pub-network

   backend-2:
     image: pub-backend:latest
     environment:
       - SOCKET_IO_REDIS_ENABLED=true
     networks:
       - pub-network
   ```

### Validação

```bash
# Testar que WebSocket funciona cross-node
npm run load:test:ws

# Verificar que Redis adapter está ativo
curl http://backend-1:3000/internal/status | jq .featureFlags.socketIoRedis
curl http://backend-2:3000/internal/status | jq .featureFlags.socketIoRedis
```

---

## Fase 2: Connection Pooling (20-100 tenants)

### PgBouncer

```ini
# pgbouncer.ini
[databases]
pub_system = host=postgres port=5432 dbname=pub_system

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
```

### Docker Compose

```yaml
pgbouncer:
  image: edoburu/pgbouncer:latest
  environment:
    DB_USER: admin
    DB_PASSWORD: ${DB_PASSWORD}
    DB_HOST: postgres
    DB_NAME: pub_system
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 20
  ports:
    - "6432:6432"
  networks:
    - pub-network
```

### Configuração do backend

```env
DB_HOST=pgbouncer
DB_PORT=6432
```

> **ATENÇÃO:** Com `pool_mode=transaction`, prepared statements não funcionam.
> TypeORM deve usar `extra.prepareStatements: false`.

---

## Fase 3: Read Replicas (100+ tenants)

### Separação read/write

1. Primary: INSERT, UPDATE, DELETE
2. Replica(s): SELECT (maioria das queries)

```env
DB_HOST=primary-postgres
DB_READ_HOST=replica-postgres
```

Implementação requer TypeORM `replication` config:
```typescript
TypeOrmModule.forRoot({
  replication: {
    master: { host: 'primary', port: 5432, ... },
    slaves: [{ host: 'replica-1', port: 5432, ... }],
  },
})
```

---

## Fase 4: Microserviços (500+ tenants)

### Extração de serviços

| Serviço | Responsabilidade |
|---------|------------------|
| api-gateway | Auth, routing, rate limiting |
| pedido-service | CRUD pedidos + WebSocket |
| audit-service | BullMQ audit consumer |
| notification-service | Push + email |
| storage-service | GCS upload/download |

### Comunicação

- Sync: HTTP/gRPC entre serviços
- Async: BullMQ/Redis Streams entre serviços
- WebSocket: Serviço dedicado com Redis adapter

---

## Limites por Fase

| Métrica | Single-Node | Multi-Node | PgBouncer | Replicas |
|---------|-------------|------------|-----------|----------|
| Tenants | 5-20 | 20-50 | 50-100 | 100-500 |
| Conexões DB | 10 | 20/node | 200 pool | 200+ |
| WebSocket | 500 | 500/node | 500/node | dedicado |
| Instâncias | 1 | 2-4 | 2-4 | 4+ |
| RAM/instância | 512MB | 512MB | 512MB | 512MB |

---

## Checklist Pré-Escala

1. ☐ RLS ativo (`RLS_ENABLED=true`)
2. ☐ Redis adapter ativo (`SOCKET_IO_REDIS_ENABLED=true`)
3. ☐ Smoke tests passando em todas as instâncias
4. ☐ Health checks configurados no load balancer
5. ☐ Backup automatizado
6. ☐ Monitoramento ativo (Sentry + alertas)
7. ☐ Slow query threshold adequado
8. ☐ Connection pool adequado para número de tenants

---

## Riscos Residuais

| Risco | Mitigação |
|-------|-----------|
| VM Oracle tem 1GB RAM | Nunca build na VM. Scale horizontal. |
| Cache in-memory não compartilhado | Migrar para Redis cache em multi-node. |
| Scheduled jobs executam em todas instâncias | Implementar distributed lock com Redis. |
| File uploads via GCS | GCS é naturalmente distribuído. |
| Sessions JWT stateless | Já funciona multi-node. |
