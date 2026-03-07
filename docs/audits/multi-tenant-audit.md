# Auditoria Multi-Tenant — Pub System

**Data:** 2026-03-06
**Auditor:** Arquiteto de Software (NestJS, PostgreSQL, Docker, SaaS Multi-Tenant)
**Escopo:** Código completo de multi-tenancy — detecção, isolamento, segurança, queries, WebSocket
**Método:** Leitura linha-a-linha de todo código em `backend/src/common/tenant/`, `backend/src/auth/`, `backend/src/modulos/`, `backend/src/database/`

---

## 1. Arquitetura Multi-Tenant Atual

### 1.1 Modelo

Banco compartilhado, schema compartilhado (`public`). Isolamento lógico por coluna `tenant_id` (UUID) em todas as entidades operacionais.

### 1.2 Como o Tenant é Detectado

O `TenantInterceptor` (global, registrado via `APP_INTERCEPTOR` no `TenantModule`) resolve o tenant em **4 fontes**, nesta prioridade:

| Prioridade | Fonte | Mecanismo | Arquivo |
|-----------|-------|-----------|---------|
| 1 | **Subdomínio** | `bar-do-ze.pubsystem.com.br` → extrai `bar-do-ze` | `tenant-resolver.service.ts:211-238` |
| 2 | **Slug na URL** | `/menu/bar-do-ze` → extrai `bar-do-ze` | `tenant-resolver.service.ts:249-260` |
| 3 | **JWT** | `Authorization: Bearer <token>` → decodifica `tenantId` do payload | `tenant.interceptor.ts:147-161` |
| 4 | **Header** | `X-Tenant-ID: <uuid>` ou `X-Tenant-ID: <slug>` | `tenant.interceptor.ts:163-176` |

### 1.3 Fluxo de Login

```
1. POST /auth/login { email, senha }
   + Headers: host, x-tenant-id, x-tenant-slug
2. AuthController extrai host, x-tenant-id, x-tenant-slug dos headers
3. AuthService.resolveTenantFromRequest() resolve tenant:
   - x-tenant-id → resolveById()
   - x-tenant-slug → resolveBySlug()
   - host subdomain → extractSlugFromHostname() → resolveBySlug()
   - FALHA → 401 "Não foi possível identificar o estabelecimento"
4. AuthService.validateUser(email, senha, tenantId) busca por email + tenant_id
5. JWT gerado com tenantId OBRIGATÓRIO no payload
6. RefreshToken salvo com tenantId associado
```

**Arquivo:** `auth.controller.ts:37-61`, `auth.service.ts:33-58`, `auth.service.ts:100-151`

### 1.4 Fluxo de Requisição Autenticada

```
1. Request chega → JwtAuthGuard extrai JWT do header Authorization
2. JwtStrategy.validate() → REJEITA tokens sem tenantId (401)
3. TenantInterceptor resolve tenant (subdomain > slug > JWT > header)
   - Se JWT.tenantId ≠ URL.tenantId → 401 "Acesso negado"
   - Seta TenantContextService (imutável por request)
4. TenantGuard compara JWT.tenantId com contexto.tenantId
   - Mismatch → 403 CROSS_TENANT_ACCESS_DENIED
   - User sem tenantId → 403 USER_WITHOUT_TENANT
5. BaseTenantRepository auto-filtra todas queries: WHERE tenant_id = ?
```

### 1.5 Camadas de Proteção

| Camada | Componente | Proteção | Bypass |
|--------|-----------|----------|--------|
| **JWT** | `JwtStrategy.validate()` | Rejeita token sem `tenantId` | Rotas `@Public()` |
| **Interceptor** | `TenantInterceptor` | Resolve e valida tenant; detecta mismatch JWT vs URL | `hasTenant()` check |
| **Guard** | `TenantGuard` (global) | Bloqueia cross-tenant (403) | `@SkipTenantGuard()` |
| **Repository** | `BaseTenantRepository` | Auto-filtra queries por `tenant_id` | `findWithoutTenant()`, `rawRepository` |
| **Context** | `TenantContextService` | Imutável por request (`Scope.REQUEST`) | — |
| **WebSocket** | `BaseTenantGateway` | Rooms isolados `tenant_{id}`, desconecta sem tenant | — |
| **Cache** | Chaves com formato `{entidade}:{tenantId}:{params}` | Sem tenant = sem cache | — |
| **Rate Limit** | `TenantRateLimitGuard` | Limites por plano do tenant | `@SkipRateLimit()` |

---

## 2. Pontos Inseguros Encontrados

### 2.1 CRÍTICO — tenant_id NULLABLE em todas as entidades

**Arquivo:** Todas as entidades em `backend/src/modulos/*/entities/*.entity.ts`

```typescript
// Exemplo: ambiente.entity.ts:46
@Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
tenantId: string;
```

**Impacto:** O banco de dados NÃO IMPEDE inserção de registros sem `tenant_id`. O isolamento depende 100% da camada de aplicação (guards, interceptors, repositories). Se qualquer code path bypassar o `BaseTenantRepository`, dados ficam sem tenant.

**Status da migration `1709380000000-EnforceMultiTenantIsolation.ts`:** CRIADA mas **NÃO EXECUTADA em produção**. Esta migration deveria:
- Popular `tenant_id` em registros órfãos
- Alterar coluna para `NOT NULL`
- Adicionar FK para `tenants(id) ON DELETE CASCADE`

### 2.2 CRÍTICO — Schedulers sem filtro de tenant (vazamento cross-tenant)

#### QuaseProntoScheduler (`pedido/quase-pronto.scheduler.ts`)

```typescript
// Linha 32-33: @InjectRepository direto, sem BaseTenantRepository
@InjectRepository(ItemPedido)
private readonly itemPedidoRepository: Repository<ItemPedido>,

// Linha 44: Query SEM filtro de tenant_id
const itensEmPreparo = await this.itemPedidoRepository.find({
  where: {
    status: PedidoStatus.EM_PREPARO,
    quaseProntoEm: IsNull(),
    iniciadoEm: LessThan(new Date()),
  },
  // ❌ SEM tenantId no where!
});
```

**Impacto:** Busca itens de TODOS os tenants. Pode marcar itens do Tenant A como QUASE_PRONTO quando deveria ser apenas Tenant B.

Além disso, a query de cálculo de tempo médio (`calcularTempoMedioPreparo`, linha 128-143) também não filtra por tenant — calcula a média usando dados de TODOS os tenants.

O emit de WebSocket tenta usar o `tenantId` da entidade (linha 183), o que mitiga parcialmente o leak no WebSocket, mas a **query e o save são cross-tenant**.

#### MedalhaScheduler (`medalha/medalha.scheduler.ts`)

```typescript
// Linha 18-19: @InjectRepository direto
@InjectRepository(Funcionario)
private funcionarioRepository: Repository<Funcionario>,

// Linha 27-31: Query SEM filtro de tenant_id
const garcons = await this.funcionarioRepository.find({
  where: { cargo: Cargo.GARCOM },
  // ❌ SEM tenantId! Busca garçons de TODOS os tenants
});
```

**Impacto:** Verifica medalhas para garçons de todos os tenants. A `medalhaService.verificarNovasMedalhas()` pode computar dados cross-tenant para o ranking.

### 2.3 ALTO — RefreshToken.tenantId é opcional

**Arquivo:** `auth/refresh-token.service.ts:44`

```typescript
async generateRefreshToken(
  funcionario: Funcionario,
  ipAddress: string,
  userAgent?: string,
  tenantId?: string,  // ❌ OPCIONAL!
): Promise<RefreshToken>
```

**Arquivo:** `auth/refresh-token.service.ts:74`

```typescript
async validateRefreshToken(token: string, tenantId?: string): Promise<RefreshToken> {
  // ...
  // Linha 89: Validação condicional
  if (tenantId && refreshToken.tenantId && refreshToken.tenantId !== tenantId) {
    // ❌ Se QUALQUER UM for null, a validação é pulada!
```

**Impacto:** Se o refresh token for gerado sem `tenantId` (possível para tokens antigos ou bugs), a validação de tenant no refresh é ignorada. Um refresh token "sem tenant" pode ser usado para obter access tokens que funcionam em qualquer tenant.

### 2.4 ALTO — POST /auth/refresh não envia tenantId

**Arquivo:** `auth.controller.ts:71-76`

```typescript
async refresh(
  @Body('refresh_token') refreshToken: string,
  @Ip() ipAddress: string,
) {
  return this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress);
  // ❌ Não passa tenantId! Terceiro parâmetro fica undefined
}
```

**Impacto:** A validação de tenant no refresh é efetivamente desabilitada porque `tenantId` nunca é passado. O JWT renovado usa o `tenantId` salvo no refresh token, mas sem validação cruzada com o contexto da requisição.

### 2.5 ALTO — Refresh token JWT payload incompleto

**Arquivo:** `auth/refresh-token.service.ts:116-121`

```typescript
const payload = {
  sub: refreshToken.funcionario.id,
  email: refreshToken.funcionario.email,
  cargo: refreshToken.funcionario.cargo,
  tenantId: refreshToken.tenantId,
  // ❌ FALTA: nome, ambienteId (presentes no login original)
};
```

**Impacto:** O JWT renovado via refresh não contém `nome` e `ambienteId`. Se o frontend depende de `ambienteId` do token para roteamento do cozinheiro/bartender, o refresh pode quebrar a UX.

### 2.6 MÉDIO — TenantResolverService tem 3 fallbacks no resolveById

**Arquivo:** `tenant-resolver.service.ts:119-200`

```
1. Busca em tenants (tabela)       → OK
2. Busca empresa por tenant_id     → OK (fallback legado)
3. Busca empresa por id            → ⚠️ RISCO: trata empresaId como tenantId
```

O fallback 3 (linha 177-196) busca empresa pelo `id` da empresa (não pelo `tenant_id`), tratando `empresaId` como se fosse `tenantId`. Isso existe para compatibilidade legada mas cria ambiguidade entre empresa e tenant.

### 2.7 MÉDIO — BaseTenantGateway aceita tenantId de query param e header

**Arquivo:** `gateways/base-tenant.gateway.ts:36-48`

```typescript
// Fallback: tenta extrair do query param
const tenantId = client.handshake.query?.tenantId as string;
if (tenantId) return tenantId;

// Fallback: tenta extrair do header
const headerTenantId = client.handshake.headers?.['x-tenant-id'] as string;
if (headerTenantId) return headerTenantId;
```

**Impacto:** Um atacante pode conectar ao WebSocket enviando `?tenantId=<uuid-victim>` no query string, sem JWT válido, e entrar no room de outro tenant. O JWT decode usa `jwtService.decode()` (sem verificação de assinatura, linha 32) — se falhar, cai nos fallbacks inseguros.

### 2.8 MÉDIO — TenantGuard permite passagem quando não há tenant no contexto

**Arquivo:** `guards/tenant.guard.ts:77-80`

```typescript
// Se não há tenant no contexto (rota pública), deixar passar
if (!this.tenantContext?.hasTenant?.()) {
  return true;
}
```

**Impacto:** Se o `TenantInterceptor` falhar silenciosamente (catch no linha 98-116 engole o erro para rotas não `@PublicWithTenant`), o guard permite passagem. Combinado com `@Public()` no JwtAuthGuard, uma rota pode ser acessada sem qualquer validação de tenant.

### 2.9 BAIXO — empresaId legado ainda existe em entidades

**Arquivos:** `funcionario.entity.ts:57-58`, `ponto-entrega.entity.ts`

```typescript
@Column({ type: 'uuid', nullable: true, name: 'empresa_id' })
empresaId: string;
```

**Impacto:** Confusão conceitual. A coluna `empresa_id` coexiste com `tenant_id` em pelo menos 2 entidades. Pode causar bugs se alguém usar `empresaId` pensando que é o tenant.

---

## 3. Queries sem Filtro de Tenant

### 3.1 @InjectRepository direto (bypass total do BaseTenantRepository)

| Arquivo | Entidade | Justificado? |
|---------|----------|-------------|
| `payment.service.ts` (4x) | PaymentConfig, Subscription, PaymentTransaction, Tenant | ✅ Platform-level |
| `plan.service.ts` | Plan | ✅ Platform-level |
| `quase-pronto.scheduler.ts` | ItemPedido | ❌ **VAZAMENTO** — busca itens de todos os tenants |
| `medalha.scheduler.ts` | Funcionario | ❌ **VAZAMENTO** — busca garçons de todos os tenants |
| `seeder.service.ts` (5x) | Ambiente, Mesa, Produto, Cliente, Comanda | ⚠️ Aceitável (seed com DEFAULT_TENANT_ID) |
| `refresh-token.service.ts` | RefreshToken | ⚠️ Token management — usa funcionarioId como filtro |

### 3.2 Queries em Schedulers (sem request context)

Os schedulers rodam como cron jobs sem HTTP request, portanto sem `TenantContextService`. Eles usam `@InjectRepository` direto e **não filtram por tenant**.

| Scheduler | Query | Risco |
|-----------|-------|-------|
| `QuaseProntoScheduler.verificarItensQuaseProntos()` | `itemPedidoRepository.find()` sem tenant | **CRÍTICO** — processa itens de todos os tenants |
| `QuaseProntoScheduler.calcularTempoMedioPreparo()` | `createQueryBuilder` sem tenant | **ALTO** — média cross-tenant |
| `MedalhaScheduler.verificarMedalhasGarcons()` | `funcionarioRepository.find()` sem tenant | **ALTO** — processa garçons de todos os tenants |

### 3.3 transactionalEntityManager (bypass do BaseTenantRepository)

**Arquivo:** `comanda.service.ts:136-284`

O método `create()` da comanda usa `transactionalEntityManager` direto. **PORÉM**, o código já inclui `tenantId` em todos os `findOne()` e `create()`:

```typescript
// Linha 140-141 — ✅ OK: filtra por tenantId
mesa = await transactionalEntityManager.findOne(Mesa, {
  where: { id: mesaId, tenantId },
});
```

**Veredicto:** As transações na `comanda.service.ts` estão corretamente protegidas com `tenantId` manual em todas as queries. Não há vazamento.

### 3.4 WebSocket broadcasts

Zero `server.emit()` encontrados (todos migrados para `server.to(tenant_${tenantId}).emit()`). ✅ OK.

---

## 4. Falhas de Segurança

### 4.1 Cenário de Ataque: WebSocket sem JWT

```
1. Atacante conecta ao WebSocket com query param: ?tenantId=<uuid-vítima>
2. BaseTenantGateway.extractTenantId() falha no JWT decode
3. Fallback aceita tenantId do query param
4. Atacante entra no room tenant_<uuid-vítima>
5. Atacante recebe TODOS os eventos em tempo real do tenant vítima
   (novo_pedido, status_atualizado, comanda_atualizada, etc.)
```

**Correção necessária:** Remover fallbacks de query param e header no `BaseTenantGateway`. Exigir JWT válido e verificado (não apenas decoded).

### 4.2 Cenário de Ataque: Refresh Token Cross-Tenant

```
1. Usuário A obtém refresh token no Tenant A
2. refresh token é salvo COM tenantId
3. Mas POST /auth/refresh NÃO envia tenantId para validação
4. refreshAccessToken() recebe tenantId=undefined
5. validateRefreshToken() pula validação (ambos sides podem ser undefined)
6. Novo access token é gerado com tenantId do refresh token original
7. Se refresh token antigo sem tenantId existir → JWT gerado SEM tenantId
8. JwtStrategy.validate() rejeita (tenantId ausente) → ✅ Bloqueado
```

**Veredicto:** O cenário é parcialmente mitigado pelo `JwtStrategy` que exige `tenantId`. Mas a falta de validação no refresh é um gap que deveria ser corrigido.

### 4.3 Cenário de Ataque: Cron Job Data Leak

```
1. QuaseProntoScheduler roda a cada 15 segundos
2. Busca TODOS os itens EM_PREPARO de TODOS os tenants
3. Calcula tempo médio usando dados de TODOS os tenants
4. Marca itens como QUASE_PRONTO baseado em média cross-tenant
5. Emite evento WebSocket (isolado por tenant — impacto limitado)
```

**Impacto real:** O cálculo de ETA para "quase pronto" é contaminado por dados de outros tenants. Um restaurante rápido pode afetar o timer de um restaurante lento. O `save()` também roda sem filtro de tenant, mas como opera no item específico encontrado pela query, o risco de corrupção é baixo.

---

## 5. Inconsistências Documentação vs Código

| Item | Documentação | Código Real | Status |
|------|-------------|-------------|--------|
| tenant_id nullable | `docs/backend/multitenancy.md`: "NOT NULL com FK" | Entidades: `nullable: true` | ❌ **DIVERGENTE** |
| empresaId removido | `docs/RELATORIO_ISOLAMENTO_MULTITENANT.md`: "removido" | `funcionario.entity.ts`: ainda existe | ❌ **DIVERGENTE** |
| Schedulers isolados | `docs/RELATORIO_ISOLAMENTO_MULTITENANT.md`: "usa tenantId da entidade" | `quase-pronto.scheduler.ts`: query sem tenant | ⚠️ **PARCIAL** — emit isolado, query não |
| WebSocket seguro | `docs/backend/multitenancy.md`: "Conexões isoladas via BaseTenantGateway" | `base-tenant.gateway.ts`: aceita query param sem JWT | ❌ **DIVERGENTE** |
| Rate limit global | `docs/backend/rate-limit.md`: 30/s, 200/10s, 1000/min | `app.module.ts`: mesmos valores | ✅ **CORRETO** |
| Rate limit SEGURANCA.md | `docs/current/SEGURANCA.md`: 3/s, 20/10s, 100/min | `app.module.ts`: 30/s, 200/10s, 1000/min | ❌ **DIVERGENTE** (10x menor na doc) |
| Refresh token com tenant | `docs/current/SEGURANCA.md`: não mencionado | `refresh-token.service.ts`: tenantId opcional | ⚠️ **INCOMPLETO** |
| JWT payload | `docs/current/SEGURANCA.md`: inclui `empresaId` | `auth.service.ts:101-110`: NÃO inclui empresaId | ❌ **DIVERGENTE** |
| Login resolve tenant | `docs/backend/multitenancy.md`: "via subdomain ou X-Tenant-ID" | `auth.controller.ts`: + `x-tenant-slug` | ⚠️ **INCOMPLETO** (falta x-tenant-slug na doc) |
| TenantGuard bloqueia sem tenant | `docs/backend/multitenancy.md`: "Bloqueia users sem tenantId" | `tenant.guard.ts:78`: permite se contexto sem tenant | ⚠️ **PARCIAL** |
| BaseTenantRepository fallbacks | `docs/backend/multitenancy.md`: "sem fallback" | `base-tenant.repository.ts:61-105`: 4 fontes de fallback | ❌ **DIVERGENTE** |
| 18 testes isolamento | `docs/RELATORIO_ISOLAMENTO_MULTITENANT.md`: "18/18 passando" | `tenant-isolation.spec.ts`: existe | ✅ **CORRETO** |

---

## 6. Resumo de Riscos por Prioridade

### P0 — Críticos

| # | Risco | Arquivo | Correção |
|---|-------|---------|----------|
| 1 | **tenant_id nullable em produção** | Todas entidades | Executar migration `EnforceMultiTenantIsolation` |
| 2 | **QuaseProntoScheduler: queries cross-tenant** | `quase-pronto.scheduler.ts` | Agrupar por tenantId ou adicionar filtro |
| 3 | **WebSocket aceita tenantId via query param** | `base-tenant.gateway.ts:36-48` | Remover fallbacks, exigir JWT verificado |

### P1 — Altos

| # | Risco | Arquivo | Correção |
|---|-------|---------|----------|
| 4 | **MedalhaScheduler: queries cross-tenant** | `medalha.scheduler.ts` | Agrupar por tenantId |
| 5 | **POST /auth/refresh não valida tenant** | `auth.controller.ts:71-76` | Passar tenantId do contexto |
| 6 | **RefreshToken.tenantId opcional** | `refresh-token.service.ts:44` | Tornar obrigatório |
| 7 | **Refresh JWT payload incompleto** | `refresh-token.service.ts:116` | Incluir nome, ambienteId |

### P2 — Médios

| # | Risco | Arquivo | Correção |
|---|-------|---------|----------|
| 8 | **resolveById com 3 fallbacks** | `tenant-resolver.service.ts:119-200` | Eliminar fallback 3 (empresaId) |
| 9 | **TenantGuard permite sem contexto** | `tenant.guard.ts:78` | Auditar rotas que dependem disso |
| 10 | **empresaId legado em 2 entidades** | `funcionario.entity.ts`, `ponto-entrega.entity.ts` | Remover após migration |

---

## 7. Arquitetura Multi-Tenant Corrigida (Proposta)

### 7.1 Banco de Dados

```sql
-- 1. Executar migration para enforcement
ALTER TABLE ambientes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ambientes ADD CONSTRAINT fk_ambientes_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- (repetir para TODAS as 26 entidades operacionais)

-- 2. Remover coluna legada
ALTER TABLE funcionarios DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE pontos_entrega DROP COLUMN IF EXISTS empresa_id;

-- 3. Adicionar RLS (Row Level Security) como camada extra
ALTER TABLE ambientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_ambientes ON ambientes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
-- (opcional, adiciona proteção a nível de banco)
```

### 7.2 Schedulers

```typescript
// ANTES (cross-tenant):
const itens = await this.itemPedidoRepository.find({ where: { status: EM_PREPARO } });

// DEPOIS (isolado por tenant):
const tenantIds = await this.dataSource
  .createQueryBuilder()
  .select('DISTINCT tenant_id')
  .from('item_pedido', 'ip')
  .where('ip.status = :status', { status: 'EM_PREPARO' })
  .getRawMany();

for (const { tenant_id } of tenantIds) {
  const itens = await this.itemPedidoRepository.find({
    where: { status: EM_PREPARO, tenantId: tenant_id },
  });
  // processar por tenant
}
```

### 7.3 WebSocket

```typescript
// ANTES (aceita query param):
protected extractTenantId(client: Socket): string | null {
  const token = client.handshake.auth?.token;
  if (token) { /* decode */ }
  const tenantId = client.handshake.query?.tenantId; // ❌ INSEGURO
  return tenantId;
}

// DEPOIS (apenas JWT verificado):
protected extractTenantId(client: Socket): string | null {
  const token = client.handshake.auth?.token || 
                client.handshake.headers?.authorization?.replace('Bearer ', '');
  if (!token || !this.jwtService) return null;
  
  try {
    const payload = this.jwtService.verify(token); // ✅ VERIFICA assinatura
    return payload?.tenantId || null;
  } catch {
    return null; // Token inválido = sem tenant
  }
}
```

### 7.4 Refresh Token

```typescript
// auth.controller.ts — refresh deve passar tenant context
async refresh(
  @Body('refresh_token') refreshToken: string,
  @Ip() ipAddress: string,
  @Headers('host') host?: string,
  @Headers('x-tenant-id') headerTenantId?: string,
  @Headers('x-tenant-slug') headerTenantSlug?: string,
) {
  // Resolver tenant do contexto (mesmo fluxo do login)
  let tenantId: string | undefined;
  try {
    tenantId = await this.authService.resolveTenantFromRequest(host, headerTenantId, headerTenantSlug);
  } catch { /* permite refresh sem tenant para backward compat */ }
  
  return this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress, tenantId);
}
```

### 7.5 Eliminação de Fallbacks no TenantResolver

```typescript
// Manter apenas:
// 1. Busca em tabela tenants (fonte primária)
// 2. Busca empresa por tenant_id (relação real)
// REMOVER: Busca empresa por id (ambiguidade empresaId ↔ tenantId)
```

### 7.6 Diagrama da Arquitetura Corrigida

```
                    ┌──────────────────────────────────┐
                    │          REQUEST                  │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     JwtAuthGuard                  │
                    │  - Extrai JWT do header           │
                    │  - JwtStrategy.validate()         │
                    │  - REJEITA sem tenantId (401)     │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     TenantInterceptor             │
                    │  1. Subdomain                     │
                    │  2. URL slug                      │
                    │  3. JWT payload                   │
                    │  4. X-Tenant-ID header            │
                    │  - Valida JWT.tenantId == URL     │
                    │  - Seta TenantContextService      │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     TenantGuard                   │
                    │  - Compara JWT vs Contexto        │
                    │  - 403 se mismatch                │
                    │  - 403 se user sem tenantId       │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     FeatureGuard (opcional)       │
                    │  - Verifica plano do tenant       │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     Controller / Service          │
                    │     BaseTenantRepository          │
                    │  - WHERE tenant_id = ? (auto)     │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │     PostgreSQL                    │
                    │  - tenant_id NOT NULL + FK        │
                    │  - RLS (opcional, camada extra)   │
                    └──────────────────────────────────┘
```

---

## 8. Plano de Correções

### Semana 1 — Urgente

- [ ] Corrigir `BaseTenantGateway`: remover fallbacks query param e header, usar `jwtService.verify()` em vez de `decode()`
- [ ] Corrigir `QuaseProntoScheduler`: adicionar filtro `tenantId` em todas as queries
- [ ] Corrigir `MedalhaScheduler`: adicionar filtro `tenantId` em todas as queries
- [ ] Corrigir `POST /auth/refresh`: passar `tenantId` do contexto para validação

### Semana 2 — Fortalecimento

- [ ] Executar migration `EnforceMultiTenantIsolation` (com backup pré-deploy)
- [ ] Tornar `RefreshToken.tenantId` obrigatório
- [ ] Completar payload do JWT no refresh (nome, ambienteId)
- [ ] Remover fallback 3 do `TenantResolverService.resolveById()`

### Semana 3 — Limpeza

- [ ] Remover `empresaId` de `funcionario.entity.ts` e `ponto-entrega.entity.ts`
- [ ] Atualizar `docs/current/SEGURANCA.md` (rate limit values, JWT payload)
- [ ] Atualizar `docs/backend/multitenancy.md` (x-tenant-slug, BaseTenantRepository fallbacks)
- [ ] Avaliar implementação de RLS no PostgreSQL
