# Correções Multi-Tenancy - Enforcement Automático

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Concluído

---

## 📖 Resumo

Correção dos problemas de injeção de dependências (DI) que impediam o funcionamento correto do `TenantInterceptor` e `TenantGuard` globalmente. Também foram corrigidos diversos controllers que apresentavam erro 403 "Tenant não identificado".

---

## 🐛 Problemas Identificados

### 1. TenantInterceptor e TenantGuard Desabilitados
- **Causa:** Uso de `app.get()` no `main.ts` não funciona com providers `Scope.REQUEST`
- **Sintoma:** Warning no console "TenantInterceptor e TenantGuard desabilitados temporariamente"
- **Impacto:** Sem enforcement automático de multi-tenancy

### 2. Erro 403 "Tenant não identificado" em Vários Endpoints
- **Causa:** `FeatureGuard` executava antes do `JwtAuthGuard`, então `request.user` não existia
- **Endpoints afetados:**
  - `/eventos` - 403 Forbidden
  - `/avaliacoes/estatisticas/hoje` - 403 Forbidden
  - `/turnos/*` - 403 Forbidden

### 3. Erro 500 no Login
- **Causa:** `TenantLoggingInterceptor` tentava acessar `this.logger` que estava undefined
- **Sintoma:** "Cannot read properties of undefined (reading 'log')"

---

## ✅ Correções Implementadas

### 1. TenantModule - Providers Globais via APP_INTERCEPTOR/APP_GUARD

**Arquivo:** `backend/src/common/tenant/tenant.module.ts`

```typescript
// 🏢 Interceptor Global: Captura tenant de subdomínio/URL/JWT
{
  provide: APP_INTERCEPTOR,
  useClass: TenantInterceptor,
},
// 🛡️ Guard Global: Bloqueia acesso cross-tenant
{
  provide: APP_GUARD,
  useClass: TenantGuard,
},
```

**Por que funciona:** `APP_INTERCEPTOR` e `APP_GUARD` são a forma correta do NestJS para registrar providers globais que dependem de serviços com escopo de requisição (`Scope.REQUEST`).

### 2. TenantInterceptor - Proteções Null-Safe

**Arquivo:** `backend/src/common/tenant/tenant.interceptor.ts`

- Verificação de `request` válido antes de processar
- Verificação de `tenantResolver` disponível
- Uso de optional chaining (`?.`) em todas as chamadas de logger e serviços
- Fallback para `empresaId` do JWT quando não há tenant no contexto

### 3. Controllers - Ordem Correta dos Guards

| Controller | Antes | Depois |
|------------|-------|--------|
| `evento.controller.ts` | `@UseGuards(FeatureGuard)` | `@UseGuards(JwtAuthGuard, FeatureGuard)` |
| `turno.controller.ts` | `@UseGuards(FeatureGuard)` | `@UseGuards(JwtAuthGuard, FeatureGuard)` |
| `avaliacao.controller.ts` | `@UseGuards(FeatureGuard)` | `@UseGuards(JwtAuthGuard, FeatureGuard)` |

**Por que funciona:** O `JwtAuthGuard` precisa executar primeiro para definir `request.user`, que o `FeatureGuard` usa para extrair o `empresaId`.

### 4. FeatureGuard - Fallback para empresaId do JWT

**Arquivo:** `backend/src/common/tenant/guards/feature.guard.ts`

```typescript
// Obter tenantId do contexto ou do JWT do usuário
let tenantId = this.tenantContext.getTenantIdOrNull();

// Se não há tenant no contexto, tentar obter do JWT (empresaId)
if (!tenantId && user?.empresaId) {
  tenantId = user.empresaId;
}
```

### 5. TenantLoggingInterceptor - Desabilitado Temporariamente

**Motivo:** Problemas com `Scope.REQUEST` quando usado como `APP_INTERCEPTOR`  
**TODO:** Refatorar para usar factory provider com escopo correto

### 6. main.ts - Código Limpo

- Removido código comentado
- Removido import não utilizado
- Atualizado log para indicar que providers estão ativos via TenantModule

### 7. Sidebar - Link "Clientes" Removido

**Arquivo:** `frontend/src/components/layout/Sidebar.tsx`

- Removido link para `/dashboard/admin/clientes` (página não existe)

---

## 📁 Arquivos Modificados

### Backend
| Arquivo | Alteração |
|---------|-----------|
| `common/tenant/tenant.module.ts` | Adicionado APP_INTERCEPTOR e APP_GUARD |
| `common/tenant/tenant.interceptor.ts` | Proteções null-safe |
| `common/tenant/tenant-logging.interceptor.ts` | Proteções null-safe |
| `common/tenant/guards/feature.guard.ts` | Fallback para empresaId do JWT |
| `modulos/evento/evento.controller.ts` | JwtAuthGuard no nível do controller |
| `modulos/turno/turno.controller.ts` | JwtAuthGuard no nível do controller |
| `modulos/avaliacao/avaliacao.controller.ts` | JwtAuthGuard no nível do controller |
| `main.ts` | Removido código comentado |

### Frontend
| Arquivo | Alteração |
|---------|-----------|
| `components/layout/Sidebar.tsx` | Removido link "Clientes" |

---

## 🔒 Status do Multi-Tenancy

| Componente | Status | Descrição |
|------------|--------|-----------|
| `TenantInterceptor` | ✅ Ativo | Captura tenant de subdomínio/URL/JWT |
| `TenantGuard` | ✅ Ativo | Bloqueia acesso cross-tenant |
| `TenantLoggingInterceptor` | ⏸️ Desabilitado | Problemas com Scope.REQUEST |
| `FeatureGuard` | ✅ Ativo | Verifica features do plano |
| `TenantRateLimitGuard` | ⏸️ Desabilitado | Problemas com DI |

---

## 🧪 Testes Realizados

- ✅ Login com admin@admin.com - Funcionando
- ✅ Dashboard Admin - Carregando corretamente
- ✅ `/turnos/funcionario/:id` - 200 OK
- ✅ `/plan/features` - 200 OK
- ✅ `/avaliacoes/estatisticas/hoje` - 200 OK
- ✅ `/eventos` - 200 OK (quando acessado por ADMIN)
- ✅ `/analytics/pedidos/relatorio-geral` - 200 OK

---

## 📋 Pendências Futuras

1. **TenantLoggingInterceptor:** Refatorar para funcionar com `APP_INTERCEPTOR`
2. **TenantRateLimitGuard:** Corrigir problemas de DI para ativar globalmente
3. **WebSockets:** Adicionar tenant_id na conexão (atualmente mostra warning "conectou sem tenant_id")

---

## 📝 Notas Técnicas

### Por que `app.get()` não funciona com Scope.REQUEST?

O método `app.get()` tenta obter uma instância singleton do provider. Quando o provider tem `Scope.REQUEST`, ele precisa de um contexto de requisição para ser instanciado, que não existe no momento do bootstrap da aplicação.

### Solução Correta: APP_INTERCEPTOR/APP_GUARD

Usar `APP_INTERCEPTOR` e `APP_GUARD` no array de providers do módulo permite que o NestJS gerencie corretamente o ciclo de vida do provider, criando uma nova instância para cada requisição quando necessário.

```typescript
// ❌ Errado (não funciona com Scope.REQUEST)
const interceptor = app.get(TenantInterceptor);
app.useGlobalInterceptors(interceptor);

// ✅ Correto
@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
```

---

**Autor:** Cascade AI  
**Revisão:** Hebert Pereira
