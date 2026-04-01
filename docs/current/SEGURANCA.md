# Segurança — Pub System

**Última atualização:** 2026-03-22  
**Fonte da verdade:** `backend/src/main.ts`, `backend/src/auth/`, `backend/src/app.module.ts`  
**Status:** Ativo

---

## 1. Autenticação (JWT)

**Fonte:** `backend/src/auth/`

### Fluxo de Login

```
1. POST /auth/login { email, senha }
2. Backend valida credenciais (bcrypt)
3. Retorna `{ access_token, expires_in, tenant_id, user }` no body — `refresh_token` **não** é exposto no body
4. `refresh_token` setado como **httpOnly cookie** (`path=/auth`, `SameSite=Lax`, `Secure` em prod, `maxAge=7d`)
5. Frontend armazena `access_token` em `localStorage` (TODO: migrar para memória — `useRef` no `AuthContext`)
6. Axios interceptor adiciona Bearer token em todas requisições
7. Refresh automático via POST /auth/refresh — cookie enviado automaticamente pelo browser
```

### Access Token
- Assinado com `JWT_SECRET` (mínimo 32 caracteres)
- Payload: `{ id, email, cargo, empresaId, tenantId }`
- Expiração configurável

### Refresh Token
- **Fonte:** `backend/src/auth/refresh-token.service.ts`
- Armazenado no banco (entidade `RefreshToken`)
- Setado pelo backend via `Set-Cookie` (`path=/auth`, `SameSite=Lax`, `Secure` em prod, `maxAge=7d`)
- **Nunca exposto no body da resposta**
- Lido pelo backend via `req.cookies['refresh_token']` nos endpoints `/auth/refresh` e `/auth/logout`
- Limpo via `res.clearCookie()` no logout
- Permite renovar access token sem re-login
- Revogável individualmente ou em massa
- Rotação automática quando `ROTATE_REFRESH_TOKEN=true`
- Aceita fallback via body (`@Body('refresh_token')`) para backward compatibility

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
| `RolesGuard` | `@UseGuards(RolesGuard)` | Verifica `@Roles(Cargo.ADMIN, ...)` com comparação **estrita** (`===`). `SUPER_ADMIN` tem bypass explícito. |
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
| GERENTE | Tenant | Supervisão operacional. Relatórios, pedidos, comandas. Implementado em 9 controllers. |
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

**✅ Status:** ATIVO — registrado como `APP_GUARD` dentro do `TenantModule`.

Limites por plano:

| Plano | req/min | req/hora | burst/seg |
|-------|---------|----------|-----------|
| FREE | 20 | 500 | 5 |
| BASIC | 60 | 2000 | 15 |
| PRO | 100 | 5000 | 30 |
| ENTERPRISE | 500 | 20000 | 100 |

Retorna headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Type`.

---

## 4. Headers de Segurança (Helmet)

**Fonte:** `backend/src/main.ts:23-47`

```typescript
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'https://api.pubsystem.com.br', 'wss://api.pubsystem.com.br'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false, // Desabilita CSP em dev para Swagger
    crossOriginEmbedderPolicy: false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
  }),
);
```

CSP ativa **apenas em produção** com directives completas. Em dev desabilitada para permitir Swagger.
Headers aplicados: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security (prod), Referrer-Policy, X-Content-Type-Options, X-XSS-Protection.

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

### Observabilidade
- Cada requisição recebe um `X-Request-Id` (UUID) para correlação de logs
- Header aceito do client ou gerado automaticamente
- Incluído em todos os logs de entrada/saída (`rid:<uuid>`)

---

## 10. Alertas de Segurança

### ✅ RESOLVIDO: SSH Key no Repositório
**Arquivo:** `ssh-key-2025-12-11.key` removido do repo.  
**Pendente:** Remover do histórico git (`git filter-repo` ou BFG). Revogar a chave no servidor.

### ✅ RESOLVIDO: Endpoint /setup/super-admin
**Arquivo:** `backend/src/auth/create-super-admin.controller.ts`  
**Solução:** Protegido com `ENABLE_SETUP=true` (env var) + `SETUP_TOKEN` **obrigatório** (token no body).  
Retorna 404 quando `ENABLE_SETUP` não está ativo **ou quando `SETUP_TOKEN` não estiver configurado**.  
A busca de usuário existente filtra por `tenantId: IsNull()` — evita escalada cross-tenant.

### ✅ RESOLVIDO: TenantRateLimitGuard
**Solução:** Guard já estava registrado corretamente dentro do `TenantModule`.  
O código comentado no `app.module.ts` era uma duplicata que causava erro de DI — removido.

### ⚠️ Pendente: SSH key no histórico git
A chave foi removida do HEAD mas ainda existe no histórico. Executar `bfg --delete-files ssh-key-2025-12-11.key` e `git push --force`.

---

## 11. Correções Aplicadas — 2026-03-22

Correções aplicadas após relatório de auditoria de segurança do Auth System (2026-03-22):

| # | Severidade | Arquivo(s) | Descrição |
|---|-----------|-----------|----------|
| 1 | 🔴 CRÍTICO | `auth.controller.ts` | `refresh_token` agora é setado como httpOnly cookie no login. Body não expõe mais o token. |
| 2 | 🔴 CRÍTICO | `refresh-token.service.ts` | Resposta de `/auth/refresh` padronizada para snake_case (`access_token`) igual ao `/auth/login`. |
| 3 | 🔴 CRÍTICO | `auth.controller.ts` | Logout e Refresh leem o token do cookie httpOnly. Cookie é limpo via `clearCookie` no logout. |
| 4 | 🔴 CRÍTICO | `create-super-admin.controller.ts` | `SETUP_TOKEN` agora é obrigatório quando `ENABLE_SETUP=true`. `findOne` filtra por `tenantId: IsNull()`. |
| 5 | 🟡 MÉDIO | `roles.guard.ts` | `RolesGuard` usa comparação exata (`===`) em vez de `String.includes()`. `SUPER_ADMIN` tem bypass explícito. |
| 6 | 🟡 MÉDIO | `AuthContext.tsx` | Verifica campo `exp` do JWT na inicialização — tokens expirados são descartados antes de setar o estado. |
| 7 | 🟡 MÉDIO | `middleware.ts`, `AuthContext.tsx` | Middleware protege `/dashboard/*`: redireciona para `/login` se cookie `authSession` estiver ausente. Cookie gerenciado pelo `AuthContext` no login/logout. |

**Relatório completo:** Auditoria de segurança Auth System — 2026-03-22.
