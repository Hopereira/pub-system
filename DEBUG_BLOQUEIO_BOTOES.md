# 🔍 DEBUG - Bloqueio de Botões

**Data:** 23 de outubro de 2025  
**Status:** 🔧 Em Debug

---

## 🎯 Problema

Botões continuam bloqueados mesmo após escolher mesa ou ponto de entrega.

---

## ✅ Correções Já Aplicadas

1. ✅ Card de localização verifica `pontoEntrega || mesa`
2. ✅ Botões Cardápio e Pedidos verificam `pontoEntrega || mesa`
3. ✅ FloatingNav verifica `pontoEntrega || mesa`
4. ✅ Modal recebe `mesaAtualId`
5. ✅ Estado atualiza sem reload da página
6. ✅ Logs de debug adicionados

---

## 🔍 Como Debugar

### 1. Abra o Console do Navegador

**Chrome/Edge:** `F12` → Aba "Console"

### 2. Escolha um Local

Clique em "Informar Minha Localização" e escolha uma mesa ou ponto.

### 3. Verifique os Logs

Você deve ver logs assim:

```
✅ Modal fechado com sucesso, recarregando dados...
📦 Dados recarregados: {
  temPontoEntrega: false,
  temMesa: true,
  pontoEntrega: null,
  mesa: { id: "...", numero: 5, ... }
}
✅ Estado atualizado!
🔍 ClienteHubPage - Estado da comanda: {
  temPontoEntrega: false,
  temMesa: true,
  pontoEntrega: null,
  mesa: { id: "...", numero: 5, ... },
  deveriaMostrarBotoes: true
}
```

---

## 🚨 Possíveis Problemas

### Problema 1: `mesa` vem como `null`

**Log esperado:**
```javascript
📦 Dados recarregados: {
  temMesa: false,  // ❌ PROBLEMA!
  mesa: null
}
```

**Causa:** Backend não está retornando dados da mesa

**Solução:** Verificar endpoint `/api/comandas/public/:id`

---

### Problema 2: Estado não atualiza

**Log esperado:**
```javascript
✅ Modal fechado com sucesso, recarregando dados...
// ❌ Não aparece "📦 Dados recarregados"
```

**Causa:** Erro na chamada da API

**Solução:** Verificar erro no console

---

### Problema 3: `deveriaMostrarBotoes: false`

**Log esperado:**
```javascript
🔍 ClienteHubPage - Estado da comanda: {
  temPontoEntrega: false,
  temMesa: false,  // ❌ Ambos false
  deveriaMostrarBotoes: false
}
```

**Causa:** Dados não estão chegando do backend

---

## 🔧 Verificações no Backend

### 1. Verificar Endpoint

```bash
# Testar manualmente
curl http://localhost:3000/api/comandas/public/{COMANDA_ID}
```

**Resposta esperada:**
```json
{
  "id": "...",
  "status": "ABERTA",
  "mesa": {
    "id": "...",
    "numero": 5,
    "capacidade": 4
  },
  "pontoEntrega": null,
  "pedidos": []
}
```

### 2. Verificar Relations no Backend

**Arquivo:** `backend/src/modulos/comanda/comanda.service.ts`

```typescript
async findOne(id: string): Promise<Comanda> {
  const comanda = await this.comandaRepository.findOne({
    where: { id },
    relations: [
      'mesa',           // ✅ IMPORTANTE
      'pontoEntrega',   // ✅ IMPORTANTE
      'agregados',
      'pedidos',
      'pedidos.itens',
      'pedidos.itens.produto'
    ],
  });
  
  if (!comanda) {
    throw new NotFoundException(`Comanda ${id} não encontrada`);
  }
  
  return comanda;
}
```

---

## 📋 Checklist de Debug

### Frontend

- [ ] Console mostra log "✅ Modal fechado com sucesso"
- [ ] Console mostra log "📦 Dados recarregados"
- [ ] `temMesa: true` OU `temPontoEntrega: true`
- [ ] `deveriaMostrarBotoes: true`
- [ ] Card mostra "Mesa X" ou nome do ponto
- [ ] Botões ficam coloridos (não opacos)

### Backend

- [ ] Endpoint `/api/comandas/public/:id` retorna dados
- [ ] Campo `mesa` vem preenchido (se escolheu mesa)
- [ ] Campo `pontoEntrega` vem preenchido (se escolheu ponto)
- [ ] Relations estão configuradas no `findOne`

---

## 🎯 Próximos Passos

### Se `mesa` vem `null`:

1. Verificar se `updateComanda` está salvando corretamente
2. Verificar relations no `findOne` do backend
3. Verificar se `mesaId` está sendo enviado corretamente

### Se estado não atualiza:

1. Verificar se `onSuccess` está sendo chamado
2. Verificar se `getPublicComandaById` retorna dados
3. Verificar se `setComandaAtualizada` está funcionando

### Se tudo parece correto mas não funciona:

1. Limpar cache do navegador (`Ctrl+Shift+Delete`)
2. Fazer hard reload (`Ctrl+F5`)
3. Verificar se há erros no console
4. Testar em aba anônima

---

## 📝 Informações para Reportar

Se o problema persistir, envie:

1. **Screenshot do console** com os logs
2. **Screenshot da página** mostrando botões bloqueados
3. **Resposta da API** (`/api/comandas/public/:id`)
4. **Qual tipo escolheu:** Mesa ou Ponto de Entrega

---

**Adicionado em:** 23 de outubro de 2025  
**Logs de debug:** ✅ Implementados  
**Aguardando:** Feedback do console
