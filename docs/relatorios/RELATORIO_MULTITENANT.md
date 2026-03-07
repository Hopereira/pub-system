# Relatorio Multi-Tenant — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura de backend/src/common/tenant/*, auth/*, schedulers, entities, repositories
**Regra:** Baseado APENAS no que existe no codigo

---

## 1. Modelo Multi-Tenant

- **Tipo:** Banco compartilhado, schema compartilhado
- **Identificador:** Coluna `tenant_id` (UUID) em todas tabelas operacionais
- **Isolamento:** Camada de aplicacao via `BaseTenantRepository`
- **Enforcement de banco:** **NENHUM** (nullable, sem FKs)

---

## 2. Camadas de Protecao (Codigo Real)

### 2.1 Camadas IMPLEMENTADAS e ATIVAS

| Camada | Componente | Arquivo | Status |
|--------|-----------|---------|--------|
| HTTP Guard | `TenantGuard` (global) | common/tenant/guards/tenant.guard.ts | ATIVO |
| HTTP Interceptor | `TenantInterceptor` (global) | common/tenant/interceptors/tenant.interceptor.ts | ATIVO |
| Context | `TenantContextService` (REQUEST scope) | common/tenant/tenant-context.service.ts | ATIVO |
| Repository | `BaseTenantRepository` (REQUEST scope) | common/tenant/repositories/base-tenant.repository.ts | ATIVO |
| WebSocket | `BaseTenantGateway` | common/tenant/gateways/base-tenant.gateway.ts | ATIVO |
| Cache | Chaves com prefixo tenant | cache/ | ATIVO |
| Rate limit | `TenantRateLimitGuard` (por plano) | common/tenant/guards/tenant-rate-limit.guard.ts | ATIVO |
| Feature guard | `FeatureGuard` (por plano) | common/tenant/guards/feature.guard.ts | ATIVO |
| JWT | tenantId no payload | auth/auth.service.ts | ATIVO |

### 2.2 Camadas AUSENTES

| Camada | O que falta | Impacto |
|--------|-----------|---------|
| **Banco — NOT NULL** | tenant_id e nullable em 24 tabelas | INSERT sem tenant e permitido |
| **Banco — FKs** | Zero FKs tenant_id → tenants(id) | DELETE tenant nao limpa dados |
| **Banco — RLS** | Sem Row Level Security | Queries diretas ignoram app |
| **Indices compostos** | tenant_id + data/status | Queries de relatorio lentas |

---

## 3. Fluxo de Resolucao de Tenant

### 3.1 Ordem de Prioridade (TenantInterceptor)

```
1. Subdomain: casarao-pub.pubsystem.com.br → slug → tenant
2. Header: X-Tenant-Slug → slug → tenant
3. JWT: request.user.tenantId → tenant
4. Header: X-Tenant-ID → tenant (se UUID valido)
```

### 3.2 Frontend Middleware

```typescript
// frontend/src/middleware.ts
// Detecta subdominio e reescreve internamente:
// casarao-pub.pubsystem.com.br/ → /t/casarao-pub
```

Hosts excluidos: localhost, pubsystem.com.br, www, pub-system.vercel.app.

---

## 4. Vulnerabilidades CRITICAS

### 4.1 Schedulers Cross-Tenant

**QuaseProntoScheduler** (`modulos/pedido/quase-pronto.scheduler.ts`):

```typescript
@InjectRepository(ItemPedido)
private readonly itemPedidoRepository: Repository<ItemPedido>,
```

Usa `Repository<ItemPedido>` direto (TypeORM puro), NAO `BaseTenantRepository`. A query `this.itemPedidoRepository.find(...)` retorna itens de TODOS os tenants.

**MedalhaScheduler** (`modulos/medalha/medalha.scheduler.ts`):

```typescript
@InjectRepository(Funcionario)
private funcionarioRepository: Repository<Funcionario>,
```

Busca TODOS os garcons de TODOS os tenants. Depois chama `medalhaService.verificarNovasMedalhas()` que usa repositories tenant-aware — mas o `MedalhaService` recebe garcomId de qualquer tenant.

**Impacto:** Dados de um tenant sendo processados no contexto de outro. Em cenario multi-tenant real, um garcom do Pub A pode receber medalhas baseadas em dados do Pub B.

**Correcao proposta:**
```typescript
// Injetar TenantService para listar todos tenants ativos
// Para cada tenant, setar contexto e executar logica
const tenants = await tenantService.findAll({ where: { status: 'ATIVO' } });
for (const tenant of tenants) {
  const garcons = await funcionarioRepository.findByTenantId(tenant.id, { cargo: Cargo.GARCOM });
  // processar por tenant
}
```

### 4.2 RefreshToken Cross-Tenant Bypass

**Arquivo:** `auth/refresh-token.service.ts:74-101`

```typescript
async validateRefreshToken(token: string, tenantId?: string): Promise<RefreshToken> {
  // ...
  if (tenantId && refreshToken.tenantId && refreshToken.tenantId !== tenantId) {
    throw new ForbiddenException('...');
  }
}
```

O check so executa se AMBOS `tenantId` (do request) e `refreshToken.tenantId` sao truthy. Se o caller nao enviar `tenantId`, a validacao e PULADA completamente.

**Cenario de ataque:**
1. Funcionario do Tenant A faz login, recebe refresh token
2. Funcionario acessa Tenant B (subdominio diferente)
3. Se o endpoint de refresh nao enviar tenantId, o token e aceito
4. Funcionario recebe JWT com tenantId do Tenant A mas esta acessando Tenant B

**Correcao proposta:** Tornar `tenantId` obrigatorio na validacao:
```typescript
async validateRefreshToken(token: string, tenantId: string): Promise<RefreshToken> {
```

### 4.3 BaseTenantGateway — Fallback sem JWT

**Arquivo:** `common/tenant/gateways/base-tenant.gateway.ts`

O `joinTenantRoom()` tenta extrair tenantId de:
1. JWT no handshake auth
2. Query parameter `tenantId`
3. Header `x-tenant-id`

Se o JWT falhar, os fallbacks 2 e 3 permitem conexao WebSocket sem autenticacao real, apenas com um tenantId informado pelo cliente.

**Correcao proposta:** Rejeitar conexao se JWT nao tiver tenantId valido.

### 4.4 tenant_id Nullable no Banco

24 tabelas operacionais tem:
```typescript
@Column({ type: 'uuid', nullable: true })
tenant_id: string;
```

Qualquer INSERT sem tenant_id e aceito silenciosamente pelo banco.

**Correcao proposta:** Executar migration `MakeTenantIdNotNull`:
1. Verificar dados orfaos (tenant_id IS NULL)
2. Atribuir tenant correto ou deletar
3. ALTER TABLE ... ALTER COLUMN tenant_id SET NOT NULL
4. ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)

### 4.5 Zero Foreign Keys

Nenhuma das 24 tabelas tem FK `tenant_id → tenants(id)`.

**Impacto:**
- Deletar tenant nao cascateia
- Dados orfaos se acumulam
- Sem integridade referencial

---

## 5. Problemas Altos

### 5.1 Cliente.cpf UNIQUE Global

```typescript
// cliente.entity.ts
@Column({ unique: true, nullable: true })
cpf: string;
```

UNIQUE global impede que dois tenants diferentes tenham clientes com o mesmo CPF. Deveria ser UNIQUE composto `[cpf, tenant_id]`.

### 5.2 empresaId Legado

`Funcionario` e `PontoEntrega` ainda tem coluna `empresaId` que coexiste com `tenant_id`. Cria confusao e potencial inconsistencia.

### 5.3 TenantAwareEntity Nao Usada

```typescript
// common/tenant/entities/tenant-aware.entity.ts
export abstract class TenantAwareEntity {
  @Column({ type: 'uuid', nullable: false })
  @Index()
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

Classe base CORRETA existe mas NENHUMA entity a herda. Todas definem tenant_id manualmente com `nullable: true`.

### 5.4 Provisioning Incompleto

`POST /registro` cria Tenant → Empresa → Ambientes → Mesas → Funcionario ADMIN. Mas:
- Nao cria plano padrao se nenhum existir
- Nao valida se tenant.cnpj e unico
- Nao cria dados de exemplo (seeder e separado)

---

## 6. Planos e Features

### 6.1 Planos Reais

| Plano | Features |
|-------|----------|
| FREE | empresa, ambiente, mesa, funcionario, comanda, pedido, produto |
| BASIC | FREE + CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES |
| PRO | BASIC + ANALYTICS, TURNOS, MEDALHAS |
| ENTERPRISE | PRO + tudo |

### 6.2 Rate Limit por Plano

| Plano | req/min | req/hora | burst/seg |
|-------|---------|----------|-----------|
| FREE | 20 | 500 | 5 |
| BASIC | 60 | 2000 | 15 |
| PRO | 100 | 5000 | 30 |
| ENTERPRISE | 500 | 20000 | 100 |

### 6.3 FeatureGuard

Modulos protegidos com `@RequireFeature(Feature.X)`:
- CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES (BASIC+)
- ANALYTICS, TURNOS, MEDALHAS (PRO+)

---

## 7. Repositorios Tenant-Aware

### 7.1 Repositorios que HERDAM BaseTenantRepository (CORRETO)

| Repositorio | Entity | Arquivo |
|------------|--------|---------|
| AmbienteRepository | Ambiente | ambiente/ambiente.repository.ts |
| MesaRepository | Mesa | mesa/mesa.repository.ts |
| ProdutoRepository | Produto | produto/produto.repository.ts |
| ComandaRepository | Comanda | comanda/comanda.repository.ts |
| PedidoRepository | Pedido | pedido/pedido.repository.ts |
| ItemPedidoRepository | ItemPedido | pedido/item-pedido.repository.ts |
| ClienteRepository | Cliente | cliente/cliente.repository.ts |
| FuncionarioRepository | Funcionario | funcionario/funcionario.repository.ts |
| CaixaRepository | AberturaCaixa | caixa/caixa.repository.ts |
| EventoRepository | Evento | evento/evento.repository.ts |
| AvaliacaoRepository | Avaliacao | avaliacao/avaliacao.repository.ts |
| TurnoRepository | Turno | turno/turno.repository.ts |
| MedalhaRepository | Medalha | medalha/medalha.repository.ts |
| MedalhaGarcomRepository | MedalhaGarcom | medalha/medalha-garcom.repository.ts |
| PontoEntregaRepository | PontoEntrega | ponto-entrega/ponto-entrega.repository.ts |
| AuditLogRepository | AuditLog | audit/audit-log.repository.ts |
| EmpresaRepository | Empresa | empresa/empresa.repository.ts |

### 7.2 Repositorios que BYPASSAM tenant (PROBLEMA)

| Uso | Arquivo | Problema |
|-----|---------|---------|
| `@InjectRepository(ItemPedido)` | quase-pronto.scheduler.ts | Query global |
| `@InjectRepository(Funcionario)` | medalha.scheduler.ts | Query global |
| `@InjectRepository(RefreshToken)` | refresh-token.service.ts | Tabela global (OK) |
| `@InjectRepository(Tenant)` | tenant.service.ts | Tabela global (OK) |
| `@InjectRepository(Plan)` | plan.service.ts | Tabela global (OK) |

Os dois primeiros sao vulnerabilidades. Os tres ultimos sao corretos (tabelas globais).

---

## 8. Correcoes Propostas (Prioridade)

### Semana 1 — Criticos

| # | Correcao | Risco | Esforco |
|---|---------|-------|---------|
| 1 | Corrigir schedulers para iterar por tenant | Cross-tenant data | 2h |
| 2 | Tornar tenantId obrigatorio em validateRefreshToken | Token bypass | 30min |
| 3 | Rejeitar WebSocket sem JWT valido | Conexao nao autenticada | 1h |
| 4 | Executar migration tenant_id NOT NULL | Dados sem tenant | 4h (com verificacao) |
| 5 | Adicionar FKs tenant_id → tenants(id) | Dados orfaos | 2h |

### Semana 2 — Altos

| # | Correcao | Risco | Esforco |
|---|---------|-------|---------|
| 6 | Alterar Cliente.cpf para UNIQUE [cpf, tenant_id] | Conflito CPF | 1h |
| 7 | Herdar TenantAwareEntity em todas entities | Consistencia | 4h |
| 8 | Remover empresaId legado | Confusao | 2h |
| 9 | Adicionar indices compostos | Performance | 2h |
