# 📱 Frontend - Módulo de Pedidos

**Documentação completa do sistema de pedidos no frontend**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tipos TypeScript](#tipos-typescript)
4. [Serviços (API)](#serviços-api)
5. [Hooks Customizados](#hooks-customizados)
6. [Componentes](#componentes)
7. [Páginas/Rotas](#páginas-rotas)
8. [WebSocket & Notificações](#websocket--notificações)
9. [Sistema de Logs](#sistema-de-logs)
10. [Fluxo Completo](#fluxo-completo)
11. [Como Usar](#como-usar)

---

## 🎯 Visão Geral

O módulo de pedidos no frontend gerencia:
- Criação de pedidos (funcionários e clientes)
- Visualização de pedidos por ambiente (Kanban board)
- Atualização de status de itens individuais
- Notificações em tempo real via WebSocket
- Sons de notificação para novos pedidos

---

## 🏗️ Arquitetura

```
frontend/src/
├── types/
│   ├── pedido.ts                 # Tipos principais
│   ├── pedido.dto.ts            # DTOs para API
│   └── pedido-status.enum.ts    # Enum de status (legado)
├── services/
│   └── pedidoService.ts         # Funções de API
├── hooks/
│   └── useAmbienteNotification.ts # Hook de WebSocket
├── components/
│   └── operacional/
│       └── PedidoCard.tsx       # Card de pedido
└── app/
    └── (protected)/dashboard/operacional/
        └── [ambienteId]/
            ├── page.tsx                    # Server Component
            └── OperacionalClientPage.tsx  # Client Component (Kanban)
```

---

## 📦 Tipos TypeScript

### **1. Enum de Status**

```typescript
// src/types/pedido.ts
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}
```

### **2. Interface ItemPedido**

```typescript
export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  status: PedidoStatus;               // Status individual
  motivoCancelamento?: string | null;
  produto: Produto;
}
```

### **3. Interface Pedido**

```typescript
export interface Pedido {
  id: string;
  status: PedidoStatus;
  total: number;
  data: string;
  motivoCancelamento: string | null;
  itens: ItemPedido[];
  comanda?: ComandaSimples;  // ✅ Relação incluída
}
```

### **4. Interface ComandaSimples**

```typescript
// Interface simplificada para evitar import circular
export interface ComandaSimples {
  id: string;
  status: string;
  mesa?: Mesa | null;
  cliente?: {
    id: string;
    nome: string;
    cpf?: string;
  } | null;
}
```

---

## 🌐 Serviços (API)

### **Arquivo:** `src/services/pedidoService.ts`

#### **1. Criar Pedido (Funcionários)**

```typescript
adicionarItensAoPedido(data: AddItemPedidoDto): Promise<Pedido>
```

**Uso:**
```typescript
const pedido = await adicionarItensAoPedido({
  comandaId: 'uuid-da-comanda',
  itens: [
    { produtoId: 'uuid', quantidade: 2, observacao: 'Sem cebola' }
  ]
});
```

**Logs:**
- 📝 Início da operação
- ✅ Sucesso com ID do pedido
- ❌ Erro detalhado

---

#### **2. Criar Pedido (Clientes)**

```typescript
createPedidoFromCliente(payload: CreatePedidoDto): Promise<Pedido>
```

**Uso:**
```typescript
const pedido = await createPedidoFromCliente({
  comandaId: 'uuid-da-comanda',
  itens: [...]
});
```

**Logs:**
- 📦 Operação pública iniciada
- ✅ Pedido criado
- ❌ Erro com contexto

---

#### **3. Buscar Pedidos por Ambiente**

```typescript
getPedidosPorAmbiente(ambienteId: string): Promise<Pedido[]>
```

**Uso:**
```typescript
const pedidos = await getPedidosPorAmbiente('cozinha-id');
```

**Logs:**
- 🔍 Busca iniciada
- ✅ Quantidade de pedidos encontrados
- ❌ Erro com ambiente ID

---

#### **4. Atualizar Status de Item**

```typescript
updateItemStatus(
  itemPedidoId: string, 
  data: UpdateItemPedidoStatusDto
): Promise<any>
```

**Uso:**
```typescript
await updateItemStatus('item-id', {
  status: PedidoStatus.EM_PREPARO
});

// Cancelar com motivo
await updateItemStatus('item-id', {
  status: PedidoStatus.CANCELADO,
  motivoCancelamento: 'Produto em falta'
});
```

**Logs:**
- 🔄 Atualização iniciada
- ✅ Status alterado
- ❌ Erro detalhado

---

## 🎣 Hooks Customizados

### **useAmbienteNotification**

**Arquivo:** `src/hooks/useAmbienteNotification.ts`

Hook para receber notificações de novos pedidos em tempo real via WebSocket.

#### **Uso:**

```typescript
const { 
  novoPedidoId, 
  audioConsentNeeded, 
  handleAllowAudio,
  clearNotification 
} = useAmbienteNotification(ambienteId);
```

#### **Retorno:**

| Propriedade | Tipo | Descrição |
|------------|------|-----------|
| `novoPedidoId` | `string \| null` | ID do pedido recém-chegado (destaque por 5s) |
| `audioConsentNeeded` | `boolean` | Se o usuário precisa permitir áudio |
| `handleAllowAudio` | `() => void` | Função para ativar áudio |
| `clearNotification` | `() => void` | Limpa destaque do pedido |

#### **Eventos WebSocket Monitorados:**

1. **`connect`** - Conexão estabelecida
2. **`disconnect`** - Desconexão (com razão)
3. **`novo_pedido_ambiente:{ambienteId}`** - Novo pedido para o ambiente
4. **`status_atualizado_ambiente:{ambienteId}`** - Status atualizado
5. **`connect_error`** - Erro de conexão
6. **`reconnect_attempt`** - Tentativa de reconexão
7. **`reconnect`** - Reconexão bem-sucedida

#### **Logs Gerados:**

| Evento | Log | Nível |
|--------|-----|-------|
| Conectado | `🔌 Conectado ao ambiente` | LOG |
| Novo pedido | `🆕 Novo pedido recebido` | LOG |
| Som tocado | `🔔 Notificação sonora disparada` | LOG |
| Status atualizado | `🔄 Status atualizado` | LOG |
| Desconectado | Desconectado do WebSocket | WARN |
| Erro conexão | Erro ao conectar no WebSocket | ERROR |
| Reconectando | `Tentando reconectar (X)` | WARN |
| Reconectado | `✅ Reconectado com sucesso` | LOG |

#### **Políticas de Áudio:**

- Requer **consentimento explícito** do usuário (políticas do navegador)
- Volume padrão: 70%
- Arquivo: `/public/notification.mp3`
- Testa áudio ao permitir

---

## 🧩 Componentes

### **PedidoCard**

**Arquivo:** `src/components/operacional/PedidoCard.tsx`

Card para exibir e gerenciar um pedido no painel operacional.

#### **Props:**

```typescript
interface PedidoCardProps {
  pedido: Pedido;
  onUpdateStatus: (itemPedidoId: string, novoStatus: PedidoStatus) => void;
  onCancel: (itemPedidoId: string, motivo: string) => void;
  filtroStatus: PedidoStatus;
}
```

#### **Funcionalidades:**

- ✅ Exibe mesa ou "Balcão"
- ✅ Filtra itens por status
- ✅ Botões contextuais por status:
  - FEITO → "Em Preparo"
  - EM_PREPARO → "Pronto"
  - PRONTO → "Entregar"
  - Sempre: "Cancelar" (com dialog)
- ✅ Observações dos itens
- ✅ Dialog para cancelamento (mínimo 5 caracteres)

#### **Uso:**

```typescript
<PedidoCard
  pedido={pedido}
  onUpdateStatus={handleUpdateStatus}
  onCancel={handleCancelItem}
  filtroStatus={PedidoStatus.FEITO}
/>
```

---

## 📄 Páginas/Rotas

### **Painel Operacional por Ambiente**

**Rota:** `/dashboard/operacional/[ambienteId]`

**Arquivos:**
- `page.tsx` - Server Component (wrapper)
- `OperacionalClientPage.tsx` - Client Component (lógica)

#### **Estrutura Visual:**

```
┌────────────────────────────────────────────────┐
│  🏠 Cozinha                    [🔔 Ativar Som] │
│  Acompanhe e gerencie os pedidos em tempo real │
├────────────────────────────────────────────────┤
│  ┌──────────┐ ┌───────────┐ ┌─────────────┐  │
│  │ A Fazer  │ │ Em Preparo│ │   Pronto    │  │
│  ├──────────┤ ├───────────┤ ├─────────────┤  │
│  │ [Card 1] │ │ [Card 3]  │ │  [Card 5]   │  │
│  │ [Card 2] │ │ [Card 4]  │ │  [Card 6]   │  │
│  │          │ │           │ │             │  │
│  └──────────┘ └───────────┘ └─────────────┘  │
└────────────────────────────────────────────────┘
```

#### **Funcionalidades:**

1. **Kanban Board de 3 Colunas:**
   - A Fazer (FEITO)
   - Em Preparo (EM_PREPARO)
   - Pronto (PRONTO)

2. **WebSocket em Tempo Real:**
   - Conecta via `useAmbienteNotification`
   - Destaque visual de novos pedidos (5s)
   - Som de notificação

3. **Polling de Backup:**
   - A cada 30 segundos
   - Garante sincronização mesmo sem WebSocket

4. **Interações:**
   - Atualizar status de item
   - Cancelar item (com motivo)
   - Ativar/desativar som

#### **Estados:**

- `loading` - Carregando dados
- `error` - Erro ao buscar
- `pedidos` - Array de pedidos
- `ambiente` - Dados do ambiente
- `novoPedidoId` - ID do pedido destacado

---

## 🔔 WebSocket & Notificações

### **Configuração**

**URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`

### **Fluxo de Notificação**

```
┌─────────────┐
│  Backend    │
│  (Pedidos   │
│   Gateway)  │
└──────┬──────┘
       │ emit('novo_pedido_ambiente:cozinha-id', pedido)
       ▼
┌─────────────────┐
│  Socket.IO      │
│  Connection     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────┐
│  useAmbienteNotification    │
│  - Recebe evento            │
│  - Toca som (se permitido)  │
│  - Seta novoPedidoId        │
│  - Remove após 5s           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  OperacionalClientPage      │
│  - Destaca card com ring    │
│  - Anima com pulse          │
│  - Remove destaque (5s)     │
└─────────────────────────────┘
```

### **Destaque Visual**

```tsx
<div className={`transition-all duration-500 ${
  novoPedidoId === pedido.id 
    ? 'ring-4 ring-green-500 ring-opacity-50 animate-pulse' 
    : ''
}`}>
  <PedidoCard ... />
</div>
```

---

## 📊 Sistema de Logs

Todos os logs seguem o padrão do `lib/logger.ts`.

### **Logs do PedidoService**

| Operação | Nível | Mensagem | Dados Incluídos |
|----------|-------|----------|-----------------|
| Criar pedido (funcionário) | LOG | 📝 Adicionando itens ao pedido | comandaId, qtdItens |
| Pedido criado | LOG | ✅ Pedido criado com sucesso | pedidoId |
| Criar pedido (cliente) | LOG | 📦 Criando pedido do cliente | comandaId |
| Pedido cliente criado | LOG | ✅ Pedido do cliente criado | pedidoId |
| Buscar por ambiente | DEBUG | 🔍 Buscando pedidos por ambiente | ambienteId |
| Pedidos encontrados | DEBUG | ✅ X pedidos encontrados | quantidade |
| Atualizar status | LOG | 🔄 Atualizando status do item | itemPedidoId, novoStatus |
| Status atualizado | LOG | ✅ Status atualizado com sucesso | itemPedidoId, status |
| Erro qualquer | ERROR | Descrição do erro | Contexto relevante |

### **Logs do WebSocket**

| Evento | Nível | Mensagem | Dados |
|--------|-------|----------|-------|
| Conectado | LOG | 🔌 Conectado ao ambiente | socketId, ambienteId |
| Novo pedido | LOG | 🆕 Novo pedido recebido | ambienteId, pedidoId, itens |
| Som disparado | LOG | 🔔 Notificação sonora disparada | - |
| Status atualizado | LOG | 🔄 Status atualizado | ambienteId, pedidoId |
| Desconectado | WARN | Desconectado do WebSocket | ambienteId, reason |
| Erro conexão | ERROR | Erro ao conectar no WebSocket | error |
| Reconectando | WARN | Tentando reconectar (X) | ambienteId, attempt |
| Reconectado | LOG | ✅ Reconectado após X tentativas | ambienteId, attempts |

### **Como Visualizar**

```bash
# No navegador
F12 → Console → Filtrar "[CLIENT]"

# Filtrar por módulo
[CLIENT] [PedidoService]
[CLIENT] [WebSocket]
```

---

## 🔄 Fluxo Completo

### **1. Criação de Pedido (Funcionário)**

```
Garçom seleciona produtos
       ↓
createPedidoDto montado
       ↓
adicionarItensAoPedido()
       ↓
POST /pedidos (com JWT)
       ↓
Backend cria Pedido + Itens
       ↓
PedidosGateway.emitNovoPedido()
       ↓
WebSocket emite eventos:
  - novo_pedido (global)
  - novo_pedido_ambiente:{id} (específico)
       ↓
useAmbienteNotification recebe
       ↓
Som toca + Destaque visual (5s)
       ↓
Pedido aparece na coluna "A Fazer"
```

### **2. Atualização de Status**

```
Cozinheiro clica "Em Preparo"
       ↓
updateItemStatus(itemId, { status: EM_PREPARO })
       ↓
PATCH /pedidos/item/{id}/status
       ↓
Backend atualiza ItemPedido
       ↓
PedidosGateway.emitStatusAtualizado()
       ↓
WebSocket emite eventos:
  - status_atualizado (global)
  - status_atualizado_ambiente:{id}
       ↓
useAmbienteNotification recebe
       ↓
fetchDados() recarrega pedidos
       ↓
Item move para coluna "Em Preparo"
```

### **3. Cancelamento**

```
Funcionário clica "Cancelar"
       ↓
Dialog abre
       ↓
Digita motivo (mín. 5 chars)
       ↓
updateItemStatus(itemId, {
  status: CANCELADO,
  motivoCancelamento: 'motivo'
})
       ↓
Backend atualiza + emite evento
       ↓
Item some do painel (filtrado)
```

---

## 📚 Como Usar

### **1. Implementar Painel Personalizado**

```tsx
'use client';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import { getPedidosPorAmbiente } from '@/services/pedidoService';

export function MeuPainelPersonalizado({ ambienteId }) {
  const { novoPedidoId, audioConsentNeeded, handleAllowAudio } = 
    useAmbienteNotification(ambienteId);
  
  // Buscar pedidos
  useEffect(() => {
    async function fetchPedidos() {
      const pedidos = await getPedidosPorAmbiente(ambienteId);
      setPedidos(pedidos);
    }
    fetchPedidos();
  }, [ambienteId]);
  
  // Renderizar...
}
```

### **2. Criar Pedido Programaticamente**

```tsx
import { adicionarItensAoPedido } from '@/services/pedidoService';

async function criarPedido() {
  const pedido = await adicionarItensAoPedido({
    comandaId: 'uuid-comanda',
    itens: [
      {
        produtoId: 'uuid-produto',
        quantidade: 2,
        observacao: 'Sem cebola'
      }
    ]
  });
  
  console.log('Pedido criado:', pedido.id);
}
```

### **3. Atualizar Status**

```tsx
import { updateItemStatus } from '@/services/pedidoService';
import { PedidoStatus } from '@/types/pedido';

async function marcarPronto(itemId: string) {
  await updateItemStatus(itemId, {
    status: PedidoStatus.PRONTO
  });
}

async function cancelar(itemId: string) {
  await updateItemStatus(itemId, {
    status: PedidoStatus.CANCELADO,
    motivoCancelamento: 'Cliente desistiu'
  });
}
```

---

## ✅ Checklist de Implementação

### **Tipos & DTOs**
- [x] pedido.ts com interfaces atualizadas
- [x] pedido.dto.ts com todos DTOs
- [x] ComandaSimples incluída
- [x] Status individuais por item

### **Serviços**
- [x] adicionarItensAoPedido com logs
- [x] createPedidoFromCliente com logs
- [x] getPedidosPorAmbiente com logs
- [x] updateItemStatus com logs
- [x] Logger integrado em todas funções

### **WebSocket**
- [x] useAmbienteNotification hook
- [x] Logs de conexão/desconexão
- [x] Logs de eventos
- [x] Logs de reconexão
- [x] Destaque visual (5s)
- [x] Som de notificação

### **Componentes**
- [x] PedidoCard com filtro de status
- [x] Botões contextuais por status
- [x] Dialog de cancelamento
- [x] Validação de motivo (5+ chars)

### **Páginas**
- [x] OperacionalClientPage (Kanban)
- [x] Integração com WebSocket
- [x] Polling de backup (30s)
- [x] Estados de loading/error
- [x] Botão de ativar áudio

### **Logs**
- [x] PedidoService com logger
- [x] useAmbienteNotification com logger
- [x] Níveis apropriados (LOG, WARN, ERROR, DEBUG)
- [x] Dados contextuais incluídos

---

## 🚀 Próximos Passos Sugeridos

1. **Implementar Filtros Avançados**
   - Por data
   - Por mesa
   - Por status global do pedido

2. **Adicionar Métricas**
   - Tempo médio de preparo
   - Pedidos por hora
   - Taxa de cancelamento

3. **Melhorias de UX**
   - Drag & drop entre colunas
   - Teclado shortcuts
   - Modo escuro

4. **Integrações**
   - Impressora térmica (auto-print)
   - Notificações push (browser)
   - Export de relatórios

5. **Testes**
   - Unit tests (services)
   - Integration tests (WebSocket)
   - E2E tests (Playwright)

---

## 📝 Notas Técnicas

### **Políticas de Navegador**

Os navegadores modernos bloqueiam áudio automático. O sistema exige **consentimento explícito** via botão "Ativar Som de Notificações".

### **Reconexão Automática**

Socket.IO gerencia reconexão automaticamente com backoff exponencial. Logs detalhados ajudam a diagnosticar problemas de rede.

### **Performance**

- Polling como fallback (não substitui WebSocket)
- Filtros aplicados antes de renderizar
- Memoização de callbacks
- useCallback para evitar re-renders

### **Segurança**

- API autenticada usa JWT
- API pública tem endpoint separado (`/pedidos/cliente`)
- Validação de DTOs no backend
- TypeScript garante type-safety

---

## 🎉 Conclusão

O módulo de pedidos no frontend está **production-ready** com:
- ✅ Tipos TypeScript completos
- ✅ Serviços com logs estruturados
- ✅ WebSocket integrado
- ✅ Notificações sonoras
- ✅ UI responsiva e interativa
- ✅ Documentação completa

**Pronto para ser usado em produção!** 🚀
