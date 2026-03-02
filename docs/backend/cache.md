# Cache

## Configuracao

O modulo de cache esta em `backend/src/cache/cache.module.ts` (`AppCacheModule`).

O sistema suporta dois modos:

| Modo | Quando usar | Configuracao |
|------|-------------|--------------|
| In-memory | Desenvolvimento / VM com pouca RAM | Padrao (sem Redis) |
| Redis | Producao com Redis disponivel | Definir `REDIS_HOST` e `REDIS_PORT` |

## Uso nos Services

Os services injetam `CACHE_MANAGER` e usam `get`/`set`/`del`:

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

// Buscar do cache
const cached = await this.cacheManager.get(key);

// Salvar no cache
await this.cacheManager.set(key, value, ttl);

// Invalidar
await this.cacheManager.del(key);
```

## TTL por Recurso

| Recurso | TTL | Motivo |
|---------|-----|--------|
| Comandas | 300s (5 min) | Dados mudam com frequencia moderada |
| Produtos | 600s (10 min) | Cardapio muda raramente |
| Ambientes | 600s (10 min) | Configuracao estatica |
| Mesas | 300s (5 min) | Status muda com frequencia |

## Chaves de Cache — Isolamento Multi-Tenant

Todas as chaves seguem o formato: `{entidade}:{tenantId}:{params}`

Exemplo: `produtos:550e8400-e29b-41d4-a716-446655440001:page:1:limit:20`

**Regras:**
- Sem tenantId = sem cache (retorna `null`, nao usa namespace `:global:`)
- Invalidacao via `CacheInvalidationService` (nunca chaves hardcoded)
- `generateCacheKey()` retorna `null` se nao houver tenant no contexto

## Invalidacao

O cache e invalidado automaticamente em operacoes de escrita (create, update, delete). O padrao e:

1. Executar a operacao no banco
2. `CacheInvalidationService` invalida por pattern `{entidade}:{tenantId}:*`
3. Retornar o resultado

## Monitoramento

O fluxo de invalidacao esta documentado em detalhe no arquivo `docs/historico/FLUXO-INVALIDACAO-CACHE.md` (referencia historica).
