# 🖥️ Auditoria Frontend - Integração e UX do Módulo de Pedidos

**Data:** 11/12/2024  
**Auditor:** Engenheiro Frontend Sênior (React/Next.js)  
**Arquivo Principal:** `frontend/src/services/pedidoService.ts`

---

## 📊 Resumo Executivo

| Categoria | Status | Observações |
|-----------|--------|-------------|
| **Integração API** | ✅ OK | URLs e métodos HTTP corretos |
| **Tipos TypeScript** | ⚠️ PARCIAL | 3 problemas de tipagem |
| **Feedback Visual (Loading)** | ✅ BOM | Estados implementados |
| **Tratamento de Erros** | ✅ BOM | Toast em todos os fluxos |
| **Responsividade** | ✅ BOM | Classes md:, lg: presentes |
| **Falhas Silenciosas** | 🔴 CRÍTICO | 5 pontos identificados |

---

## ✅ 1. INTEGRAÇÃO API - VERIFICAÇÃO

### Comparação Frontend vs Backend

| Função Frontend | Método | URL Frontend | URL Backend | Status |
|-----------------|--------|--------------|-------------|--------|
| `adicionarItensAoPedido` | POST | `/pedidos` | `POST /pedidos` | ✅ OK |
| `createPedidoFromCliente` | POST | `/pedidos/cliente` | `POST /pedidos/cliente` | ✅ OK |
| `getPedidos` | GET | `/pedidos` | `GET /pedidos` | ✅ OK |
| `getPedidosPorAmbiente` | GET | `/pedidos?ambienteId=` | `GET /pedidos?ambienteId=` | ✅ OK |
| `updateItemStatus` | PATCH | `/pedidos/item/:id/status` | `PATCH /pedidos/item/:itemPedidoId/status` | ✅ OK |
| `updatePedidoStatus` | PATCH | `/pedidos/:id/status` | ❌ NÃO EXISTE | 🔴 OBSOLETO |
| `getPedidosProntos` | GET | `/pedidos/prontos` | `GET /pedidos/prontos` | ✅ OK |
| `deixarNoAmbiente` | PATCH | `/pedidos/item/:id/deixar-no-ambiente` | `PATCH /pedidos/item/:id/deixar-no-ambiente` | ✅ OK |
| `criarPedidoGarcom` | POST | `/pedidos/garcom` | `POST /pedidos/garcom` | ✅ OK |
| `retirarItem` | PATCH | `/pedidos/item/:id/retirar` | `PATCH /pedidos/item/:id/retirar` | ✅ OK |
| `marcarComoEntregue` | PATCH | `/pedidos/item/:id/marcar-entregue` | `PATCH /pedidos/item/:id/marcar-entregue` | ✅ OK |

### 🔴 Problema: Função Obsoleta
```typescript
// pedidoService.ts:147 - FUNÇÃO OBSOLETA
export const updatePedidoStatus = async (id: string, data: UpdatePedidoStatusDto): Promise<Pedido> => {
  // ⚠️ Esta rota NÃO EXISTE no backend!
  // O backend usa updateItemStatus para atualizar itens individualmente
  const response = await api.patch<Pedido>(`/pedidos/${id}/status`, data);
```
**Recomendação:** Remover ou marcar como `@deprecated` com aviso de compilação.

---

## ⚠️ 2. TIPOS TYPESCRIPT - PROBLEMAS

### 2.1 Retorno `any` em funções
```typescript
// pedidoService.ts:124
export const updateItemStatus = async (...): Promise<any> => { ... }

// pedidoService.ts:169
export const getPedidosProntos = async (...): Promise<any[]> => { ... }

// pedidoService.ts:193
export const deixarNoAmbiente = async (...): Promise<any> => { ... }

// pedidoService.ts:257
export const retirarItem = async (...): Promise<any> => { ... }

// pedidoService.ts:288
export const marcarComoEntregue = async (...): Promise<any> => { ... }
```
**Problema:** Perda de type-safety, autocomplete não funciona.

**Recomendação:** Criar interfaces específicas:
```typescript
interface ItemPedidoAtualizado {
  id: string;
  status: PedidoStatus;
  tempoReacaoMinutos?: number;
  tempoEntregaFinalMinutos?: number;
}
```

### 2.2 Import de enum duplicado
```typescript
// pedido.dto.ts:3
import { PedidoStatus } from './pedido-status.enum';

// pedido.ts:7
export enum PedidoStatus { ... }
```
**Problema:** Dois arquivos definem o mesmo enum, pode causar inconsistência.

**Recomendação:** Usar apenas `pedido-status.enum.ts` como fonte única.

### 2.3 Interface `ItemPedido` incompleta em `PedidoProntoCard`
```typescript
// PedidoProntoCard.tsx:9-16 - Interface local simplificada
interface ItemPedido {
  id: string;
  produto: { nome: string; };
  quantidade: number;
  observacao?: string;
}
```
**Problema:** Não usa a interface global, pode divergir.

**Recomendação:** Importar de `@/types/pedido`.

---

## ✅ 3. FEEDBACK VISUAL (LOADING/isPending)

### PreparoPedidos.tsx
| Estado | Implementado | Código |
|--------|--------------|--------|
| `isLoading` | ✅ | Skeleton animado (linhas 208-218) |
| `isRefreshing` | ✅ | Spinner no botão + skeleton (linhas 303-312) |
| Botão desabilitado | ✅ | `disabled={isRefreshing}` (linha 264) |

### MapaPedidos.tsx
| Estado | Implementado | Código |
|--------|--------------|--------|
| `isLoading` | ✅ | Skeleton animado (linhas 351-361) |
| `isRefreshing` | ✅ | Spinner no botão (linha 385) |
| Botão desabilitado | ✅ | `disabled={isRefreshing}` (linha 383) |

### PedidoCard.tsx (Cozinha)
| Estado | Implementado | Código |
|--------|--------------|--------|
| Loading nos botões | ❌ | **FALTANDO** - Botões não têm estado de loading |

**Problema:** Ao clicar em "Iniciar" ou "Pronto", o botão não mostra loading.

**Recomendação:**
```tsx
const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

<Button 
  disabled={loadingItemId === item.id}
  onClick={async () => {
    setLoadingItemId(item.id);
    await onItemStatusChange(item.id, PedidoStatus.EM_PREPARO);
    setLoadingItemId(null);
  }}
>
  {loadingItemId === item.id ? <Spinner /> : <Play />}
  Iniciar
</Button>
```

---

## ✅ 4. TRATAMENTO DE ERROS

### PreparoPedidos.tsx
```typescript
// Linha 121-126 - Erro ao carregar ambientes
} catch (error) {
  logger.error('Erro ao carregar ambientes', { ... });
  toast.error('Erro ao carregar ambientes'); // ✅ Toast amigável
}

// Linha 167-169 - Erro ao atualizar status
} catch (err: any) {
  toast.error(err.message || 'Falha ao atualizar o status do item.'); // ✅ Toast amigável
}
```

### MapaPedidos.tsx
```typescript
// Linha 199-206 - Erro ao retirar item
} catch (error) {
  const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  toast.error(errorMessage || 'Erro ao retirar item'); // ✅ Extrai mensagem do backend
}

// Linha 226-233 - Erro ao marcar entregue
} catch (error) {
  const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  toast.error(errorMessage || 'Erro ao marcar como entregue'); // ✅ Extrai mensagem do backend
}
```

### pedidoService.ts
```typescript
// Todas as funções têm try/catch com:
} catch (error) {
  logger.error('Erro ao...', { module: 'PedidoService', error: error as Error });
  throw error; // ✅ Re-throw para o componente tratar
}
```

**Avaliação:** ✅ Tratamento de erros bem implementado em todos os fluxos.

---

## ✅ 5. RESPONSIVIDADE (Tailwind)

### PreparoPedidos.tsx
```tsx
// Linha 212 - Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Linha 224 - Flex responsivo
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

// Linha 257 - Texto oculto em mobile
<span className="hidden md:inline">Notificações ativas</span>

// Linha 321 - Kanban responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### MapaPedidos.tsx
```tsx
// Linha 355 - Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">

// Linha 367 - Flex responsivo
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

// Linha 399 - Filtros responsivos
<CardContent className="flex flex-col md:flex-row gap-4">

// Linha 442 - Métricas responsivas
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

// Linha 547 - Lista de pedidos responsiva
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
```

**Avaliação:** ✅ Responsividade bem implementada com breakpoints adequados.

---

## 🔴 6. PONTOS DE FALHA SILENCIOSA

### 6.1 WebSocket Desconectado sem Aviso Visual
**Arquivo:** `MapaPedidos.tsx`
```typescript
const { novoPedido, pedidoAtualizado, isConnected } = usePedidosSubscription();
// isConnected é usado apenas para polling, não há indicador visual
```
**Problema:** Usuário não sabe se está recebendo atualizações em tempo real.

**Recomendação:**
```tsx
{!isConnected && (
  <Badge variant="destructive" className="animate-pulse">
    ⚠️ Modo Offline - Atualizando a cada 60s
  </Badge>
)}
```

### 6.2 Produto Removido sem Tratamento Adequado
**Arquivo:** `MapaPedidos.tsx:588`
```tsx
<p className="font-medium text-sm">{item.produto?.nome || 'Produto removido'}</p>
```
**Problema:** Se `item.produto` for `null`, mostra "Produto removido" mas os botões de ação ainda aparecem.

**Recomendação:** Desabilitar ações para produtos removidos:
```tsx
{item.produto && item.status === PedidoStatus.PRONTO && (
  <Button onClick={() => handleRetirarItem(item.id)}>Retirar</Button>
)}
```

### 6.3 Erro de Som Silencioso
**Arquivo:** `MapaPedidos.tsx:120-121`
```typescript
const audio = new Audio('/sounds/notification.mp3');
audio.play().catch(() => { /* Erro silencioso ao tocar som */ });
```
**Problema:** Se o arquivo de som não existir, falha silenciosamente.

**Recomendação:** Verificar existência do arquivo ou usar fallback:
```typescript
audio.play().catch((e) => {
  logger.warn('Som de notificação não disponível', { error: e });
});
```

### 6.4 Validação de UUID Retorna Array Vazio
**Arquivo:** `pedidoService.ts:93-100`
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(ambienteId)) {
  logger.warn('⚠️ ambienteId inválido, retornando array vazio', { ... });
  return []; // ❌ Falha silenciosa para o usuário
}
```
**Problema:** Usuário vê lista vazia sem saber que o ID é inválido.

**Recomendação:** Lançar erro ou retornar objeto com flag:
```typescript
if (!uuidRegex.test(ambienteId)) {
  throw new Error('ID de ambiente inválido');
}
```

### 6.5 Botões sem Estado de Loading Individual
**Arquivo:** `PedidoCard.tsx` (Cozinha)
```tsx
<Button size="sm" onClick={() => onItemStatusChange(item.id, PedidoStatus.EM_PREPARO)}>
  <Play className='h-4 w-4 mr-2' />
  Iniciar
</Button>
```
**Problema:** Usuário pode clicar múltiplas vezes enquanto aguarda resposta.

**Recomendação:** Adicionar estado de loading por item (ver seção 3).

---

## 📋 RESUMO DE CORREÇÕES NECESSÁRIAS

### Prioridade 1 - CRÍTICO
1. ❌ Adicionar indicador visual de conexão WebSocket
2. ❌ Adicionar loading nos botões do `PedidoCard`
3. ❌ Tratar produtos removidos (desabilitar ações)

### Prioridade 2 - ALTA
4. ⚠️ Remover função obsoleta `updatePedidoStatus`
5. ⚠️ Tipar retornos de funções (remover `any`)
6. ⚠️ Unificar enum `PedidoStatus` em arquivo único

### Prioridade 3 - MÉDIA
7. ⚠️ Usar interface global `ItemPedido` em `PedidoProntoCard`
8. ⚠️ Melhorar tratamento de UUID inválido
9. ⚠️ Adicionar log quando som falhar

---

## 🎯 Matriz de Componentes Auditados

| Componente | Loading | Erros | Responsivo | WebSocket | Status |
|------------|:-------:|:-----:|:----------:|:---------:|:------:|
| PreparoPedidos | ✅ | ✅ | ✅ | ✅ | ✅ |
| MapaPedidos | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| PedidoCard (Cozinha) | ❌ | ✅ | ✅ | N/A | ⚠️ |
| PedidoProntoCard | N/A | N/A | ✅ | N/A | ⚠️ |
| pedidoService | N/A | ✅ | N/A | N/A | ⚠️ |

---

*Auditoria realizada em 11/12/2024*
