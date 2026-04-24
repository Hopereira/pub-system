# AUDITORIA COMPLETA — Pub System

**Data:** 2026-04-20  
**Auditor:** Arquiteto de Software Sênior  
**Escopo:** Repositório completo (backend, frontend, infra, DB, segurança, testes, performance)

---

## SUMÁRIO EXECUTIVO

O Pub System é um **SaaS multi-tenant** para gestão de bares e restaurantes, construído com **NestJS + Next.js + PostgreSQL + Socket.IO**. O sistema apresenta uma arquitetura **acima da média para o estágio** em que se encontra, com isolamento de tenant sofisticado, autenticação robusta, e infraestrutura bem pensada para custo zero.

### Scorecard Geral

| Área | Nota | Observação |
|------|------|------------|
| **Arquitetura** | 8/10 | Modular, boa separação, multi-tenant bem desenhado |
| **Segurança** | 7.5/10 | JWT + httpOnly cookies, guards, mas com pontos a melhorar |
| **Multi-tenancy** | 9/10 | Isolamento em 4 camadas (guard, interceptor, repo, WebSocket) |
| **Frontend** | 7/10 | Boa stack, mas token no sessionStorage, build errors ignorados |
| **Banco de Dados** | 7.5/10 | Bons indexes, FKs, mas sem RLS e nullable tenant_id em entities |
| **Infraestrutura** | 7/10 | Docker otimizado, CI/CD com rollback, mas VM single-point-of-failure |
| **WebSocket** | 8.5/10 | Excelente isolamento por rooms de tenant |
| **Testes** | 6/10 | Boa cobertura E2E de auth, mas unit tests parecem scaffolding |
| **Performance** | 6.5/10 | Cache presente, mas eager loading excessivo em entities |
| **Documentação** | 8/10 | Acima da média, com relatórios de sessão e workflows |

---

## 1. ARQUITETURA

### 1.1 Pontos Fortes

- **Modularidade exemplar:** Backend organizado em `src/modulos/` com módulos independentes (pedido, comanda, ambiente, funcionario, etc.) + `src/common/tenant/` para concerns cross-cutting.
- **Multi-tenant em 4 camadas:**
  1. `TenantInterceptor` — resolve tenant por subdomain/slug/JWT/header
  2. `TenantGuard` — bloqueia acesso cross-tenant com audit log
  3. `BaseTenantRepository` — filtra automaticamente todas as queries
  4. `BaseTenantGateway` — isola eventos WebSocket por rooms
- **Branded Types:** `TenantId` como branded type (`string & { __brand: 'TenantId' }`) previne mistura acidental de IDs.
- **Repository Pattern:** `BaseTenantRepository<T>` abstrai o filtro de tenant em todas operações CRUD.
- **Feature Gating:** 3 camadas (backend `@RequireFeature`, service `requireLimitForTenant`, frontend `<FeatureGate>`).

### 1.2 Problemas Identificados

#### **CRÍTICO: `TenantAwareEntity.tenantId` é `nullable: true`**
```
// backend/src/common/tenant/entities/tenant-aware.entity.ts:21
@Column({ type: 'uuid', name: 'tenant_id', nullable: true })
tenantId: string;
```
A migration `MultiTenantFKsAndConstraints` adiciona `NOT NULL` no banco, mas a entity TypeORM diz `nullable: true`. Isso cria uma **discrepância** — TypeORM `synchronize: true` pode reverter o NOT NULL em dev. O TypeScript também aceita `undefined` para esse campo, enfraquecendo a tipagem.

**Recomendação:** Alterar para `nullable: false` na entity e garantir `synchronize: false` em produção (já está correto no `app.module.ts`).

#### **MÉDIO: Fallback em cascata no `TenantResolverService.resolveById()`**
```
// backend/src/common/tenant/tenant-resolver.service.ts:122-211
```
São **3 fallbacks** (tabela tenants → empresa por tenantId → empresa por id). Isso indica uma dualidade histórica entre `Tenant` e `Empresa` que não foi totalmente resolvida. A entidade `Empresa extends TenantAwareEntity`, o que significa que uma empresa tem `tenantId` apontando para a tabela `tenants`, mas o resolver tenta achar tenant pelo `empresa.id` como último recurso.

**Recomendação:** Consolidar a relação Tenant↔Empresa em uma migration definitiva e remover fallbacks legados.

#### **MÉDIO: `FeatureGuard` faz 3 queries ao banco por request**
```
// backend/src/common/tenant/guards/feature.guard.ts:100-133
```
Busca tenant 3 vezes sequencialmente em fallback. Sem cache. Cada request protegida por `@RequireFeature` executa até 3 `SELECT` no banco.

**Recomendação:** Adicionar cache Redis com TTL de 5min para o plano do tenant (o `TenantRateLimitGuard` já faz isso corretamente).

#### **BAIXO: Seeder hardcoded para desenvolvimento**
```
// backend/src/database/seeder.service.ts:37-501
```
O seeder cria 42 produtos e 22 mesas sem respeitar limites de plano. Útil para dev, mas perigoso se executado acidentalmente em produção.

**Recomendação:** Adicionar guard `NODE_ENV !== 'production'` explícito.

---

## 2. SEGURANÇA

### 2.1 Pontos Fortes

- **Refresh token rotation:** `RefreshTokenService` implementa rotação de tokens, revogação por sessão, e cleanup de tokens expirados via cron.
- **httpOnly cookies:** Refresh token armazenado em cookie httpOnly com `path: '/auth'`, `sameSite: 'Lax'`.
- **Helmet + CSP:** `main.ts` configura Helmet com Content-Security-Policy, HSTS, X-Frame-Options.
- **ValidationPipe global:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — rejeita campos não declarados nos DTOs.
- **Rate limiting em 2 níveis:**
  1. `ThrottlerModule` global (NestJS built-in)
  2. `TenantRateLimitGuard` por plano (Redis-backed, com burst/minute/hour)
- **Cross-tenant detection:** `TenantGuard` loga tentativas de acesso cross-tenant com IP, user-agent e detalhes completos.
- **Env validation:** `Joi.object()` em `app.module.ts` valida variáveis obrigatórias com `min(32)` para `JWT_SECRET`.
- **CORS restritivo:** Apenas origens específicas permitidas, com regex para subdomínios.

### 2.2 Vulnerabilidades

#### **CRÍTICO: JWT access_token no `sessionStorage`**
```
// frontend/src/context/AuthContext.tsx:27,91
const storedToken = sessionStorage.getItem('authToken');
sessionStorage.setItem('authToken', access_token);
```
`sessionStorage` é acessível via XSS. Qualquer vulnerabilidade de Cross-Site Scripting permite roubo do token. O próprio código reconhece o problema:
```
// TODO: Migrar para memória (useRef no AuthContext)
```

**Impacto:** Account takeover via XSS.  
**Recomendação:** Migrar access_token para `useRef` + closure. Ou implementar BFF pattern com cookie httpOnly para ambos os tokens.

#### **ALTO: Middleware frontend não valida JWT**
```
// frontend/src/middleware.ts:9-14
const authSession = request.cookies.get('authSession');
// Nota: só verifica presença do cookie, não valida JWT
```
O cookie `authSession` é um cookie simples (`authSession=1`), **não o JWT**. Qualquer pessoa que setar `authSession=1` manualmente no browser bypassa o middleware.

**Impacto:** Acesso a rotas `/dashboard/*` sem autenticação real (a API ainda protege, mas o frontend exibe a UI).  
**Recomendação:** Usar o JWT no cookie httpOnly e validar com `jose` (edge-compatible) no middleware.

#### **ALTO: `ignoreBuildErrors: true` no Next.js**
```
// frontend/next.config.ts:8-10
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```
Erros de tipo e linting são silenciosamente ignorados no build. Isso pode causar **bugs em produção** que seriam pegos pelo compilador.

**Impacto:** Bugs escapam para produção.  
**Recomendação:** Remover essas flags e corrigir os erros de tipo/lint existentes.

#### **MÉDIO: Decoding JWT sem verificação no interceptor**
```
// backend/src/common/tenant/tenant.interceptor.ts:191-203
const decoded = this.jwtService?.decode?.(token);  // decode, não verify!
```
O interceptor decodifica o JWT sem verificar a assinatura. Isso é usado para extrair `tenantId` antes que o `JwtAuthGuard` rode. Um atacante pode forjar um JWT com `tenantId` arbitrário e o interceptor vai confiar nele.

**Mitigação:** O `JwtAuthGuard` verifica depois, e o `TenantGuard` compara JWT tenant com context tenant. Mas há uma janela onde o `TenantContextService` é populado com dados potencialmente falsos.

**Recomendação:** Usar `jwtService.verify()` ao invés de `decode()`, ou não usar JWT não-verificado para popular o contexto.

#### **MÉDIO: Health endpoints sem autenticação**
```
// backend/src/health/health.controller.ts
@Get('metrics')
metrics() {
  // Retorna memória, CPU, versão do Node...
```
Os endpoints `/health/metrics` expõem informações internas do servidor (memória, CPU, versão Node, uptime) sem nenhuma autenticação.

**Recomendação:** Proteger `/health/metrics` com `@UseGuards(JwtAuthGuard)` ou básico auth. Manter `/health` e `/health/live` públicos para load balancers.

#### **BAIXO: `X-Tenant-ID` header confiado como fallback**
```
// backend/src/common/tenant/repositories/base-tenant.repository.ts:85-93
const headerTenantId = this.request?.headers?.['x-tenant-id'];
```
O header `X-Tenant-ID` é usado como fallback quando JWT e TenantContext falham. Um atacante pode enviar um header com UUID de outro tenant.

**Mitigação:** Validação de UUID + o `TenantGuard` compara com o JWT. Mas a sequência de fallbacks aumenta a superfície de ataque.

---

## 3. MULTI-TENANCY

### 3.1 Pontos Fortes

O isolamento multi-tenant é **o ponto mais forte** da arquitetura:

- **TenantAwareEntity:** Base class com `tenant_id` + FK para `tenants(id)` com CASCADE.
- **BaseTenantRepository:** Filtro automático em ALL queries (`find`, `findOne`, `count`, `createQueryBuilder`, `save`, `update`, `delete`).
- **Imutabilidade do contexto:** `TenantContextService` é REQUEST-scoped e `isLocked` previne alteração após definição.
- **WebSocket rooms:** `BaseTenantGateway` isola eventos por `tenant_{id}` rooms com JWT verified.
- **Migration de FK/NOT NULL:** 26 tabelas operacionais têm `tenant_id NOT NULL` + FK + index.
- **Composite unique indexes:** CPF per tenant, email per tenant, mesa per ambiente per tenant.
- **Métodos "unsafe" documentados:** `findWithoutTenant()`, `createQueryBuilderUnsafe()`, `rawRepository` — todos com `⚠️ ATENÇÃO` docs.

### 3.2 Lacunas

#### **CRÍTICO: Sem Row Level Security (RLS) no PostgreSQL**
O isolamento é **100% na camada da aplicação**. Se qualquer serviço usar `rawRepository` ou `createQueryBuilderUnsafe()` sem filtrar por tenant, dados vazam. PostgreSQL RLS adicionaria uma camada de defesa no banco.

**Recomendação:** Implementar RLS como defense-in-depth:
```sql
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON produtos
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

#### **MÉDIO: SUPER_ADMIN bypassa TODOS os filtros**
```
// base-tenant.repository.ts:96-98
if (this.request?.user?.cargo === 'SUPER_ADMIN') {
  return null as unknown as TenantId;  // Sem filtro!
}
```
Um SUPER_ADMIN vê dados de TODOS os tenants em todas as queries. Não há audit log específico para ações de SUPER_ADMIN.

**Recomendação:** Logar todas as ações de SUPER_ADMIN em uma tabela de auditoria separada.

---

## 4. FRONTEND

### 4.1 Pontos Fortes

- **Next.js 16 App Router** com React 19.
- **FeatureGate component** para gating de UI por plano.
- **Plan features cache** com dedup de requests in-flight (`_planFeaturesInflight`).
- **Socket reconnection** com token refresh automático.
- **Tenant switch detection** no login — força `window.location.reload()` para limpar estado React.
- **API interceptors** com retry exponencial, rate-limit awareness, e refresh token rotation transparent.
- **publicApi** separado para rotas de cliente (sem JWT).

### 4.2 Problemas

#### **ALTO: API service expõe `NEXT_PUBLIC_API_URL` hardcoded**
```
// frontend/src/services/api.ts:13
return process.env.NEXT_PUBLIC_API_URL || 'https://api.pubsystem.com.br';
```
Se a env var não estiver definida, **todas as requests** vão para produção. Isso pode causar requests acidentais de dev para prod.

**Recomendação:** Em dev, fazer fallback para `http://localhost:3000` ao invés de produção.

#### **MÉDIO: `SocketProvider` não limpa listeners corretamente**
```
// frontend/src/context/SocketContext.tsx:206-228
const subscribe = useCallback((event, callback) => {
  listenersRef.current.get(event)?.add(callback);
  socketRef.current.on(event, callback);
}, []);
```
Os listeners são adicionados ao socket e ao mapa, mas se o componente desmontar sem chamar `unsubscribe`, o callback fica no mapa e é re-registrado no reconnect. Memory leak potencial.

**Recomendação:** Retornar cleanup function do `subscribe` ou usar `useEffect` cleanup patterns.

#### **BAIXO: Feature enum duplicada entre backend e frontend**
```
// backend: src/common/tenant/services/plan-features.service.ts
// frontend: src/hooks/usePlanFeatures.tsx
```
Dois enums `Feature` mantidos manualmente em sincronia. Já causou bug (Vercel build cache com enum desatualizado).

**Recomendação:** Gerar tipos compartilhados automaticamente ou usar string literals consistentes.

---

## 5. BANCO DE DADOS

### 5.1 Pontos Fortes

- **PostgreSQL 17** com connection pooling (`extra: { max: 20, min: 5 }`).
- **26 tabelas** com `tenant_id NOT NULL` + FK CASCADE + index.
- **Composite indexes** para queries comuns: `(status, tenant_id)`, `(email, tenant_id)`.
- **UUID primary keys** em todas as tabelas.
- **Decimal.js** usado para cálculos financeiros (precisão).
- **5 migrations** bem estruturadas com `up()` e `down()` reversíveis.
- **Check constraints:** `chk_quantidade_positiva` em `itens_pedido`.

### 5.2 Problemas

#### **ALTO: `eager: true` excessivo**
```
// comanda.entity.ts:42-46
@ManyToOne(() => Mesa, { eager: true })
mesa: Mesa;

@ManyToOne(() => Cliente, { eager: true })
cliente: Cliente;

@ManyToOne(() => PontoEntrega, { eager: true })
pontoEntrega: PontoEntrega;

@ManyToOne(() => PaginaEvento, { eager: true })
paginaEvento: PaginaEvento;
```
`Comanda` carrega **4 relações eager** em TODA query. E `ItemPedido` tem `Produto` eager, que por sua vez pode ter `Ambiente` eager. Isso gera **N+1 queries** e JOINs desnecessários em listagens.

**Impacto:** Degradação significativa de performance em listagens com muitas comandas.  
**Recomendação:** Remover `eager: true` e usar `relations: [...]` explícito nos repositórios que precisam dos dados.

#### **MÉDIO: `Pedido.total` como `decimal` sem trigger/computed**
```
// pedido.entity.ts:31
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
total: number;
```
O total é armazenado como coluna normal, sem trigger para recalcular quando itens são adicionados/removidos. Pode ficar inconsistente.

**Recomendação:** Usar computed column ou recalcular via trigger/service layer com `Decimal.js` (que já está importado).

#### **BAIXO: Inconsistência de naming** 
- `comandaId` (camelCase na coluna) vs `ponto_entrega_id` (snake_case)
- `criadoPorId` (camelCase) vs `ambiente_retirada_id` (snake_case)

**Recomendação:** Padronizar para snake_case em todas as colunas de banco com `@Column({ name: 'xxx' })`.

---

## 6. INFRAESTRUTURA

### 6.1 Pontos Fortes

- **Docker multi-stage** com imagens otimizadas (~150-200MB).
- **Non-root user** nos Dockerfiles (`node` user).
- **Health checks** em todos os containers Docker.
- **Memory limits** configurados (`NODE_OPTIONS=--max-old-space-size`).
- **Nginx** com SSL, gzip, security headers, proxy para WebSocket.
- **Cloudflare** como CDN/proxy com SSL flexível.
- **CI/CD GitHub Actions** com 4 jobs: backend, frontend, security, deploy.
- **Rollback automático** no deploy (health check + restore de backup).
- **Custo ~R$3.33/mês** usando Oracle Always Free + Vercel + Neon + Cloudflare free.

### 6.2 Problemas

#### **ALTO: Oracle VM é single-point-of-failure**
O backend roda em **uma única VM** Oracle E2.1.Micro com 1GB RAM. Sem replicação, sem load balancer, sem auto-scaling.

**Impacto:** Qualquer falha na VM = downtime total do backend.  
**Recomendação (curto prazo):** Implementar Docker restart policies (`restart: always`).  
**Recomendação (médio prazo):** Adicionar segunda VM com load balancer, ou migrar para container service (Fly.io, Railway).

#### **MÉDIO: SSL "Flexível" no Cloudflare**
```
SSL/TLS: Flexível (conecta HTTP ao servidor, serve HTTPS aos usuários)
```
O tráfego entre Cloudflare e a Oracle VM é **HTTP não-criptografado**. Se alguém interceptar o tráfego na rede da Oracle, verá dados em texto plano.

**Recomendação:** Mudar para SSL "Full (Strict)" com certificado Let's Encrypt na VM (já configurado no Nginx).

#### **MÉDIO: Redis sem senha**
```
// docker-compose.yml — Redis sem `requirepass`
// docker-compose.micro.yml — Redis não incluído
```
Na configuração `docker-compose.yml`, Redis roda sem autenticação. Em `docker-compose.micro.yml`, Redis não é incluído (rate limiting e cache ficam sem backend).

**Recomendação:** Configurar `requirepass` no Redis e adicionar Redis ao `docker-compose.micro.yml`.

#### **BAIXO: Frontend não está no docker-compose.micro.yml**
O deploy de produção usa Vercel para frontend, mas o `docker-compose.micro.yml` não inclui frontend. Correto para o setup atual, mas limita a portabilidade.

---

## 7. WEBSOCKET / REAL-TIME

### 7.1 Pontos Fortes

- **`BaseTenantGateway`** — classe base abstrata com isolamento por rooms.
- **JWT verification** no handshake (não apenas decode — usa `jwtService.verify()`).
- **Room hierarchy:**
  - `tenant_{id}` para eventos do tenant
  - `comanda_{tenantId}_{comandaId}` para clientes autenticados
  - `comanda_{comandaId}` para clientes públicos (QR code)
- **Eventos granulares:** `novo_pedido_ambiente:{ambienteId}` para notificações por ambiente.
- **Graceful handling:** Clientes sem JWT são permitidos como "público" sem room de tenant.
- **Reconnection:** Client-side com token refresh antes de cada reconnect attempt.

### 7.2 Problemas

#### **MÉDIO: Comanda room sem validação de acesso**
```
// pedidos.gateway.ts:64-74
@SubscribeMessage('join_comanda')
handleJoinComanda(client: Socket, comandaId: string) {
  // Qualquer cliente pode entrar em qualquer room de comanda
  const roomName = clientTenantId
    ? `comanda_${clientTenantId}_${comandaId}`
    : `comanda_${comandaId}`;
  client.join(roomName);
```
Não há validação de que o `comandaId` existe ou pertence ao tenant do cliente. Um atacante pode enumerar UUIDs e ouvir comandas de outros tenants.

**Mitigação:** Clientes autenticados usam `comanda_{tenantId}_{comandaId}`, que é isolado por tenant. Mas clientes públicos podem ouvir qualquer `comanda_{comandaId}`.

**Recomendação:** Validar que a comanda existe antes de permitir `join_comanda`.

#### **BAIXO: WebSocket CORS duplicado**
O CORS do WebSocket é definido **hardcoded** no gateway e separado do CORS do HTTP (`main.ts`). Podem divergir.

**Recomendação:** Centralizar configuração de CORS em um único lugar.

---

## 8. TESTES

### 8.1 Inventário

| Tipo | Quantidade | Cobertura |
|------|-----------|-----------|
| **Unit tests (*.spec.ts)** | 25 arquivos | Módulos core + tenant |
| **E2E backend** | 5 arquivos | Auth, caixa, pedido, financeiro, permissões gerente |
| **E2E frontend (Playwright)** | 2 arquivos | Auth, pedidos |
| **Tenant-specific tests** | 7 arquivos | Context, resolver, guard, repository, gateway, isolation |

### 8.2 Pontos Fortes

- **Auth E2E** testa fluxo completo: login → cookie refresh → logout → sessions.
- **Tenant isolation spec** valida que eventos de Tenant A não chegam ao Tenant B.
- **Guard tests** validam cross-tenant access denial.
- **CI/CD** roda testes com PostgreSQL e Redis reais (não mocks).

### 8.3 Problemas

#### **ALTO: Cobertura insuficiente de multi-tenancy em serviços**
Os unit tests em `src/modulos/*/` parecem ser **scaffolding** gerado pelo NestJS CLI (padrão `describe('XService', () => { it('should be defined') })`). Não há testes que validem que um serviço não retorna dados de outro tenant.

**Recomendação:** Adicionar testes de isolamento em cada serviço:
```typescript
it('não deve retornar produtos de outro tenant', async () => {
  // Setup: criar produto no tenant A
  // Act: buscar produtos como tenant B
  // Assert: retorno vazio
});
```

#### **MÉDIO: Frontend testes E2E limitados**
Apenas 2 specs Playwright (auth + pedidos). Não testa:
- Feature gating
- Tenant switch
- WebSocket real-time updates
- Portal do cliente (QR code flow)

**Recomendação:** Adicionar specs para fluxos críticos de negócio.

#### **BAIXO: Sem testes de carga**
Nenhum teste de performance/carga encontrado. Importante para validar limites da VM Oracle (1GB RAM).

**Recomendação:** Adicionar k6 ou Artillery para testes de carga básicos.

---

## 9. PERFORMANCE E ESCALABILIDADE

### 9.1 Pontos Fortes

- **Cache invalidation service** com patterns por tenant.
- **Plan features cache** no frontend com dedup de in-flight requests.
- **In-memory tenant cache** no `TenantResolverService` (5min TTL).
- **Axios retry** com exponential backoff e awareness de rate limiting.
- **Connection pooling** no TypeORM (`max: 20, min: 5`).

### 9.2 Problemas

#### **ALTO: Eager loading em cascata**
Conforme detalhado em §5.2, `Comanda` → `Mesa + Cliente + PontoEntrega + PaginaEvento`, e `ItemPedido` → `Produto` eager. Uma listagem de 50 comandas pode gerar **200+ JOINs**.

#### **MÉDIO: `PedidoService` é REQUEST-scoped**
```
// pedido.service.ts:39
@Injectable({ scope: Scope.REQUEST })
```
Todos os repositórios e o `PedidoService` são REQUEST-scoped. Isso significa que **uma nova instância** é criada para CADA request HTTP. Em alta carga, isso gera overhead significativo de GC.

**Mitigação:** Necessário para multi-tenancy via `TenantContextService`.  
**Recomendação (longo prazo):** Explorar AsyncLocalStorage do Node.js para evitar scope REQUEST.

#### **MÉDIO: Cache do `TenantResolverService` é in-memory**
```
// tenant-resolver.service.ts:37
private readonly cache = new Map<string, ...>();
```
Em um cenário multi-instância, cada pod terá seu próprio cache. Invalidação não é compartilhada.

**Recomendação:** Migrar para Redis quando houver múltiplas instâncias.

#### **BAIXO: Sem paginação padrão em todas as listagens**
Embora `PaginationDto` exista, nem todos os endpoints de listagem o usam. Listagens sem `LIMIT` em tabelas grandes podem travar a aplicação.

---

## 10. QUALIDADE DE CÓDIGO

### 10.1 Pontos Fortes

- **TypeScript strict** em ambos os projetos.
- **Documentação inline** extensiva (JSDoc com examples em classes core).
- **Naming conventions** geralmente consistentes (PT-BR nos DTOs, EN nos patterns).
- **Error handling** com custom exceptions e mensagens descritivas.
- **Workflows documentados** (`.windsurf/workflows/`) com checklists de pre-deploy.

### 10.2 Anti-patterns

- **`any` usage:** `(pedido as any).tenantId` aparece em vários locais no gateway.
- **Nullable mismatch:** Entity diz `nullable: true` mas migration diz `NOT NULL`.
- **Console.log em produção:** `SocketContext.tsx` usa `console.log` diretamente.
- **TODO comments:** 4+ TODOs de migrar token para memória, não resolvidos.

---

## 11. ROADMAP DE MELHORIAS (Priorizado)

### Sprint 1 — Segurança Crítica (1-2 semanas)

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Migrar access_token de sessionStorage para useRef/closure | 2d | **CRÍTICO** |
| 2 | Validar JWT no middleware frontend (usar jose) | 1d | **ALTO** |
| 3 | Remover `ignoreBuildErrors` e corrigir erros de tipo | 2-3d | **ALTO** |
| 4 | Proteger /health/metrics com autenticação | 0.5d | **MÉDIO** |
| 5 | Usar `jwtService.verify()` no TenantInterceptor | 0.5d | **MÉDIO** |

### Sprint 2 — Performance e DB (1-2 semanas)

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 6 | Remover `eager: true` de Comanda e ItemPedido | 1-2d | **ALTO** |
| 7 | Alterar `TenantAwareEntity.tenantId` para `nullable: false` | 0.5d | **MÉDIO** |
| 8 | Adicionar cache Redis no FeatureGuard | 1d | **MÉDIO** |
| 9 | Consolidar relação Tenant↔Empresa | 2d | **MÉDIO** |
| 10 | Implementar PostgreSQL RLS como defense-in-depth | 2-3d | **MÉDIO** |

### Sprint 3 — Testes e Observabilidade (1-2 semanas)

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 11 | Testes de isolamento multi-tenant em cada serviço | 3-5d | **ALTO** |
| 12 | Expandir E2E Playwright (feature gating, QR flow) | 2-3d | **MÉDIO** |
| 13 | Audit log para ações de SUPER_ADMIN | 1d | **MÉDIO** |
| 14 | Validar comandaId no `join_comanda` WebSocket | 0.5d | **MÉDIO** |
| 15 | Testes de carga com k6/Artillery | 1-2d | **BAIXO** |

### Sprint 4 — Infraestrutura (2-4 semanas)

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 16 | Cloudflare SSL Full (Strict) | 0.5d | **MÉDIO** |
| 17 | Redis com autenticação | 0.5d | **MÉDIO** |
| 18 | Explorar AsyncLocalStorage para remover scope REQUEST | 3-5d | **MÉDIO** |
| 19 | Segunda VM ou migração para Fly.io | 2-5d | **BAIXO** |
| 20 | Centralizar CORS config | 0.5d | **BAIXO** |

---

## 12. CONCLUSÃO

O Pub System demonstra **maturidade arquitetural acima da média** para um projeto nesse estágio. O isolamento multi-tenant em 4 camadas é particularmente impressionante. Os principais riscos estão concentrados em:

1. **Segurança do frontend** (token storage, middleware bypass, build errors ignorados)
2. **Performance** (eager loading, REQUEST-scoped services)
3. **Cobertura de testes** (scaffolding sem assertions reais)

A infraestrutura de custo zero é engenhosa, mas a single-point-of-failure da Oracle VM é um risco para produção real.

**Prioridade imediata:** Itens 1-5 do roadmap (segurança) devem ser resolvidos antes de onboarding de clientes reais.

---

*Relatório gerado com base na análise completa de ~150 arquivos do repositório.*
