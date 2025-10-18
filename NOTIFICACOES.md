# 🔔 Sistema de Notificação Sonora Dinâmica para Ambientes de Preparo

## 📋 Visão Geral

Este sistema implementa notificações sonoras **dinâmicas** para **qualquer ambiente de preparo** criado pelo administrador do sistema.

### 🌟 Diferencial: Sistema 100% Dinâmico

**Não há hardcode de ambientes!** O sistema funciona com:
- Cozinha 1, Cozinha 2, Cozinha 3...
- Bar Principal, Bar VIP, Bar da Piscina...
- Churrasqueira, Forno, Chapeiro...
- **Qualquer nome/quantidade que o admin criar!**

---

## 🎯 Funcionalidades

### ✅ O que foi implementado:

1. **Notificação por Ambiente**
   - Cada ambiente (Cozinha, Bar, etc.) recebe notificações específicas
   - Som toca automaticamente quando um novo pedido chega
   - Visual: Pedido novo aparece destacado com animação

2. **Controle de Áudio**
   - Botão para ativar/desativar som
   - Respeita políticas de autoplay do navegador
   - Volume configurável (70% por padrão)

3. **WebSocket em Tempo Real**
   - Conexão persistente com o backend
   - Atualizações instantâneas sem refresh
   - Eventos específicos por ambiente

4. **Feedback Visual**
   - Destaque com borda verde pulsante
   - Animação de 5 segundos no novo pedido
   - Indicador de status do som ativo

---

## 🏗️ Arquitetura

### Backend (NestJS)

```
PedidosGateway
├── emitNovoPedido() → Emite para todos
│   └── novo_pedido_ambiente:{ambienteId} → Específico do ambiente
└── emitStatusAtualizado() → Emite para todos
    └── status_atualizado_ambiente:{ambienteId} → Específico do ambiente
```

**Arquivos modificados:**
- `backend/src/modulos/pedido/pedidos.gateway.ts`

### Frontend (Next.js)

```
useAmbienteNotification (Hook)
├── Conecta ao WebSocket
├── Escuta novo_pedido_ambiente:{ambienteId}
├── Toca som de notificação
└── Retorna estado e funções de controle

CozinhaPageClient (Componente)
├── Usa useAmbienteNotification
├── Mostra botão de ativar som
├── Destaca pedidos novos
└── Gerencia lista de pedidos
```

**Arquivos criados/modificados:**
- `frontend/src/hooks/useAmbienteNotification.ts` (NOVO)
- `frontend/src/components/cozinha/CozinhaPageClient.tsx` (MODIFICADO)

---

## 🔊 Como Funciona

### Fluxo Completo:

```
1. Cliente faz pedido
   ↓
2. Backend cria pedido e identifica ambientes
   ↓
3. PedidosGateway emite eventos:
   - novo_pedido (global)
   - novo_pedido_ambiente:cozinha (específico)
   - novo_pedido_ambiente:bar (específico)
   ↓
4. Frontend (Cozinha) escuta evento específico
   ↓
5. Hook useAmbienteNotification:
   - Toca som (notification.mp3)
   - Define novoPedidoId
   ↓
6. Componente CozinhaPageClient:
   - Destaca pedido com borda verde
   - Remove destaque após 5 segundos
```

---

## 💻 Como Usar

### 1️⃣ Para Funcionários (Cozinha/Bar)

1. Acesse o painel de preparo:
   - `/dashboard/cozinha` → Painel genérico com seletor
   - `/dashboard/operacional/[ambienteId]` → Painel específico de um ambiente

2. **Se estiver no painel genérico:**
   - Use o dropdown **"Selecionar Ambiente"**
   - Escolha qual ambiente deseja monitorar
   - Os pedidos serão filtrados automaticamente

3. Clique em **"Ativar Som de Notificações"** 🔔

4. Pronto! O som tocará automaticamente quando:
   - Novos pedidos chegarem para o ambiente selecionado
   - O pedido aparecerá com borda verde pulsante por 5 segundos

### 2. Para Desenvolvedores

#### Usar notificações em outro componente:

```tsx
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';

function MeuComponente({ ambienteId }: { ambienteId: string }) {
  const { 
    novoPedidoId,           // ID do novo pedido (ou null)
    audioConsentNeeded,     // Se precisa pedir permissão
    handleAllowAudio,       // Função para ativar som
    clearNotification       // Função para limpar notificação
  } = useAmbienteNotification(ambienteId);

  return (
    <>
      {audioConsentNeeded && (
        <button onClick={handleAllowAudio}>
          Ativar Som
        </button>
      )}
      
      {pedidos.map(pedido => (
        <div 
          className={novoPedidoId === pedido.id ? 'destaque' : ''}
        >
          {/* Seu card de pedido */}
        </div>
      ))}
    </>
  );
}
```

---

## 🎨 Customizações

### Mudar o som de notificação:

1. Adicione seu arquivo `.mp3` em `frontend/public/`
2. Edite `useAmbienteNotification.ts`:
   ```typescript
   audioRef.current = new Audio('/seu-som.mp3');
   ```

### Mudar volume do som:

```typescript
// Em useAmbienteNotification.ts
audioRef.current.volume = 0.7; // 0.0 a 1.0 (70%)
```

### Mudar duração do destaque visual:

```typescript
// Em useAmbienteNotification.ts
setTimeout(() => {
  setNovoPedidoId(null);
}, 5000); // 5 segundos (altere aqui)
```

### Customizar cor/animação do destaque:

```tsx
// Em CozinhaPageClient.tsx
className={`transition-all duration-500 ${
  novoPedidoId === pedido.id 
    ? 'ring-4 ring-blue-500 animate-bounce' // Mude aqui
    : ''
}`}
```

---

## 🔧 Solução de Problemas

### Som não toca

**Causa:** Navegadores bloqueiam autoplay de áudio por padrão.

**Solução:** 
1. Certifique-se de clicar no botão "Ativar Som"
2. Isso é obrigatório por políticas do navegador

### Notificação não aparece

**Causa 1:** Ambiente ID não está sendo passado.

**Solução:**
```tsx
// Certifique-se de passar o ambienteId:
<CozinhaPageClient ambienteId="id-do-ambiente" />
```

**Causa 2:** WebSocket não conectado.

**Solução:**
1. Verifique se o backend está rodando
2. Veja console do navegador para erros de conexão
3. Confirme que `NEXT_PUBLIC_API_URL` está configurado

### Som toca mas sem destaque visual

**Causa:** `novoPedidoId` não está sendo usado na renderização.

**Solução:**
```tsx
// Certifique-se de usar novoPedidoId:
<div className={novoPedidoId === pedido.id ? 'destaque' : ''}>
```

---

## 📊 Eventos WebSocket

### Eventos Emitidos pelo Backend:

| Evento | Quando | Ouvintes |
|--------|--------|----------|
| `novo_pedido` | Novo pedido criado | Todos |
| `novo_pedido_ambiente:{id}` | Novo pedido para ambiente específico | Ambiente específico |
| `status_atualizado` | Status de pedido mudou | Todos |
| `status_atualizado_ambiente:{id}` | Status mudou em ambiente específico | Ambiente específico |
| `comanda_atualizada` | Comanda foi atualizada | Cliente da comanda |

### Exemplo de Payload:

```json
{
  "id": "pedido-123",
  "comanda": {
    "id": "comanda-456",
    "mesa": { "numero": 5 }
  },
  "itens": [
    {
      "id": "item-789",
      "produto": {
        "nome": "Pizza Margherita",
        "ambiente": {
          "id": "cozinha-001",
          "nome": "Cozinha"
        }
      },
      "quantidade": 1,
      "status": "FEITO"
    }
  ],
  "total": 35.00
}
```

---

## 🧪 Testando

### Teste Manual:

1. Abra o painel da cozinha: `http://localhost:3001/dashboard/cozinha`
2. Ative o som clicando no botão
3. Em outra aba, faça um pedido como cliente
4. Volte para o painel da cozinha
5. ✅ Deve tocar o som e destacar o pedido

### Teste de Múltiplos Ambientes:

1. Abra cozinha em uma aba
2. Abra bar em outra aba
3. Faça pedido com itens da cozinha
4. ✅ Só a cozinha deve tocar
5. Faça pedido com itens do bar
6. ✅ Só o bar deve tocar
7. Faça pedido misto (cozinha + bar)
8. ✅ Ambos devem tocar

---

## 🚀 Melhorias Futuras

- [ ] Notificação push no navegador (quando minimizado)
- [ ] Sons diferentes por tipo de pedido/prioridade
- [ ] Vibração em dispositivos móveis
- [ ] Histórico de notificações
- [ ] Configuração de volume por usuário
- [ ] Modo "não perturbe" com horários
- [ ] Estatísticas de tempo de resposta
- [ ] Integração com smartwatches

---

## 📝 Notas Técnicas

### Por que eventos específicos por ambiente?

Evita notificações desnecessárias. Se um pedido é só da cozinha, o bar não precisa ser notificado.

### Por que pedir consentimento de áudio?

Navegadores modernos (Chrome, Firefox, Safari) bloqueiam autoplay de áudio por padrão. É necessário uma interação do usuário (clique) para desbloquear.

### Por que 5 segundos de destaque?

Tempo suficiente para o funcionário notar o novo pedido, mas não muito longo para não atrapalhar a visualização.

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Verifique o console do navegador (F12)
2. Verifique os logs do backend
3. Confirme que o WebSocket está conectado
4. Teste com outro navegador

---

**✨ Sistema de notificações implementado e documentado!** 🔔
