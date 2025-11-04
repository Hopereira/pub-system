---
name: Pedido Direto pelo Garçom
about: Garçom faz pedido buscando cliente por nome/CPF
title: '[FEATURE] Fazer Pedido Direto pelo Garçom'
labels: feature, backend, frontend, mobile, garçom, priority-high
assignees: ''
---

## 📝 Descrição
Permitir que garçom faça pedido para cliente que não está usando celular, buscando por nome ou CPF.

## 🎯 Objetivo
Suportar atendimento híbrido: cliente usa QR Code OU pede ao garçom.

## 📋 Tarefas

### Backend
- [ ] Criar endpoint `GET /clientes/buscar?q={termo}`
- [ ] Criar endpoint `POST /clientes/rapido`
- [ ] Criar endpoint `POST /pedidos/garcom`
- [ ] Busca por nome (case-insensitive)
- [ ] Busca por CPF (com/sem formatação)
- [ ] Criar/abrir comanda automaticamente
- [ ] Vincular pedido ao garçom

### Frontend Mobile
- [ ] Tela "Novo Pedido pelo Garçom"
- [ ] Campo de busca de cliente
- [ ] Formulário rápido de novo cliente
- [ ] Interface de seleção de produtos
- [ ] Carrinho de itens
- [ ] Botão "Enviar para Cozinha"

## 🔄 Fluxo
```
1. Garçom: "Novo Pedido"
2. Buscar: "João Silva" ou "123.456.789-00"
3. Selecionar/criar cliente
4. Sistema verifica comanda aberta
5. Adicionar itens do cardápio
6. Enviar para cozinha
7. Cliente vê no celular depois
```

## 🏗️ Endpoints

```typescript
GET /clientes/buscar?q=joao
POST /clientes/rapido
Body: { nome, cpf?, telefone? }

POST /pedidos/garcom
Body: {
  clienteId: string,
  garcomId: string,
  mesaId?: string,
  itens: ItemPedido[]
}
```

## ✅ Critérios de Aceite
- [ ] Busca por nome parcial funciona
- [ ] Busca por CPF funciona
- [ ] Criar cliente rapidamente
- [ ] Comanda criada automaticamente
- [ ] Pedido vinculado ao garçom
- [ ] Cliente vê pedido no celular
- [ ] Busca case-insensitive

## ⏱️ Estimativa
**8 dias**
