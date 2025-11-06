# 🔧 Correção: produto.preco.toFixed is not a function

**Data:** 06/11/2025  
**Erro:** `Runtime TypeError: produto.preco.toFixed is not a function`  
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema

O erro ocorria na página `/garcom/novo-pedido` ao tentar exibir o preço dos produtos.

### Erro Completo
```
Runtime TypeError
produto.preco.toFixed is not a function

at src/app/(protected)/garcom/novo-pedido/page.tsx (465:41) @ eval
```

### Causa Raiz
O campo `produto.preco` vem do backend como **string** ou **Decimal**, não como **number**.

TypeORM retorna campos `decimal` como string por padrão para evitar perda de precisão.

---

## ✅ Correção Aplicada

### 1. Exibição do Preço no Grid de Produtos
```typescript
// ❌ Antes (ERRO)
<p className="text-lg font-bold text-primary">
  R$ {produto.preco.toFixed(2)}
</p>

// ✅ Depois (CORRETO)
<p className="text-lg font-bold text-primary">
  R$ {Number(produto.preco).toFixed(2)}
</p>
```

### 2. Exibição no Carrinho
```typescript
// ❌ Antes (ERRO)
<p className="text-xs text-muted-foreground">
  R$ {item.produto.preco.toFixed(2)} x {item.quantidade}
</p>

// ✅ Depois (CORRETO)
<p className="text-xs text-muted-foreground">
  R$ {Number(item.produto.preco).toFixed(2)} x {item.quantidade}
</p>
```

### 3. Cálculo do Total
```typescript
// ❌ Antes (ERRO)
const calcularTotal = () => {
  return carrinho.reduce((total, item) => 
    total + (item.produto.preco * item.quantidade), 0
  );
};

// ✅ Depois (CORRETO)
const calcularTotal = () => {
  return carrinho.reduce((total, item) => 
    total + (Number(item.produto.preco) * item.quantidade), 0
  );
};
```

---

## 📊 Locais Corrigidos

| Local | Linha | Correção |
|-------|-------|----------|
| Grid de produtos | 455 | `Number(produto.preco).toFixed(2)` |
| Carrinho | 357 | `Number(item.produto.preco).toFixed(2)` |
| Cálculo total | 154 | `Number(item.produto.preco) * quantidade` |

---

## 🎯 Por que isso acontece?

### TypeORM e Campos Decimal
```typescript
// Backend (TypeORM)
@Column({ type: 'decimal', precision: 10, scale: 2 })
preco: number;

// PostgreSQL retorna como string
// "45.90" (string) ← não é number!
```

### Solução: Sempre converter
```typescript
// ✅ Sempre use Number() antes de operações matemáticas
const precoNumerico = Number(produto.preco);
const total = precoNumerico * quantidade;
const formatado = precoNumerico.toFixed(2);
```

---

## 🧪 Como Testar

### 1. Acesse a Página
```
http://localhost:3001/garcom/novo-pedido
```

### 2. Verifique os Preços
- ✅ Grid de produtos deve mostrar preços formatados
- ✅ Carrinho deve calcular corretamente
- ✅ Total deve somar sem erros

### 3. Adicione Produtos
- Clique em produtos
- Verifique se o preço aparece corretamente
- Verifique se o total está correto

---

## 📝 Padrão Recomendado

### Para Exibição
```typescript
// Sempre converta para Number antes de formatar
R$ {Number(preco).toFixed(2)}
```

### Para Cálculos
```typescript
// Sempre converta antes de operações matemáticas
const total = Number(preco) * quantidade;
```

### Para Comparações
```typescript
// Sempre converta antes de comparar
if (Number(preco) > 100) {
  // ...
}
```

---

## 🔄 Alternativa: Converter no Service

Outra opção seria converter no service ao receber do backend:

```typescript
// produtoService.ts
export const getProdutos = async (): Promise<Produto[]> => {
  const response = await api.get<Produto[]>('/produtos');
  
  // Converter preços para number
  return response.data.map(produto => ({
    ...produto,
    preco: Number(produto.preco)
  }));
};
```

**Vantagem:** Conversão centralizada  
**Desvantagem:** Perde precisão do Decimal

---

## ✅ Resultado

### Antes
```
❌ Runtime TypeError
❌ Página quebrada
❌ Não consegue adicionar produtos
```

### Depois
```
✅ Preços exibidos corretamente
✅ Carrinho funcional
✅ Total calculado corretamente
✅ Sem erros no console
```

---

**Status:** ✅ CORRIGIDO  
**Arquivo:** `frontend/src/app/(protected)/garcom/novo-pedido/page.tsx`  
**Linhas:** 154, 357, 455
