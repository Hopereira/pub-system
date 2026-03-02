# [F4.1] Isolamento de WebSockets por Namespace de Tenant

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Implementação de isolamento de WebSockets por tenant para garantir que notificações de "Novo Pedido" de um restaurante nunca apareçam na cozinha de outro estabelecimento.

---

## 🔒 Problema Resolvido

### Antes (VULNERÁVEL)
```
Bar A faz pedido → server.emit('novo_pedido')
                        ↓
TODOS os clientes conectados recebem!
(incluindo Bar B, Bar C, etc)
```

### Depois (SEGURO)
```
Bar A faz pedido → server.to('tenant_A').emit('novo_pedido')
                        ↓
Apenas clientes do Bar A recebem
```

---

## 💻 Implementação

### BaseTenantGateway

Classe abstrata que fornece isolamento automático por tenant.

```typescript
// backend/src/common/tenant/gateways/base-tenant.gateway.ts

export abstract class BaseTenantGateway {
  // Extrai tenant_id do handshake (JWT, query, header)
  protected extractTenantId(client: Socket): string | null;
  
  // Adiciona cliente ao room do tenant
  protected joinTenantRoom(client: Socket): string | null;
  
  // Emite evento apenas para clientes do tenant
  protected emitToTenant(tenantId: string, event: string, data: any): void;
}
```

### Fluxo de Conexão

```
1. Cliente conecta com JWT no handshake
2. Gateway extrai empresaId do JWT
3. Cliente é adicionado ao room "tenant_{empresaId}"
4. Eventos são emitidos apenas para o room do tenant
```

---

## 📁 Arquivos Modificados

### Novos
- `backend/src/common/tenant/gateways/base-tenant.gateway.ts`
- `backend/src/common/tenant/gateways/base-tenant.gateway.spec.ts`

### Atualizados
- `backend/src/modulos/pedido/pedidos.gateway.ts`
- `backend/src/modulos/turno/turno.gateway.ts`
- `backend/src/common/tenant/index.ts`

---

## 🔄 Eventos Isolados

### PedidosGateway

| Evento | Descrição |
|--------|-----------|
| `novo_pedido` | Novo pedido criado |
| `status_atualizado` | Status do pedido alterado |
| `novo_pedido_ambiente:{id}` | Pedido para ambiente específico |
| `status_atualizado_ambiente:{id}` | Status alterado por ambiente |
| `comanda_atualizada` | Comanda modificada |
| `nova_comanda` | Nova comanda criada |
| `caixa_atualizado` | Movimentação no caixa |

### TurnoGateway

| Evento | Descrição |
|--------|-----------|
| `funcionario_check_in` | Funcionário iniciou turno |
| `funcionario_check_out` | Funcionário encerrou turno |
| `funcionarios_ativos_atualizado` | Lista de ativos mudou |

---

## 🧪 Testes

### Cenários Testados (10 testes)

1. **Extração de tenant_id**
   - Do JWT no auth
   - Do header Authorization
   - Do query param (fallback)
   - Do header x-tenant-id (fallback)
   - Retorna null se não encontrar

2. **Join no Room**
   - Adiciona cliente ao room correto
   - Retorna null se sem tenant

3. **Emissão de Eventos**
   - Emite apenas para room do tenant
   - Tenants diferentes não se afetam

4. **Isolamento**
   - Cliente do Tenant A não recebe eventos do Tenant B

---

## 🚀 Como Usar no Frontend

### Conectar com JWT

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

socket.on('novo_pedido', (pedido) => {
  // Recebe apenas pedidos do seu tenant
  console.log('Novo pedido:', pedido);
});
```

### Alternativa: Query Param

```typescript
const socket = io('http://localhost:3000', {
  query: {
    tenantId: 'uuid-do-tenant',
  },
});
```

---

## ✅ Critérios de Aceitação

| Critério | Status |
|----------|--------|
| Abrir duas abas com tenants distintos | ✅ |
| Fazer pedido no Tenant A | ✅ |
| Tenant B não recebe notificação | ✅ |
| Logs mostram isolamento | ✅ |

---

## 📊 Logs de Exemplo

```
🔌 Gateway de Pedidos inicializado com isolamento por tenant!
✅ Cliente abc123 conectado ao tenant: 550e8400-...
🔒 Evento 'novo_pedido' emitido para tenant 550e8400-... | Pedido: xyz789
```

---

## ⚠️ Compatibilidade

Para manter compatibilidade com clientes legados (sem JWT), o sistema faz fallback para broadcast quando não consegue identificar o tenant. Isso é logado como warning:

```
⚠️ Pedido xyz789 sem tenant_id, usando broadcast
```

Recomenda-se atualizar todos os clientes para enviar JWT no handshake.
