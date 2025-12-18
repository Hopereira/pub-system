# [F5] Segurança Avançada - Refresh Tokens e Rate Limiting por Tenant

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Implementação de duas camadas de segurança avançada para multi-tenancy:

1. **F5.1 - Refresh Tokens por Tenant**: Isolamento de sessão por bar
2. **F5.2 - Rate Limiting por Tenant**: Limites de requisições por plano

---

## 🔐 F5.1 - Refresh Tokens por Tenant

### Problema Resolvido

Antes: Um refresh token gerado no Bar A poderia ser usado para renovar sessão no Bar B.

Depois: Cada refresh token é vinculado ao `tenantId`, impedindo uso cross-tenant.

### Implementação

```typescript
// Entidade RefreshToken - Nova coluna
@Column({ type: 'uuid', nullable: true })
@Index('idx_refresh_token_tenant')
tenantId: string;
```

### Fluxo de Validação

```
1. Login no Bar A
   └── Gera refresh token com tenantId = "bar-a-uuid"

2. Tentativa de refresh no Bar B
   └── validateRefreshToken(token, "bar-b-uuid")
   └── Token.tenantId !== Request.tenantId
   └── ❌ ForbiddenException: "Refresh token não pertence a este estabelecimento"
```

### JWT Payload Atualizado

```json
{
  "sub": "user-uuid",
  "email": "user@bar.com",
  "cargo": "ADMIN",
  "tenantId": "bar-uuid",  // NOVO
  "empresaId": "empresa-uuid"
}
```

---

## ⚡ F5.2 - Rate Limiting por Tenant

### Limites por Plano

| Plano | Req/Min | Req/Hora | Burst (1s) |
|-------|---------|----------|------------|
| **FREE** | 20 | 500 | 5 |
| **BASIC** | 60 | 2,000 | 15 |
| **PRO** | 100 | 5,000 | 30 |
| **ENTERPRISE** | 500 | 20,000 | 100 |

### Headers de Resposta

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Type: minute
```

### Resposta de Erro (429)

```json
{
  "statusCode": 429,
  "message": "Limite de requisições por minuto excedido. Tente novamente em breve.",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

### Uso do Guard

```typescript
// Aplicar globalmente no AppModule
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantRateLimitGuard,
    },
  ],
})
export class AppModule {}

// Ou em rotas específicas
@Controller('pedidos')
@UseGuards(TenantRateLimitGuard)
export class PedidosController {}

// Pular rate limit em rotas específicas
@Get('health')
@SkipRateLimit()
healthCheck() {}
```

### Armazenamento

- Usa **Redis** (via CacheManager) para contadores
- Chaves: `ratelimit:{tenantId}:{type}:{timestamp}`
- TTL automático baseado no tipo (1s, 60s, 3600s)

---

## 📁 Arquivos Modificados/Criados

### Refresh Tokens
- `backend/src/auth/entities/refresh-token.entity.ts` - Adicionado `tenantId`
- `backend/src/auth/refresh-token.service.ts` - Validação cross-tenant
- `backend/src/auth/auth.service.ts` - Passar `tenantId` no login

### Rate Limiting
- `backend/src/common/tenant/guards/tenant-rate-limit.guard.ts` - **NOVO**

### Migration
- `backend/src/migrations/1734550000000-AddTenantIdToRefreshTokens.ts` - **NOVO**

### Module
- `backend/src/common/tenant/tenant.module.ts` - Exports atualizados
- `backend/src/common/tenant/index.ts` - Exports atualizados

---

## 🔒 Segurança

### Proteções Implementadas

| Ameaça | Proteção |
|--------|----------|
| Token roubado usado em outro bar | Validação de `tenantId` no refresh |
| DDoS de um cliente | Rate limiting por tenant |
| Abuso de API | Limites diferenciados por plano |
| Burst de requisições | Limite por segundo |

### Logs de Auditoria

```
🚫 Tentativa de uso de refresh token cross-tenant!
   Token tenant: bar-a-uuid
   Request tenant: bar-b-uuid
   User: user@bar.com

🚫 Rate limit MINUTO excedido para tenant bar-uuid (FREE): 21/20
```

---

## ✅ Critérios de Aceitação

### F5.1 - Refresh Tokens
| Critério | Status |
|----------|--------|
| Refresh token armazena `tenantId` | ✅ |
| Validação cross-tenant no refresh | ✅ |
| JWT inclui `tenantId` | ✅ |
| Log de tentativas cross-tenant | ✅ |
| Migration para coluna `tenantId` | ✅ |

### F5.2 - Rate Limiting
| Critério | Status |
|----------|--------|
| Limites diferenciados por plano | ✅ |
| Contador por minuto | ✅ |
| Contador por hora | ✅ |
| Proteção contra burst | ✅ |
| Headers X-RateLimit-* | ✅ |
| Decorator @SkipRateLimit() | ✅ |
| Fallback por IP sem tenant | ✅ |

---

## 🚀 Próximos Passos

1. **Ativar globalmente**: Adicionar `TenantRateLimitGuard` como `APP_GUARD`
2. **Monitoramento**: Dashboard de uso de API por tenant
3. **Alertas**: Notificar quando tenant atinge 80% do limite
4. **Upgrade automático**: Sugerir upgrade de plano quando limites são atingidos
