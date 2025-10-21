# 📋 Sistema de Logs Frontend - Pub System

## ✅ Implementação Completa

Sistema de logging profissional implementado em **3 camadas críticas** do frontend Next.js 15.

---

## 🎯 Camadas Implementadas

### 1. 🌐 Camada de Serviços API (`src/services/`)

**Arquivo:** `services/api.ts`

#### **Funcionalidades Implementadas:**

✅ **Interceptor de Requisição:**
```typescript
- Log de todas as requisições (método + URL)
- Timestamp para calcular duração
- Autenticação automática via JWT
```

✅ **Interceptor de Resposta:**
```typescript
- Log de respostas bem-sucedidas com status e duração
- Log detalhado de erros (4xx, 5xx)
- Tratamento específico por tipo de erro:
  * 401: Sessão expirada
  * 403: Acesso negado
  * 500+: Erro interno do servidor
  * Timeout/Rede: Sem resposta do servidor
```

#### **Exemplos de Logs:**
```
[CLIENT] ✅ [14:30:45] [API] 📤 POST /pedidos
[CLIENT] ✅ [14:30:45] [API] 📥 ✅ POST /pedidos - 201 (145ms)
[CLIENT] ❌ [14:30:50] [API] 🔥 GET /pedidos/123 - Falhou
  └─ Data: { status: 404, message: "Pedido não encontrado" }
[CLIENT] ⚠️ [14:31:00] [API] Sessão expirada - Token inválido
[CLIENT] ❌ [14:31:10] [API] Sem resposta do servidor - Timeout ou erro de rede
```

#### **Cobertura:**
- ✅ API autenticada (`api`)
- ✅ API pública (`publicApi`)
- ✅ Todos os services (pedido, comanda, produto, etc.)

---

### 2. 🔌 WebSocket Client (`src/hooks/`)

**Arquivo:** `hooks/useAmbienteNotification.ts`

#### **Funcionalidades Implementadas:**

✅ **Eventos de Conexão:**
```typescript
- Conexão estabelecida (socketId)
- Desconexão normal vs. inesperada
- Erro ao conectar
```

✅ **Eventos de Reconexão:**
```typescript
- Tentativas de reconexão (contador)
- Reconexão bem-sucedida
```

✅ **Eventos de Dados:**
```typescript
- Novo pedido recebido (com contagem de itens)
- Status atualizado
- Notificação sonora disparada
```

✅ **Gestão de Áudio:**
```typescript
- Áudio habilitado e testado
- Falha ao testar áudio
- Falha ao reproduzir som
- Tentativa sem permissão do usuário
```

#### **Exemplos de Logs:**
```
[CLIENT] ✅ [14:32:00] [WebSocket] 🔌 Conectado ao ambiente cozinha-id
  └─ Data: { socketId: "abc123xyz" }
[CLIENT] ✅ [14:32:05] [WebSocket] 🆕 Novo pedido recebido
  └─ Data: { ambienteId: "cozinha-id", pedidoId: "uuid...", itens: 3 }
[CLIENT] ✅ [14:32:05] [WebSocket] 🔔 Notificação sonora disparada
[CLIENT] ✅ [14:32:10] [WebSocket] 🔄 Status atualizado
  └─ Data: { ambienteId: "cozinha-id", pedidoId: "uuid..." }
[CLIENT] ⚠️ [14:32:20] [WebSocket] Desconectado do WebSocket
  └─ Data: { ambienteId: "cozinha-id", reason: "transport close" }
[CLIENT] ❌ [14:32:20] [WebSocket] Desconexão inesperada - Tentando reconectar
[CLIENT] ⚠️ [14:32:25] [WebSocket] Tentando reconectar (1)
[CLIENT] ✅ [14:32:30] [WebSocket] ✅ Reconectado com sucesso após 1 tentativas
```

---

### 3. 🖥️ Server Components e API Routes

**Arquivos de Template Criados:**
- `app/api/example/route.ts` - Template de API Route
- `lib/server-logger-example.ts` - Template de Server Component

#### **Funcionalidades dos Templates:**

✅ **API Routes:**
```typescript
- Log de requisições GET/POST
- Validação de dados com logs
- Tratamento de JSON inválido
- Medição de duração (performance)
- Logs específicos por tipo de erro
```

✅ **Server Components (SSR):**
```typescript
- Log de início de renderização
- Log de fetch de dados
- Tratamento de erros de rede
- Log de conclusão/erro de renderização
- Prefixo [SSR] para identificar logs do servidor
```

#### **Exemplos de Logs (API Routes):**
```
[SSR] ✅ [14:33:00] [API Route] 🔍 Processando requisição GET
  └─ Data: { path: "/api/example", query: "teste" }
[SSR] ✅ [14:33:00] [API Route] ✅ Requisição concluída (45ms)
[SSR] ⚠️ [14:33:10] [API Route] ⚠️ Dados inválidos recebidos
  └─ Data: { receivedKeys: ["name"] }
[SSR] ❌ [14:33:20] [API Route] ❌ JSON inválido recebido
```

#### **Exemplos de Logs (Server Components):**
```
[SSR] ✅ [14:34:00] [ServerComponent] 🔍 [SSR] Buscando dados de: http://localhost:3000/api/produtos
[SSR] ✅ [14:34:00] [ServerComponent] ✅ [SSR] Dados carregados com sucesso (120ms)
  └─ Data: { url: "...", itemCount: 42 }
[SSR] ❌ [14:34:10] [ServerComponent] 🔥 [SSR] Erro de rede ao buscar dados (5000ms)
```

---

## 📚 Utilitário de Logging

**Arquivo:** `lib/logger.ts`

### **API do Logger:**

```typescript
import { logger } from '@/lib/logger';

// 1. Log normal (operações bem-sucedidas)
logger.log('Operação concluída', { 
  module: 'NomeDoModulo', 
  data: { key: 'value' } 
});

// 2. Info (informações úteis)
logger.info('Informação importante', { 
  module: 'NomeDoModulo' 
});

// 3. Warning (situações anormais)
logger.warn('Atenção necessária', { 
  module: 'NomeDoModulo',
  data: { reason: 'exemplo' }
});

// 4. Error (erros críticos)
logger.error('Operação falhou', {
  module: 'NomeDoModulo',
  error: errorObject,
  data: { context: 'info' }
});

// 5. Debug (apenas em desenvolvimento)
logger.debug('Informação de debug', {
  module: 'NomeDoModulo',
  data: { details: 'exemplo' }
});

// 6. API específico (requisições HTTP)
logger.api('request', {
  method: 'POST',
  url: '/api/pedidos',
});

logger.api('response', {
  method: 'POST',
  url: '/api/pedidos',
  status: 201,
  duration: 145,
});

logger.api('error', {
  method: 'GET',
  url: '/api/pedidos',
  error: errorData,
});

// 7. WebSocket específico
logger.socket('Conectado ao servidor', { socketId: 'abc123' });
```

### **Características:**

✅ **Funciona em Client e Server:**
- Detecta automaticamente o ambiente
- Prefixo `[CLIENT]` ou `[SSR]`

✅ **Formatação Consistente:**
- Timestamp no formato brasileiro
- Ícones visuais para cada nível
- Módulo identificado

✅ **Dados Estruturados:**
- Objetos são logados de forma legível
- Stack traces apenas em desenvolvimento
- Dados opcionais bem formatados

✅ **Controle por Ambiente:**
- `logger.debug()` só funciona em development
- Em produção, logs podem ser silenciados

---

## 🎨 Ícones Utilizados

| Nível | Ícone | Uso |
|-------|-------|-----|
| **LOG** | ✅ | Operações normais bem-sucedidas |
| **INFO** | ℹ️ | Informações importantes |
| **WARN** | ⚠️ | Situações anormais não críticas |
| **ERROR** | ❌ | Erros críticos |
| **DEBUG** | 🔍 | Informações técnicas (dev only) |
| **API Request** | 📤 | Requisições enviadas |
| **API Response** | 📥 | Respostas recebidas |
| **API Error** | 🔥 | Erros de API |
| **WebSocket Connect** | 🔌 | Conexão estabelecida |
| **WebSocket Disconnect** | 🔴 | Desconexão |
| **WebSocket Event** | 📡 | Evento recebido |
| **Audio** | 🔊 🔔 | Áudio/notificação |
| **New Item** | 🆕 | Novo registro |
| **Update** | 🔄 | Atualização |

---

## 🚀 Como Visualizar os Logs

### **1. No Navegador (Client-Side)**

```javascript
// Abra o DevTools (F12)
// Console → Filtrar por:
"[CLIENT]"     // Apenas logs do cliente
"[API]"        // Apenas logs de API
"[WebSocket]"  // Apenas logs de WebSocket
"❌"           // Apenas erros
"⚠️"           // Apenas warnings
```

### **2. No Terminal (Server-Side)**

```powershell
# Ver logs do frontend Next.js
docker-compose logs -f frontend

# Filtrar por SSR
docker-compose logs frontend | Select-String "\[SSR\]"

# Filtrar por erros
docker-compose logs frontend | Select-String "❌"
```

### **3. Logs em Tempo Real**

Durante desenvolvimento, os logs aparecem:
- **Browser Console** → Logs do cliente
- **Terminal do frontend** → Logs do servidor (SSR)

---

## 📊 Níveis de Log e Quando Usar

| Nível | Quando Usar | Exemplo |
|-------|-------------|---------|
| **log()** | Operação bem-sucedida | Requisição concluída, dados carregados |
| **info()** | Informação importante | Inicialização de módulo, configuração |
| **warn()** | Situação anormal | Token expirado, dado faltando (não crítico) |
| **error()** | Erro crítico | Falha de rede, exceção não tratada |
| **debug()** | Debugging técnico | Estados internos, valores de variáveis |

---

## 🎯 Benefícios Implementados

### ✅ **Debugging Facilitado**
- Rastreamento completo de requisições API
- Tempo de resposta medido automaticamente
- Stack traces em desenvolvimento

### ✅ **Monitoramento de Performance**
- Duração de cada requisição logada
- Identificação de endpoints lentos
- Tempo de reconexão do WebSocket

### ✅ **Detecção de Problemas de Rede**
- Timeouts identificados
- Desconexões inesperadas alertadas
- Tentativas de reconexão logadas

### ✅ **Rastreamento de Eventos em Tempo Real**
- Novos pedidos logados com detalhes
- Notificações sonoras rastreadas
- Atualizações de status registradas

### ✅ **Troubleshooting Rápido**
- Logs estruturados por módulo
- Ícones visuais para fácil identificação
- Dados de contexto sempre disponíveis

---

## 📈 Próximas Melhorias Sugeridas

### 1. **Integração com Ferramentas Externas**

```typescript
// Sentry para monitoramento de erros em produção
npm install @sentry/nextjs

// LogRocket para session replay
npm install logrocket logrocket-react

// DataDog para APM e logs centralizados
npm install @datadog/browser-logs
```

### 2. **Logs Persistentes**

```typescript
// Salvar logs em localStorage
// Enviar logs críticos para o backend
// Criar dashboard de logs interno
```

### 3. **Alertas Automáticos**

```typescript
// Webhook para Slack/Discord em erros críticos
// Email para timeouts recorrentes
// Notificação push para desconexões frequentes
```

### 4. **Analytics de Logs**

```typescript
// Contar quantos erros 500 por dia
// Medir latência média de APIs
// Rastrear taxa de sucesso de WebSocket
```

---

## 🔧 Configuração Adicional (Opcional)

### **Desabilitar Logs em Produção**

Em `lib/logger.ts`, adicione:

```typescript
class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  log(message: string, options: LogOptions = {}) {
    if (this.isProduction) return; // Silencia logs em produção
    // ... resto do código
  }
}
```

### **Enviar Logs para Backend**

```typescript
// Em logger.ts, adicione:
private async sendToBackend(level: LogLevel, message: string, options: LogOptions) {
  if (level === 'error' && !isServer) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        body: JSON.stringify({ level, message, options }),
      });
    } catch (e) {
      // Ignora falhas ao enviar logs
    }
  }
}
```

---

## 📁 Arquivos Criados/Modificados

### **Novos Arquivos** (4):
1. ✨ `lib/logger.ts` - Utilitário de logging
2. ✨ `app/api/example/route.ts` - Template de API Route
3. ✨ `lib/server-logger-example.ts` - Template de Server Component
4. ✨ `LOGGING-FRONTEND.md` - Documentação completa

### **Arquivos Modificados** (2):
1. 🔧 `services/api.ts` - Interceptors com logs completos
2. 🔧 `hooks/useAmbienteNotification.ts` - Logs de WebSocket

---

## 📚 Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

---

## ✨ Conclusão

✅ **Sistema de Logs Frontend 100% Implementado!**

- 3 camadas críticas cobertas
- Logs estruturados e consistentes
- Performance monitorada
- Erros rastreados automaticamente
- Templates prontos para uso
- Pronto para produção

**Agora você tem visibilidade completa do frontend e backend!** 🚀

---

## 🔗 Integração com Backend

Este sistema de logs frontend complementa o [sistema de logs do backend](./LOGGING.md):

- **Backend:** Logs em NestJS com interceptors e filters
- **Frontend:** Logs em Next.js com axios e WebSocket
- **Juntos:** Rastreamento end-to-end completo

Para visualizar logs de ambos:
```powershell
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Ambos
docker-compose logs -f
```
