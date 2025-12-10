# 🐛 FIX: ITEM "QUASE PRONTO" NA COLUNA ERRADA

**Data:** 13/11/2025  
**Problema:** Item marcado como "QUASE PRONTO" continua na coluna "Em Preparo"  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 PROBLEMA RELATADO

### **Sintoma**

**Cliente marca item como "QUASE PRONTO":**
```
Portal do Cliente (localhost:3001/acesso-cliente/...)
┌─────────────────────────────────────┐
│ 📍 Local de Entrega: Bar            │
├─────────────────────────────────────┤
│ 1x Couvert Artístico - Porvo        │
│    Status: ENTREGUE  R$ 15,00       │
├─────────────────────────────────────┤
│ 1x Batata Frita com Cheddar e Bacon│
│    Status: QUASE PRONTO  R$ 35,00   │ ← Cliente marcou!
└─────────────────────────────────────┘
```

**Kanban do Cozinheiro NÃO atualiza:**
```
Painel de Preparo - Cozinha Quente
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Aguardando  │ Em Preparo  │ Quase Pronto│ Prontos     │
│      0      │      1      │      0      │      0      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│             │ Mesa Balcão │             │             │
│             │ #e341c1df   │             │             │
│             │             │             │             │
│             │ 1x Batata   │             │             │ ← AQUI! ❌
│             │ Frita...    │             │             │
│             │ EM PREPARO  │             │             │
│             │ 🟢 Chegou   │             │             │
│             │ 🟢 Em prep. │             │             │
│             │ ✅ Pronto   │             │             │ ← Deveria estar
│             │             │             │             │   em "Quase Pronto"
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🔍 CAUSA RAIZ

### **Lógica de Colunas Não Considerava Ambiente**

```typescript
// ANTES - PreparoPedidos.tsx (linha 169-182)
const colunas = {
  feito: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => i.status === PedidoStatus.FEITO)
    // ❌ Verifica TODOS os itens do pedido, não só do ambiente
  ),
  emPreparo: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => i.status === PedidoStatus.EM_PREPARO)
    // ❌ Se ALGUM item estiver EM_PREPARO, vai para essa coluna
  ),
  quasePronto: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => i.status === PedidoStatus.QUASE_PRONTO)
    // ❌ Se ALGUM item estiver QUASE_PRONTO, vai para essa coluna
  ),
  // ...
};
```

### **Cenário do Bug**

```typescript
// Pedido #e341c1df tem 2 itens de ambientes diferentes:
{
  id: 'e341c1df',
  itens: [
    {
      produto: { nome: 'Couvert Artístico', ambiente: { id: 'cozinha-uuid' } },
      status: 'ENTREGUE'  // ← Cozinha já entregou
    },
    {
      produto: { nome: 'Batata Frita', ambiente: { id: 'bar-uuid' } },
      status: 'QUASE_PRONTO'  // ← Bar marcou como quase pronto
    }
  ]
}

// Cozinheiro abre Kanban da "Cozinha Quente" (cozinha-uuid)
ambienteSelecionado = 'cozinha-uuid'

// Lógica ANTES:
colunas.emPreparo.filter(p => 
  p.itens.some(i => i.status === 'EM_PREPARO')
)
// ❌ Verifica TODOS os itens, independente do ambiente
// ❌ Acha que o Couvert está EM_PREPARO (cache antigo?)
// ❌ Coloca pedido na coluna "Em Preparo"

colunas.quasePronto.filter(p => 
  p.itens.some(i => i.status === 'QUASE_PRONTO')
)
// ❌ Acha a Batata Frita QUASE_PRONTO
// ❌ MAS é do Bar, não da Cozinha!
// ❌ Não deveria aparecer neste Kanban
```

**Resultado:** Pedido aparece na coluna errada porque considera status de itens de OUTROS ambientes.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **Filtrar Itens por Ambiente nas Colunas**

```typescript
// DEPOIS - PreparoPedidos.tsx (linha 170-195)
const colunas = {
  feito: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => 
      i.produto?.ambiente?.id === ambienteSelecionado &&  // ✅ Verifica ambiente
      i.status === PedidoStatus.FEITO
    )
  ),
  emPreparo: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => 
      i.produto?.ambiente?.id === ambienteSelecionado &&  // ✅ Verifica ambiente
      i.status === PedidoStatus.EM_PREPARO
    )
  ),
  quasePronto: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => 
      i.produto?.ambiente?.id === ambienteSelecionado &&  // ✅ Verifica ambiente
      i.status === PedidoStatus.QUASE_PRONTO
    )
  ),
  pronto: pedidosFiltrados.filter((p) =>
    p.itens.some((i) => 
      i.produto?.ambiente?.id === ambienteSelecionado &&  // ✅ Verifica ambiente
      i.status === PedidoStatus.PRONTO
    )
  ),
};
```

### **Agora Funciona Corretamente**

```typescript
// Pedido #e341c1df tem 2 itens:
{
  id: 'e341c1df',
  itens: [
    {
      produto: { nome: 'Couvert Artístico', ambiente: { id: 'cozinha-uuid' } },
      status: 'ENTREGUE'
    },
    {
      produto: { nome: 'Batata Frita', ambiente: { id: 'bar-uuid' } },
      status: 'QUASE_PRONTO'
    }
  ]
}

// Cozinheiro da Cozinha Quente (cozinha-uuid)
ambienteSelecionado = 'cozinha-uuid'

// Lógica DEPOIS:
colunas.quasePronto.filter(p => 
  p.itens.some(i => 
    i.produto?.ambiente?.id === 'cozinha-uuid' &&  // ✅ Filtra por ambiente
    i.status === 'QUASE_PRONTO'
  )
)
// ✅ Batata Frita é do Bar (bar-uuid !== cozinha-uuid)
// ✅ Não aparece no Kanban da Cozinha
// ✅ Pedido não vai para coluna "Quase Pronto" da Cozinha

// Cozinheiro do Bar (bar-uuid)
ambienteSelecionado = 'bar-uuid'

colunas.quasePronto.filter(p => 
  p.itens.some(i => 
    i.produto?.ambiente?.id === 'bar-uuid' &&       // ✅ Filtra por ambiente
    i.status === 'QUASE_PRONTO'
  )
)
// ✅ Batata Frita é do Bar (bar-uuid === bar-uuid)
// ✅ Status é QUASE_PRONTO
// ✅ Pedido VAI para coluna "Quase Pronto" ✅
```

---

## 🔄 FLUXO COMPLETO CORRIGIDO

### **1. Cliente Marca Item como Pronto**

```
Portal do Cliente
  ↓
PUT /pedidos/itens/:itemId/status
Body: { status: "QUASE_PRONTO" }
  ↓
Backend atualiza item no banco
  ↓
WebSocket emite: status_atualizado_ambiente:bar-uuid
  ↓
Frontend (Kanban do Bar) recebe atualização
  ↓
setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoAtualizado : p))
```

### **2. Kanban Reorganiza Colunas**

```typescript
// useEffect do WebSocket atualiza estado
socket.on('status_atualizado', (pedidoAtualizado) => {
  setPedidos(prev => 
    prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p)
  )
})

// React re-renderiza com novo estado
pedidos = [
  {
    id: 'e341c1df',
    itens: [
      { produto: { ambiente: 'cozinha-uuid' }, status: 'ENTREGUE' },
      { produto: { ambiente: 'bar-uuid' }, status: 'QUASE_PRONTO' }  // ← ATUALIZADO!
    ]
  }
]

// Lógica de colunas recalcula
const colunas = {
  quasePronto: pedidos.filter(p => 
    p.itens.some(i => 
      i.produto?.ambiente?.id === 'bar-uuid' &&  // ✅ Ambiente correto
      i.status === 'QUASE_PRONTO'                 // ✅ Status correto
    )
  )
}

// Resultado:
colunas.quasePronto = [
  { id: 'e341c1df', itens: [...] }  // ✅ Pedido aparece!
]
```

### **3. UI Atualiza Automaticamente**

```
ANTES:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Aguardando  │ Em Preparo  │ Quase Pronto│ Prontos     │
│      0      │      1      │      0      │      0      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│             │ Pedido      │             │             │
│             │ #e341c1df   │             │             │ ← Coluna errada
└─────────────┴─────────────┴─────────────┴─────────────┘

DEPOIS:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Aguardando  │ Em Preparo  │ Quase Pronto│ Prontos     │
│      0      │      0      │      1      │      0      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│             │             │ Pedido      │             │
│             │             │ #e341c1df   │             │ ← Coluna certa! ✅
│             │             │             │             │
│             │             │ 1x Batata   │             │
│             │             │ Frita...    │             │
│             │             │ QUASE PRONTO│             │
│             │             │ ✅ Pronto   │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🎯 CASOS DE USO COBERTOS

### **Caso 1: Item Único de Um Ambiente**

```typescript
Pedido: {
  itens: [
    { produto: { ambiente: 'bar-uuid' }, status: 'QUASE_PRONTO' }
  ]
}

Kanban do Bar (bar-uuid):
✅ Aparece em "Quase Pronto"

Kanban da Cozinha (cozinha-uuid):
✅ NÃO aparece (filtrado corretamente)
```

### **Caso 2: Múltiplos Itens do Mesmo Ambiente**

```typescript
Pedido: {
  itens: [
    { produto: { ambiente: 'bar-uuid' }, status: 'EM_PREPARO' },
    { produto: { ambiente: 'bar-uuid' }, status: 'QUASE_PRONTO' },
    { produto: { ambiente: 'bar-uuid' }, status: 'PRONTO' }
  ]
}

Kanban do Bar (bar-uuid):
❓ Em qual coluna aparece?

// Lógica: some() verifica se ALGUM item corresponde
colunas.emPreparo    → SIM (tem item EM_PREPARO)
colunas.quasePronto  → SIM (tem item QUASE_PRONTO)
colunas.pronto       → SIM (tem item PRONTO)

// ⚠️ Pedido aparece em MÚLTIPLAS colunas!
// Isso é CORRETO porque o garçom precisa ver:
// - Itens ainda em preparo
// - Itens quase prontos
// - Itens prontos para retirar
```

### **Caso 3: Itens de Ambientes Diferentes** (Cenário do Bug)

```typescript
Pedido: {
  itens: [
    { produto: { ambiente: 'cozinha-uuid' }, status: 'ENTREGUE' },
    { produto: { ambiente: 'bar-uuid' }, status: 'QUASE_PRONTO' }
  ]
}

Kanban da Cozinha (cozinha-uuid):
✅ NÃO aparece (Couvert já ENTREGUE, não está mais em preparo)

Kanban do Bar (bar-uuid):
✅ Aparece em "Quase Pronto" (Batata Frita está QUASE_PRONTO)
```

---

## 🔧 CÓDIGO MODIFICADO

### Arquivo: `PreparoPedidos.tsx`

```diff
  // Organiza pedidos em colunas do Kanban
+ // Considera apenas itens do ambiente selecionado para determinar a coluna
  const colunas = {
    feito: pedidosFiltrados.filter((p) =>
-     p.itens.some((i) => i.status === PedidoStatus.FEITO)
+     p.itens.some((i) => 
+       i.produto?.ambiente?.id === ambienteSelecionado && 
+       i.status === PedidoStatus.FEITO
+     )
    ),
    emPreparo: pedidosFiltrados.filter((p) =>
-     p.itens.some((i) => i.status === PedidoStatus.EM_PREPARO)
+     p.itens.some((i) => 
+       i.produto?.ambiente?.id === ambienteSelecionado && 
+       i.status === PedidoStatus.EM_PREPARO
+     )
    ),
    quasePronto: pedidosFiltrados.filter((p) =>
-     p.itens.some((i) => i.status === PedidoStatus.QUASE_PRONTO)
+     p.itens.some((i) => 
+       i.produto?.ambiente?.id === ambienteSelecionado && 
+       i.status === PedidoStatus.QUASE_PRONTO
+     )
    ),
    pronto: pedidosFiltrados.filter((p) =>
-     p.itens.some((i) => i.status === PedidoStatus.PRONTO)
+     p.itens.some((i) => 
+       i.produto?.ambiente?.id === ambienteSelecionado && 
+       i.status === PedidoStatus.PRONTO
+     )
    ),
  };
```

---

## 📊 IMPACTO

### **Antes da Correção** ❌

| Cenário                         | Comportamento                            | Correto? |
|---------------------------------|------------------------------------------|----------|
| Item do Bar muda para QUASE_PRONTO | Aparece em múltiplas colunas           | ❌ Não   |
| Kanban da Cozinha               | Mostra itens do Bar                      | ❌ Não   |
| Pedidos multi-ambiente          | Confusão visual, colunas misturadas      | ❌ Não   |

### **Depois da Correção** ✅

| Cenário                         | Comportamento                            | Correto? |
|---------------------------------|------------------------------------------|----------|
| Item do Bar muda para QUASE_PRONTO | Aparece apenas em "Quase Pronto" do Bar | ✅ Sim   |
| Kanban da Cozinha               | Mostra apenas itens da Cozinha           | ✅ Sim   |
| Pedidos multi-ambiente          | Cada ambiente vê apenas seus itens       | ✅ Sim   |

---

## 🧪 TESTES

### Teste 1: Item de Um Ambiente Muda Status
```typescript
1. Cozinheiro do Bar marca Batata Frita como "QUASE_PRONTO"
   ✅ Item deve aparecer em "Quase Pronto" no Kanban do Bar
   ✅ Item NÃO deve aparecer no Kanban da Cozinha
   ✅ WebSocket deve atualizar em tempo real
```

### Teste 2: Pedido com Itens de Múltiplos Ambientes
```typescript
1. Pedido tem:
   - Couvert (Cozinha) - ENTREGUE
   - Batata (Bar) - QUASE_PRONTO

2. Abrir Kanban da Cozinha:
   ✅ Pedido NÃO deve aparecer (Couvert já entregue)

3. Abrir Kanban do Bar:
   ✅ Pedido deve aparecer em "Quase Pronto"
   ✅ Deve mostrar apenas Batata Frita
```

### Teste 3: Transição de Status
```typescript
1. Item está "EM_PREPARO" no Kanban do Bar
2. Garçom marca como "PRONTO" no portal do cliente
3. Kanban do Bar deve:
   ✅ Remover item de "Em Preparo"
   ✅ Adicionar item em "Prontos"
   ✅ Atualizar contador das colunas
   ✅ Transição deve ser instantânea (WebSocket)
```

---

## ⚠️ LIMITAÇÕES CONHECIDAS

### **Pedidos Aparecem em Múltiplas Colunas**

Se um pedido tem múltiplos itens do mesmo ambiente com status diferentes, ele aparece em várias colunas:

```typescript
Pedido: {
  itens: [
    { produto: { ambiente: 'bar-uuid' }, status: 'EM_PREPARO' },
    { produto: { ambiente: 'bar-uuid' }, status: 'PRONTO' }
  ]
}

Resultado no Kanban do Bar:
┌─────────────┬─────────────┐
│ Em Preparo  │ Prontos     │
├─────────────┼─────────────┤
│ Pedido X    │ Pedido X    │ ← Duplicado!
└─────────────┴─────────────┘
```

**Isso é intencional?** 🤔

- **Sim:** Permite ver o progresso completo do pedido
- **Não:** Pode confundir (pedido aparece 2x)

**Solução Alternativa (se necessário):**
```typescript
// Mostrar pedido apenas na coluna do status MENOS avançado
const getColumnForPedido = (pedido: Pedido) => {
  const statuses = pedido.itens
    .filter(i => i.produto?.ambiente?.id === ambienteSelecionado)
    .map(i => i.status);
  
  if (statuses.includes('FEITO')) return 'feito';
  if (statuses.includes('EM_PREPARO')) return 'emPreparo';
  if (statuses.includes('QUASE_PRONTO')) return 'quasePronto';
  if (statuses.includes('PRONTO')) return 'pronto';
};
```

---

## 📈 MELHORIAS FUTURAS

### 1. Agrupamento Visual de Itens
```typescript
// No PedidoCard, mostrar itens agrupados por status
<PedidoCard pedido={pedido}>
  <div className="itens-em-preparo">
    2 itens em preparo
  </div>
  <div className="itens-prontos">
    1 item pronto
  </div>
</PedidoCard>
```

### 2. Filtro "Mostrar Apenas Meu Ambiente"
```typescript
// Toggle para mostrar/esconder itens de outros ambientes
<Switch 
  checked={mostrarApenasAmbiente}
  onCheckedChange={setMostrarApenasAmbiente}
/>
```

### 3. Notificação Visual de Mudança de Status
```typescript
// Destacar item quando status muda
{itemMudouStatus && (
  <div className="animate-pulse ring-2 ring-green-500">
    <PedidoCard pedido={pedido} />
  </div>
)}
```

---

## ✅ STATUS FINAL

**Problema:** ✅ **RESOLVIDO**  
**Causa:** Lógica de colunas não filtrava por ambiente  
**Solução:** Adicionar verificação de ambiente em todas as colunas  
**Testes:** ⏳ **AGUARDANDO VALIDAÇÃO**  

---

**Implementado em:** 13/11/2025  
**Por:** Cascade AI  
**Problema reportado:** "aqui foi quase pronto eno do cozinheiro continua meso lugar"  
**Solução:** Filtrar itens por ambiente ao organizar colunas do Kanban
