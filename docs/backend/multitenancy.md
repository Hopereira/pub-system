# Multi-tenancy — Isolamento Enterprise-Grade

## Modelo

O sistema usa multi-tenancy logico com isolamento forte por coluna `tenant_id` (UUID, NOT NULL, FK) em todas as tabelas operacionais. Todos os dados residem no mesmo banco e schema `public`, com constraints de banco garantindo integridade.

**Coluna padrao:** `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`

## Componentes

| Componente | Localizacao | Funcao |
|------------|-------------|--------|
| TenantModule (@Global) | `common/tenant/` | Registra todos os componentes de tenant |
| TenantInterceptor | `common/tenant/` | Resolve tenant por subdomain, slug, JWT ou header |
| TenantGuard | `common/tenant/guards/` | Bloqueia acesso cross-tenant (403). Bloqueia users sem tenantId |
| TenantResolverService | `common/tenant/` | Resolve slug/ID para entidade Tenant, valida status ativo |
| TenantContextService | `common/tenant/` | Armazena tenantId imutavel por request (Scope.REQUEST) |
| BaseTenantRepository | `common/tenant/repositories/` | Filtra automaticamente todas as queries por tenant_id |
| TenantRateLimitGuard | `common/tenant/guards/` | Rate-limit isolado por plano do tenant |

## Fluxo de Autenticacao

1. Requisicao de login chega com `Host` header (subdomain) ou `X-Tenant-ID`
2. `AuthService.resolveTenantFromRequest()` resolve o tenant **ANTES** da autenticacao
3. Usuario e buscado por `email + tenant_id` (nunca so por email)
4. JWT e gerado com `tenantId` **obrigatorio** (sem fallbacks)
5. `JwtStrategy.validate()` rejeita tokens sem `tenantId` (401)

## Fluxo de Requisicao Autenticada

1. `TenantInterceptor` resolve tenant por: subdomain > slug > JWT > header
2. `TenantGuard` compara `JWT.tenantId` com `contexto.tenantId`
   - Mismatch → 403 Forbidden + log de seguranca
   - User sem tenantId → 403 Forbidden
3. `BaseTenantRepository` filtra automaticamente: `WHERE tenant_id = :tenantId`

## Isolamento por Camada

| Camada | Mecanismo |
|--------|-----------|
| **Banco** | `tenant_id NOT NULL` + FK + indices compostos |
| **Queries** | `BaseTenantRepository` auto-filtra por tenant_id |
| **Auth** | Login por email + tenant_id, JWT com tenantId obrigatorio |
| **Guards** | `TenantGuard` bloqueia cross-tenant e users sem tenant |
| **Cache** | Chaves formato `{entidade}:{tenantId}:{params}`, sem fallback global |
| **Rate-limit** | Chaves formato `tenant:{tenantId}:user:{userId}` |
| **WebSocket** | Conexoes isoladas por tenant via `BaseTenantGateway` |

## Repositorios Tenant-Aware

Todos os services operacionais usam repositorios que estendem `BaseTenantRepository`:

| Repositorio | Entidade |
|-------------|----------|
| FuncionarioRepository | Funcionario |
| AmbienteRepository | Ambiente |
| MesaRepository | Mesa |
| ProdutoRepository | Produto |
| ComandaRepository | Comanda |
| ComandaAgregadoRepository | ComandaAgregado |
| PedidoRepository | Pedido |
| ItemPedidoRepository | ItemPedido |
| RetiradaItemRepository | RetiradaItem |
| ClienteRepository | Cliente |
| EventoRepository | Evento |
| PaginaEventoRepository | PaginaEvento |
| MedalhaRepository | Medalha |
| MedalhaGarcomRepository | MedalhaGarcom |
| AvaliacaoRepository | Avaliacao |
| AuditLogRepository | AuditLog |
| EmpresaRepository | Empresa |
| PontoEntregaRepository | PontoEntrega |
| TurnoRepository | Turno |

**Excecoes (platform-level):** `PaymentConfig`, `Subscription`, `PaymentTransaction`, `Tenant` — entidades de plataforma, nao pertencem a nenhum tenant.

## Provisionamento

Novos tenants sao criados via `TenantProvisioningService`. O seeder requer `DEFAULT_TENANT_ID` no `.env` para criar o admin inicial.

## Cargos por Tenant

| Cargo | Area de Acesso |
|-------|----------------|
| SUPER_ADMIN | Plataforma (sem tenant) |
| ADMIN | Total (`/dashboard`) |
| GERENTE | Total (`/dashboard`) |
| GARCOM | Restrita (`/garcom`) |
| CAIXA | Restrita (`/caixa`) |
| COZINHA | Restrita (`/cozinha`) |

## Testes de Isolamento

18 testes automatizados em `common/tenant/tests/tenant-isolation.spec.ts`:

- TenantContextService: imutabilidade, isolamento por request
- TenantGuard: bloqueio cross-tenant, bloqueio sem tenantId, rejeicao de empresaId fallback
- JWT: validacao de tenantId obrigatorio
- Cache: isolamento de chaves por tenant, ausencia de namespace global
- Rate-limit: isolamento por tenant, sem isencao de admin
- Cenarios de invasao: JWT forjado, token sem tenant
