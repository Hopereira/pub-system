# Segurança — Pub System

**Última atualização:** 2026-02-11  
**Fonte da verdade:** `backend/src/main.ts`, `backend/src/auth/`, `backend/src/app.module.ts`  
**Status:** Ativo

---

## 1. Autenticação (JWT)

**Fonte:** `backend/src/auth/`

### Fluxo de Login

```
1. POST /auth/login { email, senha }
2. Backend valida credenciais (bcrypt)
3. Retorna { access_token, refresh_token }
4. Frontend armazena tokens em localStorage
5. Axios interceptor adiciona Bearer token em todas requisições
```

### Access Token
- Assinado com `JWT_SECRET` (mínimo 32 caracteres)
- Payload: `{ id, email, cargo, empresaId, tenantId }`
- Expiração configurável

### Refresh Token
- **Fonte:** `backend/src/auth/refresh-token.service.ts`
- Armazenado no banco (entidade `RefreshToken`)
- Permite renovar access token sem re-login
- Revogável individualmente ou em massa

### Endpoints de Sessão
| Endpoint | Descrição |
|----------|-----------|
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Renovar access token |
| `POST /auth/logout` | Logout + revogar refresh token |
| `POST /auth/logout-all` | Revogar todas as sessões |
| `GET /auth/sessions` | Listar sessões ativas |
| `DELETE /auth/sessions/:id` | Revogar sessão específica |

---

## 2. Autorização (Roles + Guards)

### Guards Globais

**Fonte:** `backend/src/app.module.ts` (providers com APP_GUARD)

| Guard | Escopo | Descrição |
|-------|--------|-----------|
| `JwtAuthGuard` | Global | Valida JWT em todas rotas (exceto `@Public()`) |
| `TenantGuard` | Global | Injeta e valida tenant (exceto `@SkipTenantGuard()`) |
| `CustomThrottlerGuard` | Global | Rate limiting (exceto `@SkipThrottle()`) |

### Guards por Controller

| Guard | Uso | Descrição |
|-------|-----|-----------|
| `RolesGuard` | `@UseGuards(RolesGuard)` | Verifica `@Roles(Cargo.ADMIN, ...)` |
| `FeatureGuard` | `@UseGuards(FeatureGuard)` | Verifica `@RequireFeature(Feature.X)` |

### Decorators

| Decorator | Efeito |
|-----------|--------|
| `@Public()` | Pula JwtAuthGuard |
| `@SkipTenantGuard()` | Pula TenantGuard |
| `@SkipRateLimit()` | Pula rate limiting |
| `@Roles(Cargo.ADMIN)` | Requer role específica |
| `@RequireFeature(Feature.ANALYTICS)` | Requer feature do plano |
| `@CurrentUser()` | Injeta usuário autenticado no handler |

### Roles do Sistema

| Role | Escopo | Descrição |
|------|--------|-----------|
| `SUPER_ADMIN` | Plataforma | Gestão de tenants, planos, métricas globais |
| `ADMIN` | Tenant | Acesso total ao estabelecimento |
| `GERENTE` | Tenant | No enum mas não usado em controllers |
| `CAIXA` | Tenant | Terminal de caixa, comandas |
| `GARCOM` | Tenant | Pedidos, entregas |
| `COZINHEIRO` | Tenant | Preparo de pedidos |
| `COZINHA` | Tenant | Alias de COZINHEIRO |
| `BARTENDER` | Tenant | Preparo (bar) |

---

## 3. Rate Limiting

**Fonte:** `backend/src/app.module.ts:106-122`

### Configuração Global (ThrottlerModule)

```typescript
ThrottlerModule.forRoot([
  { name: 'short',  ttl: 1000,   limit: 3  },   // 3 req/seg
  { name: 'medium', ttl: 10000,  limit: 20 },    // 20 req/10seg
  { name: 'long',   ttl: 60000,  limit: 100 },   // 100 req/min
])
```

### Decorators de Throttle

**Fonte:** `backend/src/common/decorators/throttle.decorator.ts`

| Decorator | Limites | Uso |
|-----------|---------|-----|
| `@ThrottleLogin()` | 5/min, 20/hora | Endpoint de login |
| `@ThrottleAPI()` | 30/min, 300/hora | Endpoints de API normais |
| `@ThrottleStrict()` | 3/min, 10/hora | Endpoints sensíveis |

### TenantRateLimitGuard

**⚠️ Status:** DESABILITADO em `app.module.ts:198-203` devido a problemas de DI.

Quando ativo, aplica rate limiting por tenant para evitar que um tenant abuse dos recursos.

---

## 4. Headers de Segurança (Helmet)

**Fonte:** `backend/src/main.ts:23-28`

```typescript
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
```

Headers aplicados: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.

---

## 5. Validação de Input

**Fonte:** `backend/src/main.ts:80-88`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

| Opção | Efeito |
|-------|--------|
| `whitelist: true` | Remove propriedades não decoradas do DTO |
| `forbidNonWhitelisted: true` | Rejeita requisições com propriedades extras |
| `transform: true` | Converte tipos automaticamente |

DTOs usam `class-validator` para validação declarativa.

---

## 6. CORS

**Fonte:** `backend/src/main.ts:44-74`

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'https://pub-system.vercel.app',
    'https://pubsystem.com.br',
    'https://www.pubsystem.com.br',
    /\.pubsystem\.com\.br$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

---

## 7. Auditoria

**Fonte:** `backend/src/modulos/audit/`

O módulo de auditoria registra automaticamente:

| Ação | Descrição |
|------|-----------|
| `CREATE` | Criação de entidades |
| `UPDATE` | Atualizações |
| `DELETE` | Remoções |
| `LOGIN` | Logins bem-sucedidos |
| `LOGIN_FAILED` | Tentativas de login falhadas |

### Endpoints de Consulta

| Endpoint | Descrição |
|----------|-----------|
| `GET /audit` | Listar registros com filtros |
| `GET /audit/entity/:name/:id` | Histórico de uma entidade |
| `GET /audit/user/:id` | Atividades de um usuário |
| `GET /audit/report` | Gerar relatório |
| `GET /audit/statistics` | Estatísticas |
| `GET /audit/failed-logins` | Tentativas de login falhadas |

---

## 8. Proteção de Dados

| Medida | Implementação |
|--------|--------------|
| Senhas | Hasheadas com bcrypt |
| CPF | Armazenado sem formatação |
| JWT Secret | Mínimo 32 caracteres, validado por Joi |
| Credenciais GCS | Arquivo JSON montado como volume read-only |
| .env | Protegido por .gitignore |
| Swagger | Desabilitado em produção |

---

## 9. Isolamento Multi-Tenant

**Fonte:** `backend/src/common/tenant/`

| Camada | Mecanismo | Bypass |
|--------|-----------|--------|
| HTTP | `TenantGuard` (global) valida tenant ativo | `@SkipTenantGuard()` |
| Query | `TenantInterceptor` (global) injeta `WHERE tenantId = ?` | — |
| WebSocket | `BaseTenantGateway` isola por room `tenant_{tenantId}` | — |
| Context | `TenantContextService` armazena tenantId por requisição | — |
| Resolução | `TenantResolverService` resolve via JWT, header ou slug | — |

### Fluxo
1. Requisição chega → `TenantGuard` extrai `tenantId` do JWT
2. Valida que tenant existe e está ATIVO (rejeita SUSPENSO/INATIVO)
3. `TenantInterceptor` injeta filtro em todas queries TypeORM
4. Serviço acessa dados apenas do tenant correto

### Risco: TenantRateLimitGuard DESABILITADO
**Arquivo:** `backend/src/app.module.ts:198-203`  
Guard de rate limiting por tenant está comentado (problemas de DI). Um tenant pode consumir recursos sem limitação.

---

## 10. Alertas de Segurança

### ❌ P0: SSH Key no Repositório
**Arquivo:** `ssh-key-2025-12-11.key` na raiz do repo  
**Ação:** Remover do repo e do histórico git. Revogar a chave.

### ⚠️ P0: Endpoint /setup/super-admin
**Arquivo:** `backend/src/auth/create-super-admin.controller.ts`  
**Risco:** Permite criar SUPER_ADMIN sem autenticação  
**Ação:** Remover em produção ou proteger com flag de ambiente

### ⚠️ P1: TenantRateLimitGuard Desabilitado
**Arquivo:** `backend/src/app.module.ts:198-203`  
**Risco:** Sem rate limiting por tenant em produção  
**Ação:** Resolver problemas de DI e reativar
