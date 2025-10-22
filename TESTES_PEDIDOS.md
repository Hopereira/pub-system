# 🧪 Guia de Testes - Módulo de Pedidos

**Data:** 21 de Outubro de 2025  
**Objetivo:** Testar integração completa Backend ↔ Frontend

---

## 📋 Pré-requisitos

### 1. Sistema Rodando

```bash
# Verificar se containers estão ativos
docker-compose ps

# Se não estiver rodando, iniciar
docker-compose up -d

# Aguardar ~30 segundos para inicialização completa
```

### 2. Acessos Necessários

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | admin@admin.com / admin123 |
| Swagger | http://localhost:3000/api | Mesmo login |
| Backend API | http://localhost:3000 | - |

---

## 🎯 Plano de Testes

### **Fase 1:** Swagger - API Backend
### **Fase 2:** Frontend - Interface
### **Fase 3:** WebSocket - Tempo Real
### **Fase 4:** Logs - Verificação

---

## 🔷 FASE 1: Testes no Swagger

### **1.1 - Autenticação**

#### Passo 1: Acessar Swagger
```
URL: http://localhost:3000/api
```

#### Passo 2: Fazer Login
1. Expandir seção **"Autenticação"**
2. Clicar em `POST /auth/login`
3. Clicar em **"Try it out"**
4. Usar payload:

```json
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

5. Clicar em **"Execute"**
6. **Copiar** o `access_token` da resposta

#### Passo 3: Autorizar
1. Clicar no botão **"Authorize" 🔒** (topo da página)
2. Colar o token no campo **Value**
3. Clicar em **"Authorize"**
4. Clicar em **"Close"**

✅ **Esperado:** Cadeado deve ficar fechado ao lado de "Authorize"

---

### **1.2 - Buscar Dados Necessários**

#### **A) Buscar Comandas Abertas**

**Endpoint:** `GET /comandas/search`

**Query Params:**
```
termo: (deixar vazio para listar todas)
```

**Resposta Esperada:**
```json
[
  {
    "id": "uuid-comanda-1",
    "status": "ABERTA",
    "mesa": { "numero": 1 },
    "pedidos": [...]
  }
]
```

📝 **ANOTAR:** `comandaId` de uma comanda ABERTA

---

#### **B) Buscar Produtos**

**Endpoint:** `GET /produtos`

**Resposta Esperada:**
```json
[
  {
    "id": "uuid-produto-1",
    "nome": "X-Burger",
    "preco": 25.00,
    "ambiente": { "id": "uuid-ambiente", "nome": "Cozinha" }
  }
]
```

📝 **ANOTAR:** 
- `produtoId` de 2-3 produtos
- `ambienteId` de "Cozinha" ou "Bar"

---

### **1.3 - Criar Pedido**

#### **Endpoint:** `POST /pedidos`

**Payload Exemplo:**
```json
{
  "comandaId": "COLE_AQUI_O_COMANDA_ID",
  "itens": [
    {
      "produtoId": "COLE_AQUI_PRODUTO_ID_1",
      "quantidade": 2,
      "observacao": "Sem cebola"
    },
    {
      "produtoId": "COLE_AQUI_PRODUTO_ID_2",
      "quantidade": 1
    }
  ]
}
```

**Resposta Esperada (201):**
```json
{
  "id": "uuid-pedido-novo",
  "status": "FEITO",
  "total": 75.00,
  "data": "2025-10-21T...",
  "itens": [
    {
      "id": "uuid-item-1",
      "quantidade": 2,
      "status": "FEITO",
      "produto": { "nome": "X-Burger" }
    }
  ],
  "comanda": {
    "id": "...",
    "mesa": { "numero": 1 }
  }
}
```

📝 **ANOTAR:** 
- `pedidoId`
- `itemPedidoId` de um dos itens

✅ **Validar:**
- [x] Status 201
- [x] Pedido tem ID
- [x] Itens têm status "FEITO"
- [x] Comanda está incluída
- [x] Total calculado corretamente

---

### **1.4 - Buscar Pedidos por Ambiente**

#### **Endpoint:** `GET /pedidos`

**Query Params:**
```
ambienteId: COLE_AQUI_O_AMBIENTE_ID
```

**Resposta Esperada (200):**
```json
[
  {
    "id": "uuid-pedido",
    "status": "FEITO",
    "itens": [
      {
        "id": "uuid-item",
        "status": "FEITO",
        "produto": {
          "nome": "X-Burger",
          "ambiente": { "id": "ambienteId", "nome": "Cozinha" }
        }
      }
    ]
  }
]
```

✅ **Validar:**
- [x] Retorna apenas pedidos desse ambiente
- [x] Itens filtrados por ambiente
- [x] Status dos itens visível

---

### **1.5 - Atualizar Status de Item**

#### **Endpoint:** `PATCH /pedidos/item/{itemPedidoId}/status`

**Path Param:**
```
itemPedidoId: COLE_AQUI_O_ITEM_ID
```

**Payload 1 - Em Preparo:**
```json
{
  "status": "EM_PREPARO"
}
```

**Payload 2 - Pronto:**
```json
{
  "status": "PRONTO"
}
```

**Payload 3 - Entregue:**
```json
{
  "status": "ENTREGUE"
}
```

**Payload 4 - Cancelar:**
```json
{
  "status": "CANCELADO",
  "motivoCancelamento": "Cliente desistiu do pedido"
}
```

**Resposta Esperada (200):**
```json
{
  "id": "uuid-item",
  "status": "EM_PREPARO",
  "produto": { "nome": "X-Burger" }
}
```

✅ **Validar:**
- [x] Status atualizado
- [x] Se cancelar, motivo obrigatório (mín. 5 chars)

---

### **1.6 - Criar Pedido Público (Cliente)**

#### **Endpoint:** `POST /pedidos/cliente`

**Não precisa de autenticação!** (Endpoint público)

**Payload:**
```json
{
  "comandaId": "COLE_AQUI_COMANDA_ID",
  "itens": [
    {
      "produtoId": "COLE_AQUI_PRODUTO_ID",
      "quantidade": 1,
      "observacao": "Teste pedido público"
    }
  ]
}
```

✅ **Validar:**
- [x] Funciona sem token JWT
- [x] Pedido criado normalmente

---

## 🔷 FASE 2: Testes no Frontend

### **2.1 - Login no Frontend**

1. Acessar: http://localhost:3001
2. Login: `admin@admin.com` / `admin123`
3. Deve redirecionar para `/dashboard`

✅ **Esperado:** Dashboard principal exibido

---

### **2.2 - Acessar Painel Operacional**

#### Opção A: Pela URL Direta
```
http://localhost:3001/dashboard/operacional/[AMBIENTE_ID]
```

#### Opção B: Pelo Menu/Navegação
- Procurar link para "Operacional" ou nome do ambiente
- Clicar para acessar painel

---

### **2.3 - Verificar Painel Kanban**

**O que deve aparecer:**

```
┌────────────────────────────────────────────┐
│  🏠 Cozinha          [🔔 Ativar Som]       │
├────────────────────────────────────────────┤
│ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│ │ A Fazer  │ │ Em Preparo│ │  Pronto   │ │
│ ├──────────┤ ├───────────┤ ├───────────┤ │
│ │ [Card 1] │ │           │ │           │ │
│ │ Mesa 1   │ │           │ │           │ │
│ │ 2x Burger│ │           │ │           │ │
│ └──────────┘ └───────────┘ └───────────┘ │
└────────────────────────────────────────────┘
```

✅ **Validar:**
- [x] 3 colunas visíveis
- [x] Pedidos aparecem na coluna "A Fazer"
- [x] Mesa/Balcão exibido
- [x] Quantidade e nome do produto
- [x] Botão "Ativar Som" visível

---

### **2.4 - Testar Ações no Card**

#### **A) Atualizar Status**

1. Clicar em **"Em Preparo"** em um item
2. **Aguardar 1-2 segundos**
3. Item deve mover para coluna "Em Preparo"

4. Clicar em **"Pronto"**
5. Item deve mover para coluna "Pronto"

6. Clicar em **"Entregar"**
7. Item deve **desaparecer** (status ENTREGUE não é exibido)

✅ **Validar:**
- [x] Toast de sucesso aparece
- [x] Item muda de coluna
- [x] Atualização instantânea

---

#### **B) Cancelar Item**

1. Clicar em **"Cancelar"** em qualquer item
2. **Dialog deve abrir**
3. Digitar motivo: "Produto em falta"
4. Clicar em **"Confirmar"**

✅ **Validar:**
- [x] Dialog abre
- [x] Não permite confirmar com menos de 5 caracteres
- [x] Toast de sucesso
- [x] Item desaparece do painel

---

### **2.5 - Abrir Console do Navegador**

#### Passo 1: Abrir DevTools
```
F12 ou Ctrl+Shift+I
```

#### Passo 2: Ir para aba "Console"

#### Passo 3: Filtrar logs
```
Digite na busca: [CLIENT]
```

**Logs Esperados:**

```
[CLIENT] [PedidoService] 📝 Adicionando itens ao pedido
[CLIENT] [API] 📤 POST /pedidos
[CLIENT] [API] 📥 200 - 145ms
[CLIENT] [PedidoService] ✅ Pedido criado com sucesso
[CLIENT] [WebSocket] 🔌 Conectado ao ambiente
```

✅ **Validar:**
- [x] Logs aparecem com emojis
- [x] Módulos identificados
- [x] Timestamps visíveis
- [x] Sem erros (vermelho)

---

## 🔷 FASE 3: Testes WebSocket (Tempo Real)

### **3.1 - Preparação**

#### Abrir 2 Abas do Navegador:
1. **Aba 1:** Painel Operacional (Cozinha)
2. **Aba 2:** Swagger (para criar pedido)

---

### **3.2 - Ativar Som**

**Na Aba 1 (Frontend):**
1. Clicar em **"Ativar Som de Notificações"**
2. Botão deve mudar para "✅ Notificações ativadas"

---

### **3.3 - Criar Pedido via Swagger**

**Na Aba 2 (Swagger):**
1. Criar novo pedido via `POST /pedidos`
2. Usar payload com produtos do ambiente

---

### **3.4 - Observar Frontend**

**Na Aba 1 (Frontend) - Deve acontecer:**

1. **🔔 SOM** deve tocar automaticamente
2. **✨ DESTAQUE VISUAL:**
   - Card do novo pedido aparece
   - Ring verde piscando ao redor
   - Animação pulse
3. **⏱️ Após 5 segundos:**
   - Destaque desaparece
   - Card permanece normal

✅ **Validar:**
- [x] Som tocou
- [x] Pedido apareceu instantaneamente
- [x] Destaque visual por 5s
- [x] Sem refresh manual necessário

---

### **3.5 - Verificar Logs WebSocket**

**No Console (F12):**

```
[CLIENT] [WebSocket] 🆕 Novo pedido recebido
[CLIENT] [WebSocket] 🔔 Notificação sonora disparada
```

✅ **Validar:**
- [x] Evento recebido
- [x] Log de som disparado

---

### **3.6 - Testar Atualização de Status (Tempo Real)**

**Procedimento:**

1. **Frontend (Aba 1):** Clicar em "Em Preparo"
2. **Observar:** Status atualiza instantaneamente
3. **Swagger (Aba 2):** Buscar pedidos `GET /pedidos`
4. **Verificar:** Status já está "EM_PREPARO"

✅ **Validar:**
- [x] Atualização bidirecional
- [x] Sem delay perceptível

---

## 🔷 FASE 4: Verificação de Logs

### **4.1 - Logs do Frontend**

**No Console do Navegador (F12):**

#### Filtrar por Módulo:
```
[CLIENT] [PedidoService]
[CLIENT] [WebSocket]
[CLIENT] [API]
```

#### Logs Esperados:

| Operação | Log |
|----------|-----|
| Criar pedido | 📝 Adicionando itens ao pedido |
| Sucesso | ✅ Pedido criado com sucesso |
| Buscar | 🔍 Buscando pedidos por ambiente |
| Atualizar status | 🔄 Atualizando status do item |
| WebSocket conectado | 🔌 Conectado ao ambiente |
| Novo pedido | 🆕 Novo pedido recebido |
| Som disparado | 🔔 Notificação sonora disparada |

---

### **4.2 - Logs do Backend**

**No Terminal:**

```bash
# Ver logs do backend em tempo real
docker-compose logs -f backend

# Filtrar por módulo de pedidos
docker-compose logs -f backend | grep "PedidoService"
```

#### Logs Esperados:

```
[NestJS] [PedidoService] 📝 Criando novo pedido | Comanda: uuid | 2 itens
[NestJS] [PedidoService] ✅ Pedido criado com sucesso | ID: uuid | Total: R$ 50.00 | Itens: 2
[NestJS] [PedidoService] 🔄 Status alterado: X-Burger | FEITO → EM_PREPARO
```

✅ **Validar:**
- [x] Logs estruturados
- [x] Emojis visíveis
- [x] Dados contextuais
- [x] Timestamps

---

## ✅ Checklist de Validação Final

### **Backend (Swagger)**
- [ ] Login funcionando
- [ ] POST /pedidos cria pedido
- [ ] GET /pedidos retorna pedidos filtrados
- [ ] PATCH /pedidos/item/:id/status atualiza
- [ ] POST /pedidos/cliente funciona sem auth
- [ ] Todas respostas 200/201
- [ ] Validações de erro funcionando

### **Frontend**
- [ ] Login funciona
- [ ] Painel Kanban exibe 3 colunas
- [ ] Pedidos aparecem corretamente
- [ ] Botões de status funcionam
- [ ] Dialog de cancelamento funciona
- [ ] Toast notifications aparecem
- [ ] Console sem erros

### **WebSocket**
- [ ] Botão "Ativar Som" funciona
- [ ] Som toca ao criar pedido
- [ ] Destaque visual (5s) funciona
- [ ] Pedido aparece instantaneamente
- [ ] Atualização bidirecional funciona
- [ ] Logs WebSocket no console

### **Logs**
- [ ] Frontend: Logs com [CLIENT]
- [ ] Backend: Logs estruturados
- [ ] Emojis visíveis em ambos
- [ ] Níveis apropriados (LOG, DEBUG, ERROR)
- [ ] Dados contextuais presentes

### **Integração End-to-End**
- [ ] Criar pedido → Aparece no painel
- [ ] Atualizar status → Muda coluna
- [ ] Cancelar → Item desaparece
- [ ] WebSocket → Tempo real funciona
- [ ] Múltiplas abas sincronizadas

---

## 🐛 Troubleshooting

### **Problema:** Pedido não aparece no painel

**Soluções:**
1. Verificar se `ambienteId` está correto
2. Confirmar que produto pertence ao ambiente
3. Aguardar polling (30s) ou refresh manual
4. Verificar console por erros

---

### **Problema:** Som não toca

**Soluções:**
1. Clicar em "Ativar Som de Notificações"
2. Verificar se arquivo `/public/notification.mp3` existe
3. Verificar volume do navegador
4. Tentar outro navegador (Chrome recomendado)

---

### **Problema:** WebSocket não conecta

**Soluções:**
1. Verificar backend rodando: `docker-compose ps`
2. Verificar porta 3000 acessível
3. Console deve mostrar erro de conexão
4. Reiniciar containers: `docker-compose restart`

---

### **Problema:** "Token inválido" no Swagger

**Soluções:**
1. Fazer login novamente
2. Copiar token completo (sem espaços)
3. Clicar em "Authorize" e colar token
4. Verificar se token não expirou

---

### **Problema:** Logs não aparecem

**Soluções:**
1. **Frontend:** F12 → Console → Limpar filtros
2. **Backend:** `docker-compose logs -f backend`
3. Verificar se logger está importado
4. Recarregar página (Ctrl+F5)

---

## 📊 Relatório de Testes

### **Template para Preencher:**

```
DATA: ___/___/2025
TESTADOR: _______________

FASE 1 - SWAGGER:
✅ Login: ___
✅ Criar pedido: ___
✅ Buscar pedidos: ___
✅ Atualizar status: ___
✅ Pedido público: ___

FASE 2 - FRONTEND:
✅ Login: ___
✅ Painel Kanban: ___
✅ Atualizar status: ___
✅ Cancelar item: ___
✅ Logs console: ___

FASE 3 - WEBSOCKET:
✅ Som notificação: ___
✅ Destaque visual: ___
✅ Tempo real: ___
✅ Múltiplas abas: ___

FASE 4 - LOGS:
✅ Frontend: ___
✅ Backend: ___
✅ Estruturados: ___

NOTAS/PROBLEMAS:
_______________________
_______________________
_______________________

RESULTADO FINAL: ✅ APROVADO / ❌ REPROVADO
```

---

## 🎉 Conclusão

Se **TODOS** os testes passarem:

✅ **Sistema 100% Funcional e Production-Ready!**

**Próximo passo:**
- Fazer commit do código
- Deploy em staging
- Testes de carga
- Documentar casos de uso adicionais

---

**Boa sorte nos testes!** 🚀
