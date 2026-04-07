# Relatório de Sessão — 2026-04-07

**Data:** 07 de Abril de 2026  
**Status final:** ✅ Todos os itens corrigidos e deployados  
**PRs:** #289 (backend MRR), #291 (CVE Next.js)

---

## 1. Situação Inicial

Duas issues independentes identificadas:

1. **MRR incorreto** na página `/super-admin/planos` — mostrava R$199,00 com 1 tenant PRO (preço real: R$99)
2. **Vulnerabilidade de segurança** reportada pelo Red Hat TPA/OSV — `next@16.1.7` afetada por CVE-2025-66478 (RCE), CVE-2025-55184 (DoS) e CVE-2025-55183 (source code exposure)

---

## 2. Documentação Consultada

| Documento | Informação relevante |
|-----------|---------------------|
| `docs/infra/deploy-vm.md` | Procedimento de deploy backend via CI/CD (push para main) |
| `docs/sessions/CONVENCAO.md` | Convenção de branches e relatórios |
| https://nextjs.org/blog/CVE-2025-66478 | Versões afetadas e versão patched |
| https://nextjs.org/blog/security-update-2025-12-11 | CVE-2025-55183/55184, versão 16.2.2 como latest patched |

---

## 3. Diagnóstico

### Bug 1 — MRR hardcoded no backend

```
Página /super-admin/planos: MRR = R$ 199,00
Realidade: 1 tenant PRO × R$99/mês = R$99,00
```

**Root cause:** `super-admin.service.ts` tinha `planoValues` hardcoded:
```typescript
// ❌ Antes
const planoValues: Record<string, number> = {
  FREE: 0, BASIC: 99, PRO: 199, ENTERPRISE: 499,
};
```

O banco tem PRO = R$99, não R$199. MRR inflado ao dobro.

Mesmo após o fix do frontend (PR #288, sessão 2026-04-05), o MRR continuava errado porque o cálculo é feito **no backend** e retornado via `GET /super-admin/metrics`.

### Bug 2 — CVE Next.js 16.1.7

Red Hat TPA/OSV reportou 1 vulnerabilidade Medium em `next@16.1.7`:

| CVE | Severidade real | Tipo |
|-----|----------------|------|
| CVE-2025-66478 | Critical | RCE via RSC protocol deserialization |
| CVE-2025-55184 | High | DoS via React Server Components |
| CVE-2025-55183 | Medium | Source code exposure via RSC |

`npm audit` confirmou: `next@16.1.7` vulnerável. Versão patched disponível: `16.2.2` (latest stable).

---

## 4. Correções Aplicadas

### 4.1 Fix MRR — backend `super-admin.service.ts`

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `backend/src/common/tenant/services/super-admin.service.ts` | Substituído `planoValues` hardcoded por busca real da tabela `plans` via `planRepository.find()` |
| `backend/src/common/tenant/tenant.module.ts` | Adicionado `Plan` ao `TypeOrmModule.forFeature([...])` e import da entidade |

```typescript
// ✅ Depois
const plans = await this.planRepository.find({ where: { isActive: true } });
const planoValues: Record<string, number> = {};
for (const plan of plans) {
  planoValues[plan.code] = Number(plan.priceMonthly);
}
```

Deploy: CI/CD automático via push para `main` (PR #289). Backend recompilado e reiniciado na Oracle VM.

### 4.2 Fix CVE — Next.js 16.1.7 → 16.2.2

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `frontend/package.json` | `next: "^16.1.7"` → `next: "16.2.2"` (pinned); `eslint-config-next: "15.5.2"` → `"16.2.2"` |
| `frontend/yarn.lock` | Atualizado via `yarn upgrade next@16.2.2 eslint-config-next@16.2.2` |

```
npm audit após atualização: 0 vulnerabilidades
```

Deploy: Vercel automático via push para `main` (PR #291).

---

## 5. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| `npm audit` após `next@16.2.2` | ✅ 0 vulnerabilidades |
| CI/CD build do frontend (`next build`) | ✅ Passou |
| CI/CD deploy backend (Oracle VM) | ✅ Passou — `Verify deployment health` OK |
| `npm view next dist-tags` → latest | ✅ `16.2.2` confirmado como versão patched |

---

## 6. Commits da Sessão

| Hash | PR | Mensagem |
|------|----|---------|
| `609ac20` | #289 | `fix(backend): MRR calculado com precos reais do banco em vez de hardcoded` |
| `c4525ee` | #291 | `fix(security): atualizar next 16.1.7 -> 16.2.2 (CVE-2025-66478, CVE-2025-55183, CVE-2025-55184)` |

---

## 7. Estado Final

- MRR em `/super-admin/planos` calculado com preços reais do banco ✅
- `next@16.2.2` deployado no Vercel — 0 CVEs conhecidos ✅
- `eslint-config-next` alinhado com versão do Next.js ✅
- CI/CD backend e frontend passando ✅

---

## 8. Risco Residual / Próximas Ações

| Item | Risco | Ação |
|------|-------|------|
| `payment.service.ts` — `PLAN_PRICES` hardcoded no backend | Baixo — não afeta exibição direta ao usuário, mas pode causar cálculos errados em cobranças futuras | Corrigir quando implementar cobrança real |
| GitHub Dependabot — 21 vulnerabilidades no `main` | Médio — maioria em devDependencies | Avaliar em sessão de manutenção de deps |
| Node.js 20 deprecation nas GitHub Actions | Baixo — aviso para junho 2026 | Atualizar `actions/checkout@v4` → v5 antes de junho/2026 |
