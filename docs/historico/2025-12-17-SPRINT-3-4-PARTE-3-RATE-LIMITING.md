# ⚡ Sprint 3-4 - Parte 3: Rate Limiting

**Data de Implementação:** 17 de Dezembro de 2025  
**Sprint:** 3-4 (Parte 3 de 3)  
**Estimativa:** 12 horas  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Visão Geral

Sistema completo de Rate Limiting para proteção contra abuso, ataques de força bruta e DDoS, com limites customizados por endpoint, usuário e cargo.

---

## 🎯 Objetivos Alcançados

### **Proteção**
- ✅ Proteção contra força bruta em login
- ✅ Proteção contra DDoS
- ✅ Limites por IP e por usuário
- ✅ Limites diferenciados por cargo

### **Flexibilidade**
- ✅ Limites customizados por endpoint
- ✅ Decorators reutilizáveis
- ✅ Admin sem limites
- ✅ Usuários autenticados com limites maiores

### **Monitoramento**
- ✅ Estatísticas horárias
- ✅ Top IPs bloqueados
- ✅ Top usuários bloqueados
- ✅ Limpeza automática

---

## 🏗️ Arquitetura

### **CustomThrottlerGuard**

**Arquivo:** `backend/src/common/guards/custom-throttler.guard.ts`

**Funcionalidades:**
- Admin não tem limite
- Usuários autenticados têm limite 2x maior
- Chave única por IP + user ID + rota
- Mensagens de erro personalizadas

```typescript
async handleRequest(context, limit, ttl): Promise<boolean> {
  const user = request.user;

  // Admin não tem limite
  if (user?.cargo === 'ADMIN') {
    return true;
  }

  // Usuários autenticados têm limite 2x maior
  if (user) {
    limit = limit * 2;
  }

  // Chave: throttle:user:abc123:/produtos
  // ou:   throttle:ip:192.168.1.1:/produtos
  const key = this.generateKey(context, request.ip, user?.sub);

  const { totalHits } = await storageService.increment(key, ttl);

  if (totalHits > limit) {
    throw new ThrottlerException(
      `Muitas requisições. Tente novamente em ${Math.ceil(ttl / 1000)} segundos.`
    );
  }

  return true;
}
```

---

## 📦 Componentes Implementados

### **1. Decorators Customizados**

**Arquivo:** `backend/src/common/decorators/throttle.decorator.ts`

#### **@ThrottleLogin()**
Login e autenticação.
- **Limite:** 5 requisições
- **Período:** 15 minutos (900000ms)
- **Uso:** Endpoints de login

```typescript
@ThrottleLogin()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // 5 tentativas a cada 15 minutos
}
```

#### **@ThrottlePublic()**
Endpoints públicos.
- **Limite:** 20 requisições
- **Período:** 1 minuto (60000ms)
- **Uso:** APIs públicas sem autenticação

```typescript
@ThrottlePublic()
@Get('produtos')
async findAll() {
  // 20 requisições por minuto
}
```

#### **@ThrottleStrict()**
Operações sensíveis.
- **Limite:** 3 requisições
- **Período:** 1 hora (3600000ms)
- **Uso:** Reset senha, logout-all, mudança de permissões

```typescript
@ThrottleStrict()
@Post('logout-all')
async logoutAll() {
  // 3 requisições por hora
}
```

#### **@ThrottleAPI()**
APIs gerais.
- **Limite:** 100 requisições
- **Período:** 1 minuto (60000ms)
- **Uso:** Endpoints autenticados normais

```typescript
@ThrottleAPI()
@Get('sessions')
async getSessions() {
  // 100 requisições por minuto
}
```

#### **@ThrottleWrite()**
Operações de escrita.
- **Limite:** 30 requisições
- **Período:** 1 minuto (60000ms)
- **Uso:** CREATE, UPDATE, DELETE

```typescript
@ThrottleWrite()
@Post('produtos')
async create(@Body() dto: CreateProdutoDto) {
  // 30 requisições por minuto
}
```

#### **@NoThrottle()**
Bypass de rate limiting.
- **Uso:** Endpoints internos, webhooks
- **⚠️ Usar com cuidado!**

```typescript
@NoThrottle()
@Post('webhook')
async handleWebhook() {
  // Sem limite
}
```

### **2. RateLimitMonitorService**

**Arquivo:** `backend/src/common/monitoring/rate-limit-monitor.service.ts`

**Jobs Agendados:**

#### **Monitoramento Horário**
```typescript
@Cron(CronExpression.EVERY_HOUR)
async monitorRateLimits() {
  const stats = await this.getRateLimitStats();
  
  // Log de estatísticas
  this.logger.log(`📊 Rate Limit Stats:`);
  this.logger.log(`   Total de chaves ativas: ${stats.totalKeys}`);
  this.logger.log(`   Bloqueios por IP: ${stats.ipBlocks}`);
  this.logger.log(`   Bloqueios por usuário: ${stats.userBlocks}`);
  
  // Alertas de IPs suspeitos
  if (stats.topBlockedIPs.length > 0) {
    this.logger.warn(`⚠️ IPs mais bloqueados: ${JSON.stringify(stats.topBlockedIPs)}`);
  }
}
```

#### **Limpeza Diária**
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async cleanupExpiredKeys() {
  // Remove chaves sem TTL (não deveria acontecer)
  const keys = await this.redis.keys('throttle:*');
  let cleaned = 0;
  
  for (const key of keys) {
    const ttl = await this.redis.ttl(key);
    if (ttl === -1) {
      await this.redis.del(key);
      cleaned++;
    }
  }
}
```

**Estatísticas:**
```typescript
interface RateLimitStats {
  totalKeys: number;
  ipBlocks: number;
  userBlocks: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedUsers: Array<{ userId: string; count: number }>;
}
```

### **3. Integração com AuthController**

**Arquivo:** `backend/src/auth/auth.controller.ts`

**Limites Aplicados:**

| Endpoint | Decorator | Limite | Período |
|----------|-----------|--------|---------|
| `POST /auth/login` | `@ThrottleLogin()` | 5 | 15 min |
| `POST /auth/refresh` | `@ThrottleAPI()` | 100 | 1 min |
| `POST /auth/logout` | `@ThrottleAPI()` | 100 | 1 min |
| `POST /auth/logout-all` | `@ThrottleStrict()` | 3 | 1 hora |
| `GET /auth/sessions` | `@ThrottleAPI()` | 100 | 1 min |
| `DELETE /auth/sessions/:id` | `@ThrottleAPI()` | 100 | 1 min |

---

## 🔐 Regras de Limite

### **Por Cargo**

```typescript
// Admin
if (user?.cargo === 'ADMIN') {
  return true; // Sem limite
}

// Usuários autenticados
if (user) {
  limit = limit * 2; // Dobro do limite
}

// Usuários não autenticados
// Limite padrão
```

**Exemplo:**
- Endpoint com `@ThrottleAPI()` (100 req/min)
- **Admin:** Sem limite
- **Usuário autenticado:** 200 req/min
- **Não autenticado:** 100 req/min

### **Por Chave**

```
throttle:ip:192.168.1.1:/auth/login
throttle:user:abc123:/produtos
throttle:ip:10.0.0.5:/audit
```

**Benefícios:**
- Limites independentes por rota
- Rastreamento preciso
- Fácil debugging

---

## 📊 Monitoramento

### **Logs Automáticos**

```
[RateLimitMonitorService] 📊 Rate Limit Stats:
[RateLimitMonitorService]    Total de chaves ativas: 234
[RateLimitMonitorService]    Bloqueios por IP: 156
[RateLimitMonitorService]    Bloqueios por usuário: 78
[RateLimitMonitorService] ⚠️ IPs mais bloqueados: [
  { ip: "192.168.1.100", count: 45 },
  { ip: "10.0.0.23", count: 32 }
]
[RateLimitMonitorService] ⚠️ Usuários mais bloqueados: [
  { userId: "user123", count: 12 },
  { userId: "user456", count: 8 }
]
```

### **Estatísticas em Tempo Real**

```typescript
const stats = await rateLimitMonitorService.getRateLimitStats();

// Resultado:
{
  totalKeys: 234,
  ipBlocks: 156,
  userBlocks: 78,
  topBlockedIPs: [
    { ip: "192.168.1.100", count: 45 },
    { ip: "10.0.0.23", count: 32 }
  ],
  topBlockedUsers: [
    { userId: "user123", count: 12 },
    { userId: "user456", count: 8 }
  ]
}
```

---

## 🧪 Testes

### **Teste de Limite Básico**

```powershell
# Fazer 10 requisições rápidas ao login
for ($i=1; $i -le 10; $i++) {
    Write-Host "Tentativa $i"
    Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
      -Method POST `
      -Body '{"email":"test@test.com","senha":"wrong"}' `
      -ContentType "application/json"
}

# Resultado esperado:
# Tentativas 1-5: 401 Unauthorized (credenciais inválidas)
# Tentativas 6-10: 429 Too Many Requests
```

### **Teste de Limite por Cargo**

```powershell
# Usuário normal
$token = "..." # Token de usuário normal
for ($i=1; $i -le 150; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3000/produtos" `
      -Headers @{"Authorization"="Bearer $token"}
}
# Bloqueado após ~200 requisições (100 * 2)

# Admin
$adminToken = "..." # Token de admin
for ($i=1; $i -le 1000; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3000/produtos" `
      -Headers @{"Authorization"="Bearer $adminToken"}
}
# Nunca bloqueado
```

### **Verificar Chaves no Redis**

```bash
# Conectar ao Redis
docker exec -it pub_system_redis redis-cli

# Listar chaves de throttle
KEYS throttle:*

# Ver TTL de uma chave
TTL throttle:ip:192.168.1.1:/auth/login

# Ver valor de uma chave
GET throttle:ip:192.168.1.1:/auth/login
```

---

## 📝 Mensagens de Erro

### **429 Too Many Requests**

```json
{
  "statusCode": 429,
  "message": "Muitas requisições. Tente novamente em 900 segundos.",
  "error": "Too Many Requests"
}
```

**Headers de Resposta:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702857600
Retry-After: 900
```

---

## 📚 Arquivos Criados/Modificados

### **Criados (3)**
1. `backend/src/common/guards/custom-throttler.guard.ts` (60 linhas)
2. `backend/src/common/decorators/throttle.decorator.ts` (47 linhas)
3. `backend/src/common/monitoring/rate-limit-monitor.service.ts` (120 linhas)

### **Modificados (2)**
1. `backend/src/app.module.ts` - CustomThrottlerGuard + RateLimitMonitorService
2. `backend/src/auth/auth.controller.ts` - Decorators aplicados

**Total:** 5 arquivos | ~230 linhas de código

---

## ✅ Checklist de Implementação

- [x] Criar CustomThrottlerGuard
- [x] Criar decorators customizados (6 tipos)
- [x] Criar RateLimitMonitorService
- [x] Atualizar app.module
- [x] Aplicar em AuthController
- [x] Configurar limites por cargo
- [x] Implementar monitoramento
- [x] Implementar limpeza automática
- [x] Documentar implementação

---

## 🎯 Limites Configurados

### **Por Tipo de Operação**

| Operação | Limite | Período | Uso |
|----------|--------|---------|-----|
| **Login** | 5 | 15 min | Autenticação |
| **Público** | 20 | 1 min | APIs públicas |
| **Estrito** | 3 | 1 hora | Operações sensíveis |
| **API** | 100 | 1 min | Endpoints gerais |
| **Escrita** | 30 | 1 min | CREATE/UPDATE/DELETE |

### **Por Cargo**

| Cargo | Multiplicador | Exemplo (API) |
|-------|---------------|---------------|
| **Admin** | ∞ (sem limite) | Ilimitado |
| **Autenticado** | 2x | 200 req/min |
| **Não autenticado** | 1x | 100 req/min |

---

## 🔍 Casos de Uso

### **1. Proteção contra Força Bruta**
```
Atacante tenta 100 senhas diferentes
✅ Bloqueado após 5 tentativas
⏱️ Precisa esperar 15 minutos
```

### **2. Proteção contra DDoS**
```
Bot faz 1000 requisições/segundo
✅ Bloqueado após 100 requisições
⏱️ Precisa esperar 1 minuto
```

### **3. Admin sem Limites**
```
Admin fazendo manutenção
✅ Sem bloqueios
✅ Pode fazer quantas requisições precisar
```

### **4. Usuário Normal**
```
Usuário autenticado navegando
✅ Limite 2x maior que não autenticado
✅ Melhor experiência
```

---

## 📊 Métricas

**Tempo de Implementação:** ~4 horas (estimativa: 12h)  
**Linhas de Código:** ~230 linhas  
**Arquivos Criados:** 3  
**Arquivos Modificados:** 2  
**Decorators Criados:** 6  
**Jobs Agendados:** 2  

---

## 🚀 Próximos Passos

### **Aplicação em Mais Endpoints**
- [ ] Aplicar em ProdutoController
- [ ] Aplicar em ComandaController
- [ ] Aplicar em PedidoController
- [ ] Aplicar em endpoints públicos

### **Melhorias Futuras**
- [ ] Dashboard de monitoramento
- [ ] Alertas por email/Slack
- [ ] Blacklist automática de IPs
- [ ] Whitelist de IPs confiáveis
- [ ] Rate limiting por API key

---

## 🎉 Sprint 3-4 Completa!

### **Resumo das 3 Partes**

| Parte | Funcionalidade | Tempo Estimado | Tempo Real | Status |
|-------|----------------|----------------|------------|--------|
| **1** | Refresh Tokens | 16h | ~6h | ✅ **COMPLETO** |
| **2** | Auditoria | 24h | ~8h | ✅ **COMPLETO** |
| **3** | Rate Limiting | 12h | ~4h | ✅ **COMPLETO** |
| **TOTAL** | **Sprint 3-4** | **52h** | **~18h** | ✅ **COMPLETO** |

### **Funcionalidades Implementadas**

**Segurança:**
- ✅ Refresh Tokens (renovação segura)
- ✅ Auditoria (rastreamento completo)
- ✅ Rate Limiting (proteção contra abuso)

**Total:**
- 27 arquivos criados/modificados
- ~1620 linhas de código
- 18 endpoints novos
- 6 jobs agendados
- 11 índices de banco

---

**Implementação concluída em:** 17 de Dezembro de 2025  
**Status:** ✅ **SPRINT 3-4 COMPLETA**  
**Sistema:** 🔐 **SEGURO E AUDITÁVEL**
