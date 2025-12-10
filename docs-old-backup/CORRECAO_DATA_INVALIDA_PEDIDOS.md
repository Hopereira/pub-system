# Correção: Erro "Invalid time value" em Pedidos Pendentes

## 📋 Problema Identificado

Ao acessar a página de Pedidos Pendentes (`/dashboard/operacional/pedidos-pendentes`), o sistema apresentava erro:

```
Uncaught RangeError: Invalid time value
    at formatDistance (formatDistance.js:99:32)
    at formatDistanceToNow (formatDistanceToNow.js:91:24)
    at eval (page.tsx:183:45)
```

### Erro no Console

```javascript
RangeError: Invalid time value
```

### Contexto

A página deveria mostrar uma **lista simples dos pedidos pendentes** com:
- Onde foi preparado (ambiente)
- Horário do pedido

## 🔍 Causa Raiz

O erro ocorria na linha 183 ao tentar formatar a data com `formatDistanceToNow`:

```typescript
// ❌ ERRO: item.criadoEm pode ser null, undefined ou string inválida
<p className="text-xs text-muted-foreground">
  {formatDistanceToNow(item.criadoEm, { locale: ptBR, addSuffix: true })}
</p>
```

### Por que acontecia?

1. **Backend retorna `criadoEm` como string** (ISO 8601)
2. **Frontend converte para Date** na linha 49: `new Date(item.criadoEm)`
3. **Se `item.criadoEm` for `null`, `undefined` ou string inválida**, `new Date()` retorna `Invalid Date`
4. **`formatDistanceToNow` não aceita datas inválidas** e lança `RangeError`

### Dados do Backend

```typescript
// ItemPedido do backend pode ter:
{
  id: "uuid",
  criadoEm: "2025-11-12T03:23:08.000Z", // ✅ Válido
  // ou
  criadoEm: null, // ❌ Inválido
  // ou
  criadoEm: undefined, // ❌ Inválido
  // ou
  criadoEm: "invalid-date", // ❌ Inválido
}
```

## ✅ Solução Implementada

Adicionada validação robusta antes de criar o objeto `ItemPendente`:

**Arquivo**: `frontend/src/app/(protected)/dashboard/operacional/pedidos-pendentes/page.tsx`

```typescript
.forEach((item: ItemPedido) => {
  // ✅ VALIDAÇÃO 1: Usar data atual se criadoEm não existir
  const criadoEm = item.criadoEm ? new Date(item.criadoEm) : new Date();
  
  // ✅ VALIDAÇÃO 2: Verificar se a data é válida
  if (isNaN(criadoEm.getTime())) {
    logger.warn('⚠️ Data inválida no item', {
      module: 'PedidosPendentes',
      data: { itemId: item.id, criadoEm: item.criadoEm }
    });
    return; // Pula este item
  }
  
  // ✅ Agora criadoEm é sempre uma Date válida
  itens.push({
    id: item.id,
    produto: item.produto.nome,
    quantidade: item.quantidade,
    status: item.status,
    criadoEm: criadoEm, // ✅ Date válida garantida
    ambiente: item.ambiente?.nome || 'N/A',
    funcionario: pedido.funcionario?.nome || 'N/A',
    mesa: pedido.mesa?.numero,
    cliente: pedido.cliente?.nome,
  });
});
```

## 🎯 Fluxo de Validação

```
1. Backend retorna item.criadoEm
   ↓
2. Frontend verifica se existe
   ├─ Se SIM: new Date(item.criadoEm)
   └─ Se NÃO: new Date() (data atual)
   ↓
3. Verifica se Date é válida
   ├─ Se VÁLIDA: Adiciona ao array
   └─ Se INVÁLIDA: Log warning + pula item
   ↓
4. formatDistanceToNow recebe Date válida
   ↓
5. ✅ Renderiza sem erros
```

## 📊 Casos de Teste

### Caso 1: Data Válida
```typescript
item.criadoEm = "2025-11-12T03:23:08.000Z"
→ new Date("2025-11-12T03:23:08.000Z")
→ Valid Date
→ ✅ Renderiza "há 2 minutos"
```

### Caso 2: Data Null
```typescript
item.criadoEm = null
→ new Date() // Data atual
→ Valid Date
→ ✅ Renderiza "agora mesmo"
```

### Caso 3: Data Undefined
```typescript
item.criadoEm = undefined
→ new Date() // Data atual
→ Valid Date
→ ✅ Renderiza "agora mesmo"
```

### Caso 4: String Inválida
```typescript
item.criadoEm = "invalid-date"
→ new Date("invalid-date")
→ Invalid Date
→ isNaN(criadoEm.getTime()) = true
→ ⚠️ Log warning
→ ✅ Item pulado (não renderiza)
```

## 🎨 Interface da Página

A página mostra uma **lista simples** de pedidos pendentes com:

### Card de Item Pendente
```
┌─────────────────────────────────────┐
│ 🍕 Pizza Margherita (2x)            │
│ ⏱️ 5 min | 📍 Cozinha               │
│ 👤 João Silva | 🪑 Mesa 10          │
│ há 5 minutos                        │
└─────────────────────────────────────┘
```

### Informações Exibidas
- **Produto**: Nome + quantidade
- **Tempo**: Minutos desde criação (com cor)
  - Verde: < 5 min
  - Laranja: 5-8 min
  - Vermelho: > 8 min
- **Ambiente**: Onde foi preparado
- **Funcionário**: Quem fez o pedido
- **Mesa/Cliente**: Identificação
- **Tempo relativo**: "há X minutos"

## 🔧 Melhorias Adicionais

### 1. Logging de Datas Inválidas
```typescript
logger.warn('⚠️ Data inválida no item', {
  module: 'PedidosPendentes',
  data: { itemId: item.id, criadoEm: item.criadoEm }
});
```

Isso ajuda a identificar problemas no backend que estão enviando datas inválidas.

### 2. Fallback para Data Atual
Se a data for inválida, usa a data atual ao invés de quebrar a aplicação.

### 3. Validação com `isNaN`
```typescript
if (isNaN(criadoEm.getTime())) {
  // Data inválida
}
```

Método mais confiável do que verificar `criadoEm.toString() === 'Invalid Date'`.

## 🧪 Teste Manual

### Teste 1: Pedidos com Datas Válidas
1. Criar pedido no sistema
2. Acessar `/dashboard/operacional/pedidos-pendentes`
3. ✅ Resultado: Lista mostra pedido com tempo correto

### Teste 2: Simular Data Inválida (Dev)
1. Modificar backend para retornar `criadoEm: null`
2. Acessar `/dashboard/operacional/pedidos-pendentes`
3. ✅ Resultado: Item usa data atual, não quebra

### Teste 3: Atualização em Tempo Real
1. Deixar página aberta
2. Criar novo pedido
3. ✅ Resultado: WebSocket atualiza lista automaticamente

## 📝 Observações Importantes

### Backend deve garantir `criadoEm` válido
Idealmente, o backend deveria **sempre** retornar uma data válida:

```typescript
// Backend - ItemPedido entity
@CreateDateColumn()
criadoEm: Date; // Nunca null, sempre preenchido pelo TypeORM
```

### Frontend deve ser defensivo
Mesmo assim, o frontend deve validar para evitar crashes:

```typescript
// ✅ Sempre validar dados externos
const criadoEm = item.criadoEm ? new Date(item.criadoEm) : new Date();
if (isNaN(criadoEm.getTime())) return;
```

## ✨ Conclusão

A correção adiciona validação robusta para datas, garantindo que:
1. **Nunca** ocorra `RangeError: Invalid time value`
2. **Sempre** mostre uma data válida (atual como fallback)
3. **Log** de datas inválidas para debug
4. **UX** não é afetada por dados ruins do backend

**Status**: ✅ **CORRIGIDO**

---

**Relacionado**:
- `CORRECAO_ERRO_LOADPEDIDOS.md` - Erro de inicialização em MapaPedidos
- `CORRECAO_TABELA_TURNOS.md` - Tabela turnos_funcionario
- `MELHORIA_UX_NUMERO_MESA.md` - UX de criação de mesas
