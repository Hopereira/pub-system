# Relatório de Sessão — 2026-04-19

**Data:** 19 de Abril de 2026  
**Status final:** ✅ (Parcial)

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

---

## 5. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| Verificação de health do backend (`/health`) | ✅ OK |
| Verificação de código no container Docker | ✅ Novo código presente |
| Teste de frontend pós-deploy (bar-do-ze) | ✅ Sidebar mostra cadeados corretamente |
| Teste de API `/plan/features` | ✅ Retorna features do FREE corretamente |
| Verificação de 403 em endpoints restritos | ✅ API bloqueia, frontend não chama mais |

---

## 6. Commits da Sessão

| Hash | Mensagem |
|------|----------|
| `f75c9dab` | fix: usar banco de dados para features do plano em vez de hardcoded |

---

## 7. Estado Final

**Funcionando corretamente:**
- ✅ Frontend aplica corretamente restrições de plano via `FeatureGate`
- ✅ Sidebar exibe cadeados para funcionalidades não disponíveis
- ✅ API calls para endpoints restritos são bloqueadas no frontend (não chegam ao backend)
- ✅ Backend usa configurações do banco de dados (respeita SUPER_ADMIN)
- ✅ `PlanFeaturesController` e `FeatureGuard` usam lógica consistente de resolução de tenant

**Arquitetura corrigida:**
- Features agora são gerenciadas no banco (tabela `plans`)
- SUPER_ADMIN pode configurar features via interface
- Backend lê do banco com fallback para hardcoded
- Frontend recebe lista correta de features disponíveis

---

## 8. Risco Residual / Próximas Ações

### 8.1 Problema Identificado (Não Resolvido)

**Tenant novo com dados excedendo limites do plano:**
- Plano FREE permite: 5 mesas, 1 ambiente
- Tenant de teste criado tinha: 10 mesas, 3 ambientes

**Impacto:** Inconsistência nos dados de seed/criação de tenant.

### 8.2 Próximas Ações

| Prioridade | Ação | Responsável |
|------------|------|-------------|
| Média | Revisar lógica de seed de tenants para respeitar limites do plano FREE | Pendente |
| Média | Adicionar validação na criação de mesas/ambientes para não exceder limites | Pendente |
| Baixa | Criar migração para ajustar tenants existentes que excedem limites | Pendente |

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
