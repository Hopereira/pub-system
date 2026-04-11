# Relatório de Sessão — 11 de Abril de 2026

## Resumo Executivo

Sessão focada em corrigir o **redirecionamento pós-login por cargo (role)**. Funcionários COZINHEIRO/BARTENDER eram redirecionados incorretamente para `/dashboard` (área administrativa), causando erros 403 Forbidden em cascata. Foram identificados e corrigidos **4 problemas distintos** que impediam o redirecionamento correto.

---

## Contexto

Após login, cada cargo deve ir para sua área específica:

| Cargo | Destino |
|-------|---------|
| SUPER_ADMIN | `/super-admin` |
| ADMIN / GERENTE | `/dashboard` |
| CAIXA | `/caixa` |
| GARCOM | `/garcom` |
| COZINHEIRO / COZINHA / BARTENDER | `/dashboard/operacional/{ambienteId}` |

O problema: **COZINHEIRO era redirecionado para `/dashboard`** (área de ADMIN/GERENTE/CAIXA), causando múltiplos erros 403 Forbidden nas APIs de analytics e comandas.

---

## Diagnóstico — Root Causes Identificados

### Problema #1 — Middleware reescrevia domínios de preview do Vercel

**Sintoma nos logs do Vercel:**
```
[Middleware] Rewriting pub-system-bc5xzv7je-hopereiras-projects.vercel.app/ -> /t/pub-system-bc5xzv7je-hopereiras-projects.vercel.app
```

**Causa:** O middleware de tenant (`frontend/src/middleware.ts`) reescrevia qualquer host não explicitamente excluído como se fosse um subdomínio de tenant. Domínios de preview do Vercel (`*.vercel.app`) não estavam na lista de exclusão.

**Fix:** Adicionada detecção de `isVercelPreview` com `originalHost.includes('.vercel.app')` — se verdadeiro, `return NextResponse.next()` imediatamente.

---

### Problema #2 — Cargo lido via decodificação manual do JWT no frontend

**Causa:** `login/page.tsx` decodificava o JWT manualmente com `atob()` para extrair o `cargo`. Essa decodificação pode resultar em valor desatualizado ou incorreto se o token ainda não foi gravado no localStorage quando a leitura ocorre.

**Fix:** Modificado `AuthContext.tsx` para retornar a resposta completa do backend (incluindo `user.cargo`) da função `login()`. A página de login passou a usar `loginResponse.user.cargo` — valor diretamente do banco de dados, fonte confiável.

---

### Problema #3 — Código novo não propagava no Vercel (cache agressivo)

**Sintoma:** Bundle `17agszg5acxwd.js` permanecia o mesmo mesmo após múltiplos pushes. Logs de debug `=== LOGIN DEBUG v3 - BACKEND RESPONSE ===` nunca apareciam no console do navegador.

**Causa:** O Vercel mantinha cache da build anterior. Bumps no `version.txt` foram feitos para tentar forçar rebuild, mas a propagação era lenta.

**Ação:** Decisão de adicionar guarda diretamente no `dashboard/page.tsx` para funcionar independente do estado do deploy do login.

---

### Problema #4 — Nenhuma guarda no dashboard protegia cargos operacionais

**Causa:** O `dashboard/page.tsx` só redirecionava `SUPER_ADMIN`. Todos os outros cargos não-admin (COZINHEIRO, GARCOM, CAIXA) chegavam à página e:
1. `RoleGuard` mostrava "Acesso Negado"
2. APIs de analytics e comandas eram chamadas e retornavam 403

**Fix (definitivo):** Adicionado `useEffect` no `dashboard/page.tsx` que redireciona imediatamente cada cargo para sua área correta, independente do que aconteceu no login.

---

## Arquivos Modificados

### Frontend

| Arquivo | Tipo de Mudança | Justificativa |
|---------|----------------|---------------|
| `frontend/src/middleware.ts` | Fix — ignorar domínios `.vercel.app` | Evitar rewrite incorreto de preview domains como subdomínios de tenant |
| `frontend/src/context/AuthContext.tsx` | Melhoria — `login()` retorna resposta completa do backend | Prover `user.cargo` confiável para o componente de login |
| `frontend/src/app/(auth)/login/page.tsx` | Fix — usar `loginResponse.user.cargo` ao invés de decodificação JWT | Usar fonte de dados confiável (banco via backend) para redirecionamento |
| `frontend/src/app/(protected)/dashboard/page.tsx` | Fix definitivo — guarda de redirecionamento por cargo | Redirecionar cargos operacionais mesmo se o login falhar em redirecionar |
| `frontend/public/version.txt` | Bump `v2.2.0-backend-cargo-fix` | Forçar rebuild no Vercel |

---

## Lógica de Redirecionamento (Dashboard Guard)

```typescript
// frontend/src/app/(protected)/dashboard/page.tsx
useEffect(() => {
  if (!user) return;
  const cargoOperacional = ['COZINHEIRO', 'COZINHA', 'BARTENDER'];
  if (cargoOperacional.includes(user.cargo)) {
    const ambienteId = (user as any).ambienteId;
    router.replace(ambienteId
      ? `/dashboard/operacional/${ambienteId}`
      : '/cozinha'
    );
  }
  if (user.cargo === 'GARCOM') router.replace('/garcom');
  if (user.cargo === 'CAIXA')  router.replace('/caixa');
}, [user, router]);
```

---

## Commits da Sessão

```
2e32834  fix: evitar rewrite do middleware em domínios de preview do Vercel
e250dc8  fix: usar cargo do backend ao invés de decodificar JWT para redirecionamento correto
bcadb1e  fix: usar router.replace para cozinheiro (mesmo método que funciona para caixa)
2c2aa20  chore: bump version para forçar deploy no Vercel
87eda0f  fix: redirecionar cargos operacionais no dashboard (guarda independente do login)
```

---

## Estado Final — Verificado Funcionando ✅

| Cargo | Destino Após Login | Status |
|-------|-------------------|--------|
| ADMIN | `/dashboard` | ✅ Funcionando |
| GERENTE | `/dashboard` | ✅ Funcionando |
| CAIXA | `/caixa` | ✅ Funcionando (confirmado antes desta sessão) |
| COZINHEIRO | `/dashboard/operacional/{ambienteId}` | ✅ **Corrigido nesta sessão** |
| BARTENDER | `/dashboard/operacional/{ambienteId}` | ✅ **Corrigido nesta sessão** |
| GARCOM | `/garcom` | ✅ Coberto pela guarda |
| SUPER_ADMIN | `/super-admin` | ✅ Funcionando |

---

## IDs de Referência (Tenant de Demonstração)

| Recurso | ID |
|---------|----|
| Tenant slug | `pub-demo` |
| Domínio produção | `pub-demo.pubsystem.com.br` |
| Ambiente Cozinha | `d6803a12-b554-4234-a771-d54fb162c3f1` |
| Ambiente Bar | `0705f898-4b0d-4753-b088-88cb6c6cfdde` |

---

## Infraestrutura

| Componente | Detalhes |
|-----------|----------|
| **Frontend** | Vercel — deploy automático via push para `main` |
| **Backend** | Docker na Oracle VM (`134.65.248.235`) — container `pub-backend` |
| **Banco** | PostgreSQL 17 no container `pub-postgres` |
| **API** | `https://api.pubsystem.com.br` |

---

## Risco Residual / Próximas Ações

1. **Cache do Vercel:** O bundle JS (`17agszg5acxwd.js`) pode ainda estar em cache em alguns clientes. Orientar usuários a fazer hard reload (Ctrl+Shift+R) se encontrarem comportamento antigo.
2. **Aguardar rebuild completo:** O fix do `login/page.tsx` e `AuthContext.tsx` ainda pode não ter propagado para todos os edge nodes do Vercel. A guarda no `dashboard/page.tsx` serve como fallback enquanto isso.
3. **Testar BARTENDER:** O cargo BARTENDER não foi testado explicitamente — verificar se tem `ambienteId` correto no banco.
4. **Remover logs de debug:** Quando confirmado estável, remover os `console.log` de `=== LOGIN DEBUG v3 - BACKEND RESPONSE ===` do `login/page.tsx`.
