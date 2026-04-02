# Arquitetura Multi-Tenant — Pub System

**Versão:** 2.0
**Atualizado:** 2026-03-06
**Fonte da verdade:** Este documento substitui `docs/backend/multitenancy.md`

---

## 1. Visão Geral

O Pub System é um SaaS multi-tenant que atende múltiplos bares/restaurantes em uma única instância.
Cada bar é um **tenant** com dados completamente isolados.

### Modelo de Isolamento

| Aspecto | Implementação |
|---------|--------------|
| Banco | Compartilhado (`public` schema) |
| Isolamento | Coluna `tenant_id` (UUID) em todas as entidades operacionais |
| Tabela de tenants | `tenants` (id, slug, nome, plano, status, config) |
| Tabela de empresas | `empresas` (dados do estabelecimento, FK para tenant) |

---

## 2. Detecção do Tenant

O tenant é detectado automaticamente pelo `TenantInterceptor` (global) em **4 fontes**, nesta prioridade:

### Prioridade 1 — Subdomínio (Staff)

```
bar-do-ze.pubsystem.com.br → slug "bar-do-ze"
```

Extraído pelo `TenantResolverService.extractSlugFromHostname()`. Ignora subdomínios reservados: `www`, `api`, `admin`, `app`.

### Prioridade 2 — Slug na URL (Cliente via QR Code)

```
/menu/bar-do-ze/produtos → slug "bar-do-ze"
/evento/bar-do-ze        → slug "bar-do-ze"
/comanda/bar-do-ze       → slug "bar-do-ze"
```

Extraído pelo `TenantResolverService.extractSlugFromPath()`.

### Prioridade 3 — JWT (Rotas Autenticadas)

```
Authorization: Bearer <token>
Token payload: { sub, email, cargo, tenantId, ambienteId }
```

O `tenantId` é **obrigatório** no JWT. Tokens sem `tenantId` são rejeitados pelo `JwtStrategy.validate()` com 401.

### Prioridade 4 — Header (API / Integrações)

```
X-Tenant-ID: <uuid>     → resolve por ID
X-Tenant-ID: <slug>     → resolve por slug
X-Tenant-Slug: <slug>   → resolve por slug (login)
```

Aceita UUID ou slug. Usado pelo frontend no login (envia `x-tenant-slug` extraído do hostname).

---

## 3. Fluxo de Login

```
POST /auth/login
Body: { email, senha }
Headers: host, x-tenant-id?, x-tenant-slug?

1. AuthController extrai headers
2. AuthService.resolveTenantFromRequest():
   a. x-tenant-id   → TenantResolverService.resolveById()
   b. x-tenant-slug → TenantResolverService.resolveBySlug()
   c. host subdomain → extractSlugFromHostname() → resolveBySlug()
   d. FALHA → 401 "Não foi possível identificar o estabelecimento"
3. AuthService.validateUser(email, senha, tenantId)
   → Busca por email + tenant_id (NUNCA apenas email)
4. JWT gerado com tenantId OBRIGATÓRIO
5. RefreshToken salvo com tenantId

Resposta: { access_token, refresh_token, tenant_id, user }
```

---

## 4. Camadas de Proteção

### 4.1 Pipeline de Request

```
Request
  → JwtAuthGuard (extrai JWT, rejeita sem tenantId)
  → TenantInterceptor (resolve tenant, valida JWT.tenantId == URL.tenantId)
  → TenantGuard (compara JWT.tenantId com contexto, 403 se mismatch)
  → TenantRateLimitGuard (limites por plano do tenant)
  → FeatureGuard (verifica features do plano)
  → Controller
  → Service → BaseTenantRepository (WHERE tenant_id = ? automático)
  → PostgreSQL (tenant_id NOT NULL + FK)
```

### 4.2 Componentes

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `TenantContextService` | `tenant-context.service.ts` | Armazena tenant por request (Scope.REQUEST, imutável) |
| `TenantResolverService` | `tenant-resolver.service.ts` | Resolve slug/ID → tenant info, cache 5min |
| `TenantInterceptor` | `tenant.interceptor.ts` | Detecta tenant (4 fontes), valida JWT vs URL |
| `TenantGuard` | `guards/tenant.guard.ts` | Bloqueia cross-tenant (403), loga violações |
| `TenantRateLimitGuard` | `guards/tenant-rate-limit.guard.ts` | Rate limit por plano (FREE/BASIC/PRO/ENTERPRISE) |
| `FeatureGuard` | `guards/feature.guard.ts` | Feature flags por plano |
| `BaseTenantRepository` | `repositories/base-tenant.repository.ts` | Auto-filtra queries, auto-preenche tenant em saves |
| `BaseTenantGateway` | `gateways/base-tenant.gateway.ts` | WebSocket rooms por tenant |
| `TenantProvisioningService` | `services/tenant-provisioning.service.ts` | Criação de novos tenants |

### 4.3 Decorators

| Decorator | Efeito |
|-----------|--------|
| `@SkipTenantGuard()` | Pula validação de tenant (rotas públicas globais) |
| `@SkipRateLimit()` | Pula rate limit por tenant |
| `@RequireFeature(Feature.ANALYTICS)` | Exige feature do plano |
| `@Public()` | Pula JwtAuthGuard |

---

## 5. BaseTenantRepository

Repositório abstrato que **todas** as entidades operacionais devem herdar.

### Métodos SEGUROS (com filtro automático)

| Método | Comportamento |
|--------|--------------|
| `find(options)` | `WHERE tenant_id = ?` adicionado automaticamente |
| `findOne(options)` | `WHERE tenant_id = ?` adicionado automaticamente |
| `findById(id)` | `WHERE id = ? AND tenant_id = ?` |
| `count(options)` | Conta apenas do tenant atual |
| `save(entity)` | Preenche `tenant_id` automaticamente |
| `update(id, data)` | `WHERE id = ? AND tenant_id = ?` |
| `delete(id)` | `WHERE id = ? AND tenant_id = ?` |
| `createQueryBuilder(alias)` | Inicia com `WHERE alias.tenant_id = ?` |

### Métodos PERIGOSOS (sem filtro)

| Método | Quando usar |
|--------|------------|
| `findWithoutTenant()` | Rotas públicas, entidades globais (Cliente por CPF) |
| `createQueryBuilderUnsafe()` | Super Admin, relatórios cross-tenant, joins |
| `rawRepository` | Operações não suportadas pelo BaseTenantRepository |

### Fontes de TenantId no Repository

O `getTenantId()` do BaseTenantRepository tenta 4 fontes em ordem:

1. `TenantContextService.getTenantId()` (via interceptor)
2. `request.tenant.id` (setado pelo TenantInterceptor)
3. `request.user.tenantId` (do JWT)
4. `request.headers['x-tenant-id']` (apenas UUID válido)

Se nenhuma fonte funcionar → `ForbiddenException`.

---

## 6. WebSocket

### Isolamento por Rooms

```
1. Cliente conecta com JWT no handshake auth
2. BaseTenantGateway.extractTenantId() decodifica JWT
3. Cliente entra no room "tenant_{tenantId}"
4. Eventos são emitidos apenas para o room do tenant
5. Cliente sem tenant → desconectado
```

### Eventos Isolados

Todos os `emit()` usam `server.to(tenant_${tenantId}).emit()`:
- `novo_pedido` — novo pedido criado
- `status_atualizado` — status do pedido mudou
- `comanda_atualizada` — comanda modificada
- `item_quase_pronto` — item próximo de ficar pronto
- `turno_atualizado` — mudança de turno

---

## 7. Rate Limiting por Tenant

Cada tenant tem limites baseados no plano:

| Plano | Req/Min | Req/Hora | Burst/s |
|-------|---------|----------|---------|
| FREE | 20 | 500 | 5 |
| BASIC | 60 | 2.000 | 15 |
| PRO | 100 | 5.000 | 30 |
| ENTERPRISE | 500 | 20.000 | 100 |
| Default (sem plano) | 30 | 1.000 | 10 |

Chaves de rate limit: `ratelimit:{tenantId}:{tipo}:{janela_tempo}`

Sem tenant → fallback para rate limit por IP com limites `default`.

---

## 8. Cache

Chaves de cache incluem `tenantId` para isolamento:

```
{entidade}:{tenantId}:{params}
```

Exemplos:
- `comandas:abc-123:page=1&limit=10`
- `produtos:abc-123:all`

Sem tenant → sem cache (evita cross-tenant leak).

---

## 9. Entidades com tenant_id

### Entidades Operacionais (26)

Todas devem ter `tenant_id` NOT NULL + FK para `tenants`:

| Entidade | Coluna | Status Atual |
|----------|--------|-------------|
| Ambiente | `tenant_id` | nullable: true |
| Funcionario | `tenant_id` + `empresa_id` (legado) | nullable: true |
| Mesa | `tenant_id` | nullable: true |
| Produto | `tenant_id` | nullable: true |
| Comanda | `tenant_id` | nullable: true |
| ComandaAgregado | `tenant_id` | nullable: true |
| Pedido | `tenant_id` | nullable: true |
| ItemPedido | `tenant_id` | nullable: true |
| RetiradaItem | `tenant_id` | nullable: true |
| Cliente | `tenant_id` | nullable: true |
| Evento | `tenant_id` | nullable: true |
| PaginaEvento | `tenant_id` | nullable: true |
| PontoEntrega | `tenant_id` + `empresa_id` (legado) | nullable: true |
| AberturaCaixa | `tenant_id` | nullable: true |
| FechamentoCaixa | `tenant_id` | nullable: true |
| MovimentacaoCaixa | `tenant_id` | nullable: true |
| Sangria | `tenant_id` | nullable: true |
| Avaliacao | `tenant_id` | nullable: true |
| TurnoFuncionario | `tenant_id` | nullable: true |
| Medalha | `tenant_id` | nullable: true |
| MedalhaGarcom | `tenant_id` | nullable: true |
| AuditLog | `tenant_id` | nullable: true |
| Empresa | `tenant_id` | nullable: true |
| LayoutEstabelecimento | `tenant_id` | nullable: true |

### Entidades Globais (sem tenant_id)

| Entidade | Motivo |
|----------|--------|
| Tenant | É o próprio tenant |
| Plan | Planos são globais |
| PaymentConfig | Config por gateway (platform-level) |
| PaymentTransaction | Transações de plataforma |
| Subscription | Assinaturas de plataforma |
| RefreshToken | Vinculado a funcionário + tenant (campo separado) |

---

## 10. Provisionamento de Novo Tenant

O `TenantProvisioningService` cria um novo tenant em uma transação:

```
1. Cria registro em `tenants` (slug, nome, plano)
2. Cria registro em `empresas` (nomeFantasia, cnpj, FK tenant)
3. Cria ambientes padrão (Salão, Cozinha, Bar)
4. Cria mesas padrão (1-10 no Salão)
5. Cria funcionário admin (email, senha, cargo=ADMIN)
6. Configura DNS no Cloudflare (slug.pubsystem.com.br)
```

Tudo dentro de uma transação — se qualquer passo falhar, rollback completo.

---

## 11. Roles e Permissões por Tenant

| Role | Escopo | Descrição |
|------|--------|-----------|
| SUPER_ADMIN | Plataforma | Gerencia todos os tenants |
| ADMIN | Tenant | Administrador do bar |
| GERENTE | Tenant | Gerente do bar |
| CAIXA | Tenant | Operador de caixa |
| GARCOM | Tenant | Garçom |
| COZINHEIRO | Tenant | Cozinheiro |
| BARTENDER | Tenant | Bartender |

SUPER_ADMIN bypassa TenantGuard e FeatureGuard.

---

## 12. Vulnerabilidades Conhecidas e Status

**Última revisão de código:** 2026-04-02

| # | Vulnerabilidade | Severidade | Status | Verificado em |
|---|----------------|-----------|--------|--------------|
| V1 | `tenant_id` nullable em 26 entidades operacionais | Crítico | ⚠️ Migration pendente | `*.entity.ts` — `nullable: true` ainda presente. `DB_SYNC=false` em prod, risco mitigado pelo `BaseTenantRepository` que preenche `tenantId` automaticamente no `save()`. |
| V2 | Schedulers com queries cross-tenant | Crítico | ✅ Corrigido | `quase-pronto.scheduler.ts` e `medalha.scheduler.ts` iteram por tenant e filtram `tenantId: tenant.id` em cada query. |
| V3 | WebSocket aceita `tenantId` via query param sem verificar JWT | Crítico | ✅ Corrigido | `base-tenant.gateway.ts` só aceita `tenantId` de JWT verificado. Query param e header `x-tenant-id` são explicitamente rejeitados. Sem JWT válido → cliente desconectado. |
| V4 | `POST /auth/refresh` não valida tenant | Alto | ✅ Corrigido | `auth.controller.ts` resolve `tenantId` e passa para `refreshAccessToken()`. Cross-tenant lança `403 Forbidden`. Confirmado em teste de produção (2026-04-02). |
| V5 | `RefreshToken.tenantId` opcional | Alto | ✅ Aceitável (design) | `tenantId?: string` é intencional: SUPER_ADMIN tem `tenantId = null`. A validação de isolamento em `validateRefreshToken()` só é aplicada quando `tenantId` está presente nos dois lados. |
| V6 | `empresaId` legado em 2 entidades | Médio | ⚠️ Pendente remoção | Presente em `funcionario.entity.ts` e `ponto-entrega.entity.ts`. `super-admin.service.ts` usa como fallback em queries. Escopo restrito ao SUPER_ADMIN, sem risco de cross-tenant entre tenants normais. |
| V7 | `super-admin.service.ts` com fallback `empresaId` | Médio | ⚠️ Pendente limpeza | 4 queries em `super-admin.service.ts` usam `empresaId` como fallback para compatibilidade com dados legados. Acessível apenas por SUPER_ADMIN. |

### Notas

- **V2, V3, V4** foram corrigidas em sessões anteriores de desenvolvimento; o código em produção já contém as correções.
- **V5** foi reclassificada: não é vulnerabilidade, é requisito de design para suporte ao SUPER_ADMIN com `tenantId = null`.
- **V1, V6, V7** permanecem pendentes mas com risco controlado em produção.

Detalhes originais: `docs/audits/multi-tenant-audit.md`
