# Auditoria Multi-Tenant — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura linha-a-linha de todo backend/src/common/tenant/*, auth/*, schedulers, entities, repositories, services
**Regra:** Baseado APENAS no que existe no codigo. Nada inventado.

---

## Indice de Problemas

| Severidade | Qtd | Descricao |
|-----------|-----|-----------|
| **CRITICO** | 9 | Vazamento cross-tenant, bypass de isolamento |
| **ALTO** | 10 | Fallbacks sem tenant, FKs ausentes, JWT incompleto |
| **MEDIO** | 7 | Legado, docs divergentes, indices faltantes |
| **Total** | **26** | — |

---

## 1. Tenant Resolver

**Arquivo:** `common/tenant/tenant-resolver.service.ts` (310 linhas)

### 1.1 Funcionalidade

Resolve identificadores de tenant para UUIDs. Duas fontes:

| Metodo | Entrada | Busca |
|--------|---------|-------|
| `resolveBySlug(slug)` | String slug | Tabela `empresas` por slug |
| `resolveById(id)` | UUID | 1) tabela `tenants`, 2) `empresas.tenantId`, 3) `empresas.id` |

### 1.2 Cache

Cache in-memory (Map) com TTL 5 minutos. Chaves: `slug:{slug}`, `id:{uuid}`.

### 1.3 Problemas Encontrados

| ID | Sev | Problema | Linha |
|----|-----|---------|-------|
| TR01 | ALTO | `resolveBySlug` busca na tabela `empresas` (nao `tenants`) — se empresa nao tem slug, falha | :66 |
| TR02 | MEDIO | Fallback remove sufixo numerico (`casarao-pub-423` → `casarao-pub`) — pode resolver tenant errado | :72-80 |
| TR03 | MEDIO | `resolveById` tem 3 fallbacks (tenants → empresas.tenantId → empresas.id) — complexidade desnecessaria | :119-196 |
| TR04 | ALTO | Cache in-memory — nao compartilhado entre instancias (se escalar horizontalmente, cache diverge) | :37 |

---

## 2. Tenant Interceptor

**Arquivo:** `common/tenant/tenant.interceptor.ts` (201 linhas)

### 2.1 Fluxo de Resolucao (prioridade)

```
1. Subdominio: casarao-pub.pubsystem.com.br → resolveBySlug("casarao-pub")
2. Slug na URL: /menu/bar-do-ze → resolveBySlug("bar-do-ze")
3. JWT: user.tenantId → resolveById(tenantId)
4. Header X-Tenant-ID: UUID → resolveById() | slug → resolveBySlug()
```

### 2.2 Validacao Cross-Tenant

```typescript
// tenant.interceptor.ts:77-85
const userTenantId = user?.tenantId;
if (userTenantId && tenant.id !== userTenantId) {
  throw new UnauthorizedException('Acesso negado...');
}
```

Compara JWT tenant com URL tenant. Se divergirem, bloqueia. **CORRETO.**

### 2.3 Problemas Encontrados

| ID | Sev | Problema | Linha |
|----|-----|---------|-------|
| TI01 | ALTO | Se nenhuma fonte encontrar tenant, interceptor continua silenciosamente (nao bloqueia) | :178 |
| TI02 | MEDIO | `decodeJwtFromHeader` usa `jwtService.decode()` (NAO `verify()`) — aceita tokens expirados/invalidos para resolucao | :193 |
| TI03 | ALTO | Header `X-Tenant-ID` aceita slug — frontend envia slug como X-Tenant-ID no publicApi | :166-175 |

---

## 3. Tenant Guard

**Arquivo:** `common/tenant/guards/tenant.guard.ts` (159 linhas)

### 3.1 Fluxo

```
1. @SkipTenantGuard? → pular
2. user existe? → se nao, pular (JwtAuthGuard cuida)
3. tenantContext.hasTenant()? → se nao, pular (rota publica)
4. user.tenantId existe? → se nao, 403 USER_WITHOUT_TENANT
5. user.tenantId === contextTenantId? → se nao, 403 CROSS_TENANT_ACCESS_DENIED
```

### 3.2 Logging de Violacao

Registra tentativa com IP, user-agent, URL. **MAS** tem TODO para integrar com AuditService (nao implementado).

### 3.3 Problemas Encontrados

| ID | Sev | Problema | Linha |
|----|-----|---------|-------|
| TG01 | MEDIO | `logSecurityViolation` tem TODO — nao persiste no banco | :152-153 |
| TG02 | CRITICO | Se `tenantContext` nao tem tenant (passo 3), permite acesso de user autenticado sem validar tenant | :78-79 |

**Cenario TG02:** User autenticado acessa rota protegida, mas TenantInterceptor nao conseguiu resolver tenant (erro de rede, cache miss, etc). Guard pula validacao e permite acesso SEM verificar se o user pertence ao tenant correto. A query vai para BaseTenantRepository que usa JWT tenantId — **mitiga parcialmente**, mas o guard deveria bloquear.

---

## 4. Tenant Context

**Arquivo:** `common/tenant/tenant-context.service.ts` (119 linhas)

### 4.1 Caracteristicas

- **Scope:** REQUEST (nova instancia por requisicao)
- **Imutavel:** Uma vez definido, tenantId nao pode ser alterado
- **Thread-safe:** Cada request tem sua propria instancia

### 4.2 Avaliacao

**BEM IMPLEMENTADO.** Sem problemas encontrados. Lock impede alteracao apos definicao.

---

## 5. Base Tenant Repository

**Arquivo:** `common/tenant/repositories/base-tenant.repository.ts` (512 linhas)

### 5.1 Metodos com Filtro Automatico

| Metodo | Filtro | Status |
|--------|--------|--------|
| `find()` | WHERE tenantId = :tid | OK |
| `findOne()` | WHERE tenantId = :tid | OK |
| `findById()` | WHERE id = :id AND tenantId = :tid | OK |
| `findOneOrFail()` | WHERE tenantId = :tid | OK |
| `count()` | WHERE tenantId = :tid | OK |
| `findAndCount()` | WHERE tenantId = :tid | OK |
| `findByIds()` | WHERE id IN (...) AND tenantId = :tid | OK |
| `createQueryBuilder()` | WHERE alias.tenantId = :tid | OK |
| `save()` | SET tenantId = :tid | OK |
| `saveMany()` | SET tenantId = :tid em cada | OK |
| `create()` | SET tenantId = :tid | OK |
| `update()` | WHERE id = :id AND tenantId = :tid | OK |
| `delete()` | WHERE id = :id AND tenantId = :tid | OK |
| `softDelete()` | WHERE id = :id AND tenantId = :tid | OK |
| `remove()` | Verifica entity.tenantId === current | OK |
| `removeMany()` | Verifica cada entity.tenantId | OK |

### 5.2 Metodos PERIGOSOS (bypass)

| Metodo | Filtro | Uso |
|--------|--------|-----|
| `findWithoutTenant()` | **NENHUM** | Rotas publicas |
| `findAndCountWithoutTenant()` | **NENHUM** | Rotas publicas |
| `createQueryBuilderUnsafe()` | **NENHUM** | Super admin, joins |
| `rawRepository` (getter) | **NENHUM** | Acesso direto TypeORM |

### 5.3 Resolucao de tenantId (getTenantId)

Ordem de prioridade:
1. `TenantContextService.getTenantId()` (interceptor setou)
2. `request.tenant.id` (TenantInterceptor)
3. `request.user.tenantId` (JWT)
4. `request.headers['x-tenant-id']` (se UUID valido)
5. Se nenhum → `ForbiddenException`

### 5.4 Problemas Encontrados

| ID | Sev | Problema | Linha |
|----|-----|---------|-------|
| BR01 | ALTO | `rawRepository` e propriedade publica — qualquer service pode usar para bypass | :454 |
| BR02 | MEDIO | `findWithoutTenant()` nao loga qual service chamou — dificil auditar uso | :251 |

---

## 6. Repositories — Auditoria Completa

### 6.1 Repositories que HERDAM BaseTenantRepository (20 — CORRETO)

| Repository | Entity | Scope REQUEST | Arquivo |
|-----------|--------|--------------|---------|
| AmbienteRepository | Ambiente | Sim | ambiente/ |
| MesaRepository | Mesa | Sim | mesa/ |
| ProdutoRepository | Produto | Sim | produto/ |
| ComandaRepository | Comanda | Sim | comanda/ |
| ComandaAgregadoRepository | ComandaAgregado | Sim | comanda/ |
| PedidoRepository | Pedido | Sim | pedido/ |
| ItemPedidoRepository | ItemPedido | Sim | pedido/ |
| RetiradaItemRepository | RetiradaItem | Sim | pedido/ |
| ClienteRepository | Cliente | Sim | cliente/ |
| FuncionarioRepository | Funcionario | Sim | funcionario/ |
| CaixaRepository | AberturaCaixa | Sim | caixa/ |
| SangriaRepository | Sangria | Sim | caixa/ |
| MovimentacaoCaixaRepository | MovimentacaoCaixa | Sim | caixa/ |
| FechamentoCaixaRepository | FechamentoCaixa | Sim | caixa/ |
| EventoRepository | Evento | Sim | evento/ |
| PaginaEventoRepository | PaginaEvento | Sim | pagina-evento/ |
| AvaliacaoRepository | Avaliacao | Sim | avaliacao/ |
| TurnoRepository | TurnoFuncionario | Sim | turno/ |
| MedalhaRepository | Medalha | Sim | medalha/ |
| MedalhaGarcomRepository | MedalhaGarcom | Sim | medalha/ |
| PontoEntregaRepository | PontoEntrega | Sim | ponto-entrega/ |
| AuditLogRepository | AuditLog | Sim | audit/ |
| EmpresaRepository | Empresa | Sim | empresa/ |

### 6.2 @InjectRepository DIRETO (bypass — sem filtro tenant)

| Uso | Arquivo | Justificativa | Problema? |
|-----|---------|--------------|-----------|
| `@InjectRepository(ItemPedido)` | quase-pronto.scheduler.ts | Cron job sem request context | **CRITICO** |
| `@InjectRepository(Funcionario)` | medalha.scheduler.ts | Cron job sem request context | **CRITICO** |
| `@InjectRepository(Plan)` | plan.service.ts | Tabela global | OK |
| `@InjectRepository(Tenant)` | tenant-resolver, tenant-rate-limit, feature.guard, super-admin, payment | Tabela global | OK |
| `@InjectRepository(Empresa)` | tenant-resolver | Resolver global | OK |
| `@InjectRepository(PaymentConfig)` | payment.service.ts | Tabela global | OK |
| `@InjectRepository(Subscription)` | payment.service.ts | Tem tenant_id mas usa direto | **ALTO** |
| `@InjectRepository(PaymentTransaction)` | payment.service.ts | Tem tenant_id mas usa direto | **ALTO** |
| `@InjectRepository(RefreshToken)` | refresh-token.service.ts | Tabela global | OK |

---

## 7. Services — Uso de rawRepository (BYPASS)

### 7.1 pedido.service.ts — **12+ rawRepository calls** (CRITICO)

| Linha | Uso | Motivo declarado |
|-------|-----|-----------------|
| ~93-97 | `comandaRepository.rawRepository.findOne()` | "Rotas publicas sem tenant" |
| ~132 | `produtoRepository.rawRepository.findByIds()` | "Rotas publicas" |
| ~161 | `itemPedidoRepository.rawRepository.create()` | "Evitar erro de tenant" |
| ~183-188 | `pedidoRepository.rawRepository.create/save()` | "Rotas publicas" |
| ~212 | `pedidoRepository.rawRepository.findOne()` | `findOnePublic()` |
| ~481 | `pedidoRepository.rawRepository.findOne()` | "Fallback se nao achou com tenant" |
| ~495 | `pedidoRepository.rawRepository.save()` | "Corrigir tenantId" |
| ~523-537 | `itemPedidoRepository.rawRepository.findOne/save()` | "Fallback + correcao" |
| ~725,817 | `itemPedidoRepository.rawRepository.findOne()` | "Fallback" |
| ~945-965 | `pedidoRepository.rawRepository.findOne/save()` | "Fallback + correcao" |
| ~1012 | `itemPedidoRepository.rawRepository.findOne()` | "Fallback" |

**Padrao identificado:** O service tenta buscar com tenant filter. Se nao acha, busca SEM filtro (rawRepository). Se acha sem tenant, "corrige" o tenantId setando o do contexto atual.

**Problemas deste padrao:**
1. Se o registro pertence a OUTRO tenant e por algum motivo o filtro falhou, o rawRepository retorna dados de outro tenant
2. A "correcao" de tenantId pode atribuir registro de Tenant A ao Tenant B
3. Em rotas publicas, cria pedidos sem tenant_id (nullable aceita)
4. Fallback mascara o bug real (registros sem tenant_id)

### 7.2 turno.service.ts — rawRepository no check-in

```typescript
// turno.service.ts:39
const funcionarioRaw = await this.funcionarioRepository.rawRepository.findOne({
  where: { id: funcionarioId },
});
```

Busca funcionario SEM filtro de tenant para "debugar". Depois, se nao achar com filtro e o raw tem tenantId null, "corrige" atribuindo o tenant atual.

**Problema:** Mesma logica do pedido.service — mascara registros orfaos em vez de corrigir no banco.

### 7.3 ponto-entrega.service.ts — rawRepository em rota publica

```typescript
// ponto-entrega.service.ts:95
return this.pontoEntregaRepository.rawRepository.find({
  where: whereClause,
  relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
});
```

Busca pontos de entrega SEM filtro de tenant quando nao ha tenantId no contexto. Pode retornar pontos de TODOS os tenants.

---

## 8. Schedulers — Cross-Tenant

### 8.1 QuaseProntoScheduler

**Arquivo:** `pedido/quase-pronto.scheduler.ts`
**Frequencia:** A cada 15 segundos

```typescript
@InjectRepository(ItemPedido)
private readonly itemPedidoRepository: Repository<ItemPedido>,

// Busca itens EM_PREPARO — de TODOS os tenants
const itensEmPreparo = await this.itemPedidoRepository.find({
  where: {
    status: PedidoStatus.EM_PREPARO,
    quaseProntoEm: IsNull(),
    iniciadoEm: LessThan(new Date()),
  },
  relations: ['produto', 'pedido', 'pedido.comanda'],
  take: 50,
});
```

**Problema CRITICO:** Busca itens de TODOS os tenants. Depois, calcula tempo medio de preparo e marca como QUASE_PRONTO. O `emitToTenant` no gateway envia para o room correto, mas:
- O calculo de `tempoMedioPreparo` mistura dados de todos os tenants
- Se dois tenants tem o mesmo produto ID (impossivel com UUID, mas se fosse), haveria colisao

### 8.2 MedalhaScheduler

**Arquivo:** `medalha/medalha.scheduler.ts`
**Frequencia:** A cada 5 minutos

```typescript
@InjectRepository(Funcionario)
private funcionarioRepository: Repository<Funcionario>,

const garcons = await this.funcionarioRepository.find({
  where: { cargo: Cargo.GARCOM },
});
```

**Problema CRITICO:** Busca garcons de TODOS os tenants. Depois chama `medalhaService.verificarNovasMedalhas(garcomId)` que usa `MedalhaRepository` (tenant-aware) e `ItemPedidoRepository` (tenant-aware).

**Subtlety:** O `MedalhaService` recebe `garcomId` e busca dados via repositories tenant-aware. MAS os repositories estao em scope REQUEST e os schedulers rodam FORA de request context. Isso significa que `getTenantId()` vai falhar com `ForbiddenException` — ou os `@Optional()` fazem o tenantContext retornar null e o fallback aceita tudo.

**Na pratica:** Como `TenantContextService` e `@Optional()` nos repositories, se nao ha request, `getTenantId()` tenta `request?.user?.tenantId` que e undefined → lanca ForbiddenException. O scheduler captura o erro e loga warning. Resultado: **medalhas nunca sao processadas corretamente**.

---

## 9. WebSocket — BaseTenantGateway

**Arquivo:** `common/tenant/gateways/base-tenant.gateway.ts` (126 linhas)

### 9.1 Fluxo de Conexao

```typescript
extractTenantId(client: Socket): string | null {
  // 1. JWT no handshake auth
  const token = client.handshake.auth?.token || 
                client.handshake.headers?.authorization?.replace('Bearer ', '');
  if (token && this.jwtService) {
    const payload = this.jwtService.decode(token);  // decode, NAO verify!
    return payload?.tenantId || null;
  }
  // 2. Query param tenantId
  const tenantId = client.handshake.query?.tenantId;
  // 3. Header x-tenant-id
  const headerTenantId = client.handshake.headers?.['x-tenant-id'];
}
```

### 9.2 Isolamento por Room

```typescript
joinTenantRoom(client: Socket): string | null {
  const tenantId = this.extractTenantId(client);
  if (tenantId) {
    client.join(`tenant_${tenantId}`);   // OK — room isolado
    client.data.tenantId = tenantId;
  } else {
    client.disconnect(true);              // OK — desconecta sem tenant
  }
}
```

### 9.3 Emit isolado

Todos os gateways usam `emitToTenant(tenantId, event, data)` que emite para `server.to('tenant_${tenantId}')`. **CORRETO.**

### 9.4 Problemas Encontrados

| ID | Sev | Problema | Linha |
|----|-----|---------|-------|
| WS01 | CRITICO | `jwtService.decode()` NAO valida assinatura — token fabricado e aceito | :32 |
| WS02 | CRITICO | Fallback query param `tenantId` — atacante envia qualquer UUID | :37-39 |
| WS03 | CRITICO | Fallback header `x-tenant-id` — atacante envia qualquer UUID | :43-45 |
| WS04 | ALTO | Se JWT nao tem tenantId mas query param tem, atacante escolhe tenant | :37 |

**Cenario de ataque WS01-WS03:**
1. Atacante cria token JWT fake com `tenantId: "uuid-do-concorrente"`
2. Ou simplesmente envia `?tenantId=uuid-do-concorrente` na conexao
3. `decode()` nao valida assinatura → aceita
4. Cliente e adicionado ao room `tenant_uuid-do-concorrente`
5. Atacante recebe TODOS os eventos (novo_pedido, status_atualizado, comanda_atualizada) do concorrente

---

## 10. Cache

**Arquivo:** `cache/cache-invalidation.service.ts` (211 linhas)

### 10.1 Formato das Chaves

```
{entidade}:{tenantId}:{parametros}
Ex: produtos:550e8400-e29b-41d4-a716-446655440000:page:1:limit:20
```

### 10.2 Invalidacao por Tenant

Todas as funcoes de invalidacao usam `getTenantId()` para limitar ao tenant atual:
- `invalidateProdutos()` → `produtos:${tenantId}:*`
- `invalidateComandas()` → `comandas:${tenantId}:*` + `mesas:${tenantId}:*`
- `invalidatePedidos()` → `pedidos:${tenantId}:*`
- `invalidateAmbientes()` → `ambientes:${tenantId}:*` + `produtos:${tenantId}:*`
- `invalidateMesas()` → `mesas:${tenantId}:*`
- `invalidateTenantCache(tenantId)` → `*:${tenantId}:*` (super admin)

### 10.3 Rate Limit Cache

```
ratelimit:{tenantId}:minute:{timestamp}
ratelimit:{tenantId}:hour:{timestamp}
ratelimit:{tenantId}:burst:{timestamp}
ratelimit:ip:{ip}:minute:{timestamp}
```

### 10.4 Avaliacao

**BEM IMPLEMENTADO.** Chaves com prefixo tenant. Invalidacao por tenant.

### 10.5 Problemas

| ID | Sev | Problema |
|----|-----|---------|
| CA01 | ALTO | Sem Redis em producao — cache in-memory perde tudo a cada restart (rate limits resetam) |
| CA02 | MEDIO | `invalidatePattern()` usa `store.keys()` — pode ser lento com muitas chaves |

---

## 11. Banco de Dados — tenant_id

### 11.1 Entidades com tenant_id (25)

| Entity | Tabela | nullable | FK tenant | Indice tenant |
|--------|--------|----------|-----------|---------------|
| Ambiente | ambientes | **true** | Nao | Sim (simples) |
| Avaliacao | avaliacoes | **true** | Nao | Sim (simples) |
| AberturaCaixa | abertura_caixa | **true** | Nao | Sim (simples) |
| Cliente | clientes | **true** | Nao | Sim (simples) |
| Comanda | comandas | **true** | Nao | Sim (simples) |
| ComandaAgregado | comanda_agregados | **true** | Nao | Nao |
| Empresa | empresas | **true** | Nao | Sim (simples) |
| Evento | eventos | **true** | Nao | Sim (simples) |
| Funcionario | funcionarios | **true** | Nao | Sim (simples + composto email) |
| ItemPedido | item_pedido | **true** | Nao | Sim (simples) |
| LayoutEstabelecimento | layouts_estabelecimento | **true** | Nao | Sim (simples) |
| Medalha | medalhas | **true** | Nao | Nao |
| MedalhaGarcom | medalha_funcionario | **true** | Nao | Nao |
| Mesa | mesas | **true** | Nao | Sim (simples) |
| PaginaEvento | paginas_evento | **true** | Nao | Sim (simples) |
| PaginaEventoMedia | pagina_evento_media | **true** | Nao | Nao |
| Pedido | pedidos | **true** | Nao | Sim (simples) |
| PontoEntrega | pontos_entrega | **true** | Nao | Sim (simples) |
| Produto | produtos | **true** | Nao | Sim (simples) |
| Subscription | subscription | **true** | Sim (unica) | Nao |
| PaymentTransaction | payment_transactions | **true** | Nao | Nao |
| Turno | turnos | **true** | Nao | Sim (simples) |
| AuditLog | audit_logs | **true** | Nao | Sim (simples) |
| Sangria | sangrias | **true** | Nao | Nao |
| MovimentacaoCaixa | movimentacao_caixa | **true** | Nao | Nao |

### 11.2 Resumo

| Metrica | Valor |
|---------|-------|
| Tabelas com tenant_id | 25 |
| tenant_id NOT NULL | **0** |
| FKs tenant_id → tenants(id) | **1** (subscription) |
| Indices simples tenant_id | 17 |
| Indices compostos | **1** (funcionario email+tenant) |
| Tabelas SEM indice tenant | 8 |

### 11.3 TenantAwareEntity (nao usada)

```typescript
// tenant-aware.entity.ts
export abstract class TenantAwareEntity {
  @Column({ type: 'uuid', nullable: false })  // NOT NULL!
  @Index()
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;                              // FK!
}
```

Classe base CORRETA existe. `nullable: false` + FK + Index. **NENHUMA entity a herda.** Todas definem `@Column({ nullable: true })` manualmente.

### 11.4 UNIQUE Constraints Problematicas

| Entity | Campo | Constraint | Problema |
|--------|-------|-----------|---------|
| Cliente | cpf | `@Column({ unique: true })` | UNIQUE **global** — dois tenants nao podem ter mesmo CPF |
| Funcionario | email | `@Index(['email', 'tenantId'], { unique: true })` | UNIQUE composto — **CORRETO** |
| Tenant | slug | `@Column({ unique: true })` | UNIQUE global — **CORRETO** (slugs sao globais) |

### 11.5 Problemas Banco

| ID | Sev | Problema |
|----|-----|---------|
| DB01 | CRITICO | tenant_id nullable em 25 tabelas |
| DB02 | CRITICO | Zero FKs tenant_id → tenants(id) (exceto subscription) |
| DB03 | CRITICO | Migration MakeTenantIdNotNull existe em migrations_backup/ mas NUNCA executada |
| DB04 | ALTO | Cliente.cpf UNIQUE global (deveria [cpf, tenant_id]) |
| DB05 | ALTO | 8 tabelas SEM indice em tenant_id |
| DB06 | ALTO | Zero indices compostos (tenant_id + status + data) exceto funcionario |
| DB07 | MEDIO | empresaId legado em Funcionario e PontoEntrega coexiste com tenant_id |

---

## 12. Auth — Refresh Token Cross-Tenant

**Arquivo:** `auth/refresh-token.service.ts`

### 12.1 Geracao

```typescript
// refresh-token.service.ts:40-67
async generateRefreshToken(
  funcionario: Funcionario,
  ipAddress: string,
  userAgent?: string,
  tenantId?: string,    // OPCIONAL
): Promise<RefreshToken> {
```

`tenantId` e **opcional**. Se nao enviado, refresh token nao tem tenant vinculado.

### 12.2 Validacao

```typescript
// refresh-token.service.ts:74-101
async validateRefreshToken(token: string, tenantId?: string): Promise<RefreshToken> {
  // ...
  if (tenantId && refreshToken.tenantId && refreshToken.tenantId !== tenantId) {
    throw new ForbiddenException('...');
  }
}
```

Check **so executa se AMBOS** `tenantId` (param) e `refreshToken.tenantId` sao truthy.

### 12.3 Controller

```typescript
// auth.controller.ts:71-76
@Post('refresh')
async refresh(
  @Body('refresh_token') refreshToken: string,
  @Ip() ipAddress: string,
) {
  return this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress);
  // tenantId NAO E PASSADO!
}
```

O controller **NUNCA** passa `tenantId` para `refreshAccessToken`. Terceiro parametro e omitido.

### 12.4 Renovacao

```typescript
// refresh-token.service.ts:109-126
async refreshAccessToken(token: string, ipAddress: string, tenantId?: string) {
  const refreshToken = await this.validateRefreshToken(token, tenantId);
  const payload = {
    sub: refreshToken.funcionario.id,
    email: refreshToken.funcionario.email,
    cargo: refreshToken.funcionario.cargo,
    tenantId: refreshToken.tenantId,  // Pode ser null!
  };
  const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
}
```

JWT renovado pode ter `tenantId: null` se o refresh token nao tinha.

### 12.5 Problemas Auth

| ID | Sev | Problema |
|----|-----|---------|
| AU01 | CRITICO | `POST /auth/refresh` NAO envia tenantId — validacao cross-tenant PULADA | auth.controller.ts:75 |
| AU02 | CRITICO | RefreshToken.tenantId e opcional — tokens podem existir sem tenant | refresh-token.service.ts:44 |
| AU03 | ALTO | JWT renovado pode ter tenantId: null — bypassa TenantGuard (sem user.tenantId) | refresh-token.service.ts:120 |
| AU04 | ALTO | JWT renovado falta `nome` e `ambienteId` — frontend pode quebrar | refresh-token.service.ts:116-121 |

**Cenario de ataque AU01:**
1. Funcionario do Pub A faz login → recebe refresh token com tenantId=A
2. Funcionario vai para subdominio do Pub B
3. Envia POST /auth/refresh com o mesmo refresh token
4. Controller nao envia tenantId → validacao e PULADA
5. Recebe JWT com tenantId=A
6. TenantGuard compara JWT(A) vs URL(B) → BLOQUEIA (**mitigado parcialmente**)
7. MAS se acessar API sem subdominio (api.pubsystem.com.br direto), nao ha tenant no contexto → Guard pula → acesso com JWT de A

---

## 13. Payment Service — Bypass

**Arquivo:** `payment/payment.service.ts`

```typescript
@InjectRepository(Subscription)
private readonly subscriptionRepository: Repository<Subscription>,
@InjectRepository(PaymentTransaction)
private readonly transactionRepository: Repository<PaymentTransaction>,
```

`Subscription` e `PaymentTransaction` tem `tenant_id` mas sao acessados via `Repository` direto, NAO `BaseTenantRepository`. Todas as queries neste service ignoram tenant.

| ID | Sev | Problema |
|----|-----|---------|
| PY01 | ALTO | Subscription queries sem filtro tenant |
| PY02 | ALTO | PaymentTransaction queries sem filtro tenant |

---

## 14. Frontend — Envio de Tenant

**Arquivo:** `frontend/src/services/api.ts`

### 14.1 API Autenticada

```typescript
// Interceptor adiciona JWT via localStorage
const token = localStorage.getItem('authToken');
config.headers.Authorization = `Bearer ${token}`;
```

Tenant resolvido via JWT. **OK.**

### 14.2 API Publica

```typescript
// Interceptor adiciona X-Tenant-ID via subdominio
const tenantSlug = getTenantSlugFromHostname();
if (tenantSlug) {
  config.headers['X-Tenant-ID'] = tenantSlug;  // SLUG, nao UUID!
}
```

Envia **slug** como `X-Tenant-ID`. Backend aceita slug (TenantInterceptor:168-173 testa se e UUID, senao trata como slug). **Funciona mas e confuso** — header deveria ser `X-Tenant-Slug`.

### 14.3 Middleware

```typescript
// frontend/src/middleware.ts
// Detecta subdominio e reescreve: casarao-pub.pubsystem.com.br/ → /t/casarao-pub
```

**OK.**

---

## 15. Catalogo Completo

### CRITICO (9)

| ID | Problema | Arquivo |
|----|---------|---------|
| WS01 | WebSocket: `decode()` aceita tokens fabricados | base-tenant.gateway.ts:32 |
| WS02 | WebSocket: query param `tenantId` sem autenticacao | base-tenant.gateway.ts:37 |
| WS03 | WebSocket: header `x-tenant-id` sem autenticacao | base-tenant.gateway.ts:43 |
| AU01 | POST /auth/refresh NAO envia tenantId | auth.controller.ts:75 |
| AU02 | RefreshToken.tenantId opcional — tokens sem tenant | refresh-token.service.ts:44 |
| DB01 | tenant_id nullable em 25 tabelas | Todas entities |
| DB02 | Zero FKs tenant_id → tenants(id) | Banco |
| DB03 | Migration NOT NULL nunca executada | migrations_backup/ |
| TG02 | TenantGuard pula validacao se context nao tem tenant | tenant.guard.ts:78 |

### ALTO (10)

| ID | Problema | Arquivo |
|----|---------|---------|
| AU03 | JWT renovado pode ter tenantId null | refresh-token.service.ts:120 |
| AU04 | JWT renovado falta nome e ambienteId | refresh-token.service.ts:116 |
| BR01 | rawRepository publico — bypass facil | base-tenant.repository.ts:454 |
| CA01 | Sem Redis em prod — rate limits resetam a cada restart | docker-compose.micro.yml |
| DB04 | Cliente.cpf UNIQUE global | cliente.entity.ts:24 |
| DB05 | 8 tabelas sem indice em tenant_id | Banco |
| DB06 | Zero indices compostos tenant + filtros | Banco |
| PY01 | Subscription sem filtro tenant | payment.service.ts:38-39 |
| PY02 | PaymentTransaction sem filtro tenant | payment.service.ts:40-41 |
| TR01 | resolveBySlug busca empresas (nao tenants) | tenant-resolver.service.ts:66 |

**Nota sobre rawRepository em services:** `pedido.service.ts` (12+ calls), `turno.service.ts` (2 calls), `ponto-entrega.service.ts` (1 call) usam rawRepository como fallback. Estes NAO sao bugs de seguranca diretamente (sao workarounds para registros com tenant_id null) mas sao sintoma do problema DB01 (nullable). Apos corrigir DB01, estes fallbacks devem ser REMOVIDOS.

### MEDIO (7)

| ID | Problema | Arquivo |
|----|---------|---------|
| TR02 | Fallback remove sufixo numerico — pode resolver tenant errado | tenant-resolver.service.ts:72 |
| TR03 | resolveById com 3 fallbacks — complexidade desnecessaria | tenant-resolver.service.ts:119 |
| TR04 | Cache in-memory nao compartilhado entre instancias | tenant-resolver.service.ts:37 |
| TI02 | JWT decode sem verify para resolucao | tenant.interceptor.ts:193 |
| TG01 | Security violation nao persiste no banco | tenant.guard.ts:152 |
| DB07 | empresaId legado coexiste com tenant_id | funcionario.entity.ts, ponto-entrega.entity.ts |
| CA02 | invalidatePattern usa store.keys() — pode ser lento | cache-invalidation.service.ts:86 |

---

## 16. Correcoes Propostas (Prioridade)

### Fase 1 — WebSocket e Auth (Semana 1)

| # | Correcao | Esforco |
|---|---------|---------|
| 1 | WebSocket: substituir `decode()` por `verify()` | 30min |
| 2 | WebSocket: remover fallbacks query param e header | 30min |
| 3 | auth.controller: enviar tenantId no refresh (extrair do subdomain ou JWT expirado) | 1h |
| 4 | RefreshToken: tornar tenantId obrigatorio na geracao e validacao | 1h |
| 5 | JWT renovado: incluir nome e ambienteId no payload | 30min |
| 6 | TenantGuard: bloquear se user autenticado e context sem tenant | 1h |

### Fase 2 — Banco (Semana 2)

| # | Correcao | Esforco |
|---|---------|---------|
| 7 | Verificar e limpar registros com tenant_id IS NULL | 1h |
| 8 | Migration: ALTER COLUMN tenant_id SET NOT NULL em 25 tabelas | 2h |
| 9 | Migration: ADD FK tenant_id REFERENCES tenants(id) ON DELETE CASCADE | 2h |
| 10 | Migration: ADD indices compostos (tenant_id + status + data) | 1h |
| 11 | Migration: Cliente.cpf UNIQUE [cpf, tenant_id] | 30min |
| 12 | Fazer entities herdarem TenantAwareEntity | 4h |

### Fase 3 — Services (Semana 3)

| # | Correcao | Esforco |
|---|---------|---------|
| 13 | Remover TODOS os rawRepository fallbacks em pedido.service | 3h |
| 14 | Remover rawRepository em turno.service e ponto-entrega.service | 1h |
| 15 | Corrigir schedulers: iterar por tenant ativo | 2h |
| 16 | Criar SubscriptionRepository e PaymentTransactionRepository tenant-aware | 2h |
| 17 | Simplificar TenantResolver: remover fallbacks excessivos | 1h |

### Fase 4 — Testes (Semana 4)

| # | Correcao | Esforco |
|---|---------|---------|
| 18 | Test: WebSocket rejeita token fabricado | 1h |
| 19 | Test: refresh token cross-tenant bloqueado | 1h |
| 20 | Test: scheduler processa por tenant | 2h |
| 21 | Test E2E: isolamento entre 2 tenants | 4h |
| 22 | Test: rawRepository removido (grep para confirmar) | 30min |

---

## 17. Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| WebSocket aceita token fabricado | Sim | **Nao** |
| Refresh token sem tenant | Possivel | **Impossivel** |
| tenant_id nullable | 25 tabelas | **0** |
| FKs para tenants | 1 | **25** |
| rawRepository em services | 15+ calls | **0** |
| Schedulers cross-tenant | 2 | **0** |
| Indices compostos | 1 | **8+** |
| Testes multi-tenant | 0 | **10+** |
