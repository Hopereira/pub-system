# Relatório de Sessão — 2026-04-19

**Data:** 19 de Abril de 2026  
**Status final:** ✅

---

## 1. Situação Inicial

**Problema Principal:** O frontend não estava corretamente aplicando as restrições de funcionalidades baseadas no plano do tenant.

**Sintomas observados:**
- Páginas como "Pontos de Entrega" e "Analytics" continuavam renderizando conteúdo mesmo para tenants do plano FREE
- API calls estavam sendo feitas para endpoints restritos, resultando em erros 403 do backend
- A sidebar mostrava links desbloqueados para funcionalidades não disponíveis no plano
- O hook `usePlanFeatures` reportava `hasFeature(Feature.PONTOS_ENTREGA)` como `true` para tenants FREE

**Tenant afetado:** `bar-do-ze` (plano FREE)

---

## 2. Documentação Consultada

| Documento | Informação relevante |
|-----------|----------------------|
| `docs/sessions/2026-04-11/RELATORIO_SESSAO.md` | Padrão de fallback para tenantId em eventos |
| `docs/sessions/CONVENCAO.md` | Template para este relatório |
| `.windsurf/workflows/regra-de-ouro.md` | Protocolo de análise e documentação |
| `backend/src/common/tenant/controllers/plan-features.controller.ts` | Endpoint `/plan/features` |
| `backend/src/common/tenant/guards/feature.guard.ts` | Guarda de features do backend |
| `backend/src/common/tenant/services/plan-features.service.ts` | Lógica de verificação de features |

---

## 3. Diagnóstico

**Root Cause:** Inconsistência na resolução de `tenantId` entre `PlanFeaturesController` e `FeatureGuard`.

**Evidências:**

1. **PlanFeaturesController** (`plan-features.controller.ts:38-67`):
   - Usava `this.tenantContext.getTenantIdOrNull()` apenas
   - Quando não resolvia tenant, retornava plano ENTERPRISE para SUPER_ADMIN
   - Para usuários comuns sem tenant resolvido, retornava ENTERPRISE incorretamente

2. **FeatureGuard** (`feature.guard.ts:85-95`):
   - Usava fallback: `this.tenantContext.getTenantIdOrNull() || request.user?.tenantId`
   - Resolvia corretamente o tenant via JWT quando o contexto falhava

3. **Discrepância:**
   - O guarda bloqueava requisições (403) porque resolvia o tenant corretamente (plano FREE)
   - O controller retornava features de ENTERPRISE porque não usava o fallback do JWT
   - Resultado: Frontend recebia lista de features incorreta, mostrava UI desbloqueada, mas API falhava

**Causa secundária identificada:**
- Backend usava `PLAN_FEATURES` hardcoded ao invés de ler do banco de dados
- SUPER_ADMIN configurava features no banco, mas backend ignorava

---

## 4. Correções Aplicadas

### 4.1 Backend — PlanFeaturesController (`backend/src/common/tenant/controllers/plan-features.controller.ts`)

**Alteração:** Implementar fallback consistente para resolução de `tenantId` e usar features do banco.

```typescript
// Antes: Apenas tenantContext, retornava ENTERPRISE para usuários sem tenant
const tenantId = this.tenantContext.getTenantIdOrNull();

// Depois: Fallback para JWT + default FREE para não-SUPER_ADMIN
let tenantId = this.tenantContext.getTenantIdOrNull();
if (!tenantId && request?.user?.tenantId) {
  tenantId = request.user.tenantId;
}

if (!tenantId) {
  if (isSuperAdmin) {
    return { ...await this.planFeaturesService.getPlanInfoFromDb('ENTERPRISE'), ... };
  }
  // Usuário sem tenant → plano FREE (mais restritivo)
  return { ...await this.planFeaturesService.getPlanInfoFromDb('FREE'), ... };
}
```

### 4.2 Backend — PlanFeaturesService (`backend/src/common/tenant/services/plan-features.service.ts`)

**Alteração:** Adicionar métodos para ler features do banco de dados.

```typescript
async getFeaturesFromDb(planoCode: string): Promise<Feature[]> {
  const plan = await this.planRepository.findOne({
    where: { code: planoCode.toUpperCase(), isActive: true },
    select: ['features'],
  });
  if (plan?.features?.length > 0) {
    return plan.features as Feature[];
  }
  return PLAN_FEATURES[planoCode] || PLAN_FEATURES[TenantPlano.FREE];
}

async getPlanInfoFromDb(planoCode: string) {
  const features = await this.getFeaturesFromDb(planoCode);
  const limits = await this.getLimitsFromDb(planoCode);
  // ... montar featureFlags
}
```

### 4.3 Backend — FeatureGuard (`backend/src/common/tenant/guards/feature.guard.ts`)

**Alteração:** Usar `hasFeatureFromDb` ao invés de `hasFeature` hardcoded.

```typescript
// Antes
const allowed = this.planFeaturesService.hasFeature(tenant.plano, feature);

// Depois
const allowed = await this.planFeaturesService.hasFeatureFromDb(tenant.plano, feature);
```

### 4.4 Frontend — Sidebar (`frontend/src/components/layout/Sidebar.tsx`)

**Alteração:** Adicionar `feature: Feature.EVENTOS` ao link "Páginas de Boas-Vindas".

```typescript
{ 
  href: '/dashboard/admin/paginas-evento', 
  label: 'Páginas de Boas-Vindas', 
  icon: Presentation, 
  roles: ['ADMIN'], 
  feature: Feature.EVENTOS,  // <- Adicionado
  premium: true 
}
```

### 4.5 Frontend — Dashboard (`frontend/src/app/(protected)/dashboard/page.tsx`)

**Alteração:** Guardar chamada `getEstatisticasDoDia` com verificação de feature.

```typescript
hasFeature(Feature.AVALIACOES)
  ? getEstatisticasDoDia().catch(...)
  : Promise.resolve({ mediaSatisfacao: 0, totalAvaliacoes: 0, ... })
```

### 4.6 Backend — TenantProvisioningService (`backend/src/common/tenant/services/tenant-provisioning.service.ts`)

**Alteração:** Respeitar os limites do plano no provisionamento inicial de tenant (antes criava 3 ambientes e 10 mesas fixos, ignorando plano FREE que permite apenas 1 ambiente e 5 mesas).

```typescript
// Injeção de PlanFeaturesService
constructor(..., private readonly planFeaturesService: PlanFeaturesService) {}

// Buscar limites do banco após criar tenant
const planLimits = await this.planFeaturesService.getLimitsFromDb(plano);
const allowedAmbientes = planLimits.maxAmbientes === -1 ? Infinity : planLimits.maxAmbientes;
const allowedMesas = planLimits.maxMesas === -1 ? Infinity : planLimits.maxMesas;

// Ambientes: Salão priorizado, slice pelo limite
const ambientesConfig = [
  { nome: 'Salão', ... },   // prioridade (mesas ficam aqui)
  { nome: 'Cozinha', ... },
  { nome: 'Bar', ... },
].slice(0, allowedAmbientes);

// Mesas: Math.min(default 10, limite do plano)
const mesasACriar = Math.min(10, allowedMesas);
```

**Resultado para cada plano:**

| Plano | Ambientes criados | Mesas criadas |
|-------|-------------------|---------------|
| FREE  | 1 (Salão)         | 5             |
| BASIC | 3 (Salão, Cozinha, Bar) | 10      |
| PRO/ENTERPRISE | 3 (todos) | 10           |

Também removido o `config` hardcoded do tenant (`maxMesas: 10, maxFuncionarios: 5, ...`). Limites agora vêm exclusivamente da tabela `plans`.

### 4.7 Documentação — Script de Diagnóstico (`docs/operacao/diagnostico-limites-tenants.md`)

**Criado:** Script SQL para identificar tenants existentes que excedem limites do plano, com procedimento recomendado (upgrade, remoção manual verificando histórico, ou manter).

---

## 5. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| Verificação de health do backend (`/health`) | ✅ OK |
| Verificação de código no container Docker | ✅ Novo código presente |
| Teste de frontend pós-deploy (bar-do-ze) | ✅ Sidebar mostra cadeados corretamente |
| Teste de API `/plan/features` | ✅ Retorna features do FREE corretamente |
| Verificação de 403 em endpoints restritos | ✅ API bloqueia, frontend não chama mais |
| Compilação TypeScript (`tsc --noEmit`) após fix de provisionamento | ✅ Sem erros |

---

## 6. Commits da Sessão

| Hash | Mensagem |
|------|----------|
| `f75c9dab` | fix: usar banco de dados para features do plano em vez de hardcoded |
| `d595d422` | fix(tenant-provisioning): respeitar limites do plano ao criar tenant |
| `15e301c` | fix(cache): adicionar trackKey faltante em AmbienteService, MesaService, ProdutoService, ComandaService |
| `6e0db2bd` | fix(features): separar CARDAPIO_DIGITAL de EVENTOS como feature básica (FREE) |
| `b234921`  | chore: trigger vercel redeploy for CARDAPIO_DIGITAL feature |
| `ee921a9`  | fix(paginas-evento): usar string literal cardapio_digital no FeatureGate |

---

## 7. Estado Final

**Funcionando corretamente:**
- ✅ Frontend aplica corretamente restrições de plano via `FeatureGate`
- ✅ Sidebar exibe cadeados para funcionalidades não disponíveis
- ✅ API calls para endpoints restritos são bloqueadas no frontend (não chegam ao backend)
- ✅ Backend usa configurações do banco de dados (respeita SUPER_ADMIN)
- ✅ `PlanFeaturesController` e `FeatureGuard` usam lógica consistente de resolução de tenant
- ✅ Provisionamento de tenant respeita limites do plano (mesas e ambientes)
- ✅ Cache de ambientes, mesas, produtos e comandas é invalidado corretamente após CRUD
- ✅ "Páginas de Boas-Vindas" (cardápio digital) usa Feature.CARDAPIO_DIGITAL — acessível no plano FREE
- ✅ "Agenda de Eventos" (couvert artístico) usa Feature.EVENTOS — acessível a partir de BASIC
- ✅ Super Admin vê labels diferenciadas: "Cardápio Digital (QR Code)" vs "Eventos (Couvert/Agenda)"

**Arquitetura corrigida:**
- Features agora são gerenciadas no banco (tabela `plans`)
- SUPER_ADMIN pode configurar features via interface
- Backend lê do banco com fallback para hardcoded
- Frontend recebe lista correta de features disponíveis
- Cache backend usa `trackKey` para rastrear chaves e `invalidatePattern` para limpar
- Feature `cardapio_digital` separada de `eventos` — duas funcionalidades distintas

---

## 8. Risco Residual / Próximas Ações

### 8.1 Resolvido Nesta Sessão

- ✅ Fix do `TenantProvisioningService` para respeitar limites do plano
- ✅ Validação `requireLimitForTenant` já existia em `MesaService` e `AmbienteService`
- ✅ Script de diagnóstico criado em `docs/operacao/diagnostico-limites-tenants.md`
- ✅ Diagnóstico executado em produção — 3 tenants FREE excedem limites
- ✅ Fix de cache: `trackKey` adicionado em 4 services (bug de invalidação corrigido)
- ✅ Deploy em produção confirmado (container com código novo + healthy)
- ✅ Feature CARDAPIO_DIGITAL separada de EVENTOS — "Páginas de Boas-Vindas" agora acessível no FREE
- ✅ SQL executado em produção: `cardapio_digital` adicionado aos 4 planos existentes
- ✅ Labels diferenciadas no Super Admin: "Cardápio Digital (QR Code)" vs "Eventos (Couvert/Agenda)"

### 8.2 Diagnóstico de Tenants Excedentes (Produção)

| Tenant | Plano | Mesas | Max | Ambientes | Max | Funcionários | Max |
|--------|-------|-------|-----|-----------|-----|--------------|-----|
| Bar do Zé | FREE | 9 | 5 | 3 | 2 | 3 | 2 |
| Hopbar | FREE | 10 | 5 | 3 | 2 | 1 | 2 |
| teste | FREE | 10 | 5 | 3 | 2 | 1 | 2 |
| Pub Demo | PRO | 10 | 20 | 3 | 5 | 5 | 10 |

### 8.3 Pendente (Operacional — não bloqueante)

| Prioridade | Ação | Responsável |
|------------|------|-------------|
| Média | Decidir caso a caso: upgrade de plano ou remoção manual de recursos | SUPER_ADMIN |
| Baixa | Atualizar `docs/sessions/CONVENCAO.md` com registro desta sessão | Próxima sessão |

---

## Notas Técnicas

**Deploy realizado:**
- Frontend: Vercel (`pub_system`) — deploy automático na push para main
- Backend: Oracle VM (`134.65.248.235`) — deploy manual via SSH + Docker

**Comando SSH utilizado:**
```bash
ssh -i "D:\Ficando_rico\Projetos\private Key\ssh-key-2025-12-11.key" ubuntu@134.65.248.235
```

**Método de deploy backend:** Git bundle + SCP + Docker rebuild

---

## Adendo — Fix adicional em 19/04 à noite (CARDAPIO_DIGITAL em produção)

**Sintoma:** Mesmo após o commit `6e0db2bd` e redeploy Vercel, a página `/dashboard/admin/paginas-evento` continuava mostrando "Funcionalidade Premium" no plano FREE (reproduzido em aba anônima).

**Diagnóstico via patch no container + JWT direto:**

1. Backend local (`/app/dist`) estava sem `CARDAPIO_DIGITAL` no enum `Feature` — o deploy anterior tinha patcheado apenas alguns arquivos. Re-patcheados 3 arquivos compilados:
   - `common/tenant/services/plan-features.service.js` (enum + `PLAN_FEATURES`)
   - `modulos/plan/plan.service.js` (seed)
   - `modulos/plan/entities/plan.entity.js` (`ALL_FEATURES` labels)
2. Teste com JWT válido gerado dentro do container confirmou o endpoint `/plan/features` retornando:
   ```json
   { "plano":"FREE", "features":{"cardapio_digital":true, ...} }
   ```
3. Frontend Vercel ainda servindo build antigo (sem `Feature.CARDAPIO_DIGITAL` no enum → `feature={undefined}` → `hasFeature(undefined)` retornava `false`).

**Solução aplicada:**
- `frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx`: trocar `<FeatureGate feature={Feature.CARDAPIO_DIGITAL}>` por `<FeatureGate feature="cardapio_digital">` (string literal, defensivo contra enum desatualizado no build cache).
- Commit `ee921a9` → push → Vercel fez rebuild → página liberada para tenants FREE.

**Lição aprendida:**
- Ao introduzir novos valores em enums compartilhados (frontend + backend), usar **string literal** em call sites críticos até o deploy estabilizar — evita casos onde build cache da Vercel ou do container resolve `EnumMember` como `undefined`.
- Para o backend, sempre conferir se o patch manual incluiu **todos** os JS compilados afetados (enum + seed + entity labels) — rodar `grep <valor_novo>` dentro do container após patch.
