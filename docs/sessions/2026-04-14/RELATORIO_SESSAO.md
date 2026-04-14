# Relatório de Sessão — 14/04/2026

## Objetivo
Corrigir o bug onde pedidos feitos pelo cliente (rota pública `POST /pedidos/cliente`) não apareciam no painel do cozinheiro (`/dashboard/operacional/[ambienteId]`).

---

## Diagnóstico

### Root Cause 1 — Frontend: `OperacionalClientPage.tsx` (cenário WebSocket)

Quando o painel do cozinheiro está aberto e um pedido chega via WebSocket (`novo_pedido_ambiente:{ambienteId}`), o hook `useAmbienteNotification` seta `novoPedidoRecebido`. O `useEffect` correspondente chamava **apenas** `fetchDados()` — um re-fetch do servidor.

**Problema:** se o cache do backend ainda não foi invalidado no momento em que o `fetchDados()` é executado, a resposta do servidor retorna `[]` (stale cache), e o pedido não aparece.

**Comparação:** `CozinhaPageClient.tsx` e `PreparoPedidos.tsx` atualizam o estado **diretamente** com o pedido recebido via WebSocket, sem depender do cache. `OperacionalClientPage.tsx` não fazia isso.

### Root Cause 2 — Backend: `pedido.service.ts` `create()` (cenário carga inicial)

O método `PedidoService.getTenantId()` não verifica `request.tenant.id` (que é setado pelo `TenantInterceptor` a partir do subdomínio, mesmo para rotas públicas). Para `POST /pedidos/cliente` (rota `@Public()`), se o `TenantContextService` não estiver populado, `getTenantId()` retorna `null`.

Quando `invalidatePedidos()` é chamado com `tenantId = null`, ele aborta silenciosamente:
```
⚠️ Não é possível invalidar cache de pedidos sem tenant
```

O `CacheInvalidationService.getTenantId()` **tem** o fallback para `request.tenant.id`, mas `PedidoService.getTenantId()` não controla a chamada de `invalidatePedidos()` diretamente — e o `CacheInvalidationService` é uma instância separada (injetada). Garantir que a invalidação use o `tenantId` da comanda (que sempre estará disponível) é a abordagem mais robusta.

**Consequência:** cache com `[]` persiste → cozinheiro abre o painel após o pedido ser criado → `GET /pedidos?ambienteId=X` retorna cache stale → mostra 0 pedidos.

---

## Correções Aplicadas

### Fix 1 — `frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx`

Alterado o `useEffect` que reage ao `novoPedidoRecebido` para:
1. Atualizar o estado React **diretamente** com o pedido recebido (sem cache)
2. Chamar `fetchDados()` em background apenas para consistência

```typescript
// Antes:
useEffect(() => {
  if (novoPedidoRecebido) {
    fetchDados();
  }
}, [novoPedidoRecebido]);

// Depois:
useEffect(() => {
  if (novoPedidoRecebido) {
    setPedidos(prev => {
      const existe = prev.find(p => p.id === novoPedidoRecebido.id);
      if (existe) return prev.map(p => p.id === novoPedidoRecebido.id ? novoPedidoRecebido : p);
      return [novoPedidoRecebido, ...prev];
    });
    fetchDados();
  }
}, [novoPedidoRecebido]);
```

**Padrão alinhado com:** `CozinhaPageClient.tsx` e `PreparoPedidos.tsx`.

---

### Fix 2 — `backend/src/modulos/pedido/pedido.service.ts` — método `create()`

Adicionado invalidação explícita de cache usando `comanda.tenantId` após a chamada existente de `invalidatePedidos()`:

```typescript
await this.cacheInvalidationService.invalidatePedidos();
// Fallback explícito: usa tenantId da comanda para garantir invalidação em rotas públicas
if (comanda.tenantId) {
  await this.cacheInvalidationService.invalidatePattern(`pedidos:${comanda.tenantId}:*`);
}
```

Esta chamada é **idempotente**: se `invalidatePedidos()` já invalidou as chaves, `invalidatePattern` não encontrará nada e retornará 0. Se `invalidatePedidos()` falhou silenciosamente, a segunda chamada garante a invalidação.

---

## Arquivos Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx` | Frontend | Atualização direta de estado via WebSocket |
| `backend/src/modulos/pedido/pedido.service.ts` | Backend | Invalidação de cache garantida via `comanda.tenantId` |

---

## Fluxo Corrigido

```
Cliente faz pedido (POST /pedidos/cliente)
  → Backend cria pedido
  → invalidatePedidos() [pode falhar silenciosamente se tenantId null]
  → invalidatePattern(`pedidos:${comanda.tenantId}:*`) [NOVO - garantia]
  → emitNovoPedido(pedidoCompleto) → emite para tenant room
  
Cozinheiro recebe evento WebSocket (novo_pedido_ambiente:{ambienteId})
  → novoPedidoRecebido = pedido
  → setPedidos([pedido, ...prev]) [NOVO - direto, sem cache]
  → fetchDados() em background [consistência]
  → Pedido aparece imediatamente ✅
  
Cozinheiro abre painel APÓS pedido criado (carga inicial)
  → GET /pedidos?ambienteId=X
  → Cache MISS (foi invalidado pelo Fix 2)
  → DB query retorna pedido ✅
```

---

## Notas Importantes

- O `CacheInvalidationService.trackedKeys` (static Set) persiste enquanto o container estiver rodando. Após reinício do container, o Set é resetado, mas o cache in-memory também é resetado — não há inconsistência.
- O Fix 2 é redundante quando `invalidatePedidos()` funciona corretamente, mas não causa nenhum efeito colateral negativo.
- Ambos os fixes precisam ser deployados (commit + push → CI/CD).
