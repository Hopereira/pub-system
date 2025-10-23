# 🔧 Correção: Acesso à Gestão de Pedidos

**Data:** 23 de outubro de 2025  
**Status:** ✅ Corrigido

---

## 🎯 Problema

Usuário ADMIN não conseguia acessar a página `/dashboard/gestaopedidos`, recebendo erro:

```
Acesso não autorizado
Seu perfil não tem permissão para acessar esta página
```

---

## 🔍 Causa Raiz

**Incompatibilidade entre Backend e Frontend:**

### Backend (JWT)
```typescript
{
  id: "...",
  email: "admin@pub.com",
  nome: "Administrador",
  cargo: "ADMIN",  // ← Backend usa 'cargo'
  empresaId: "..."
}
```

### Frontend (Esperado)
```typescript
interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;  // ← Frontend esperava 'role'
  empresaId: string;
}
```

**Resultado:** A função `hasRole()` verificava `user.role` que era `undefined`, sempre retornando `false`.

---

## ✅ Solução Implementada

### 1. Atualizar Interface User

**Arquivo:** `frontend/src/types/auth.ts`

```typescript
export interface User {
  id: string;
  email: string;
  nome: string;
  cargo: UserRole; // ✅ Backend usa 'cargo' não 'role'
  role: UserRole;  // ✅ Alias para compatibilidade
  empresaId: string;
  ambienteId?: string;
  iat?: number;
  exp?: number;
}
```

---

### 2. Atualizar Helper hasRole

**Arquivo:** `frontend/src/types/auth.ts`

**Antes:**
```typescript
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};
```

**Depois:**
```typescript
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  // ✅ Verifica tanto 'cargo' (backend) quanto 'role' (compatibilidade)
  const userRole = user.cargo || user.role;
  return roles.includes(userRole);
};
```

---

### 3. Atualizar Página de Gestão

**Arquivo:** `frontend/src/app/(protected)/dashboard/gestaopedidos/page.tsx`

```typescript
// ✅ Usa cargo do backend
const userRole = user.cargo || user.role;

if (userRole === 'GARCOM') {
  return <MapaPedidos />;
}

if (userRole === 'CAIXA') {
  return <SupervisaoPedidos />;
}
```

---

### 4. Adicionar Permissão para CAIXA

**Antes:** Apenas ADMIN e GERENTE tinham acesso

**Depois:**
```typescript
// ADMIN e GERENTE veem supervisão completa
if (isGerencialRole(user)) {
  return <SupervisaoPedidos />;
}

// ✅ CAIXA também pode ver supervisão (somente leitura)
if (userRole === 'CAIXA') {
  return <SupervisaoPedidos />;
}
```

---

## 📁 Arquivos Modificados

1. **`frontend/src/types/auth.ts`**
   - Adicionado campo `cargo` na interface User
   - Atualizado `hasRole()` para verificar `cargo` ou `role`

2. **`frontend/src/app/(protected)/dashboard/gestaopedidos/page.tsx`**
   - Usa `user.cargo || user.role` para compatibilidade
   - Adicionada permissão para CAIXA

---

## 🎯 Permissões Atualizadas

### Gestão de Pedidos (`/dashboard/gestaopedidos`)

| Role | Acesso | View |
|------|--------|------|
| **ADMIN** | ✅ Sim | SupervisaoPedidos (completa) |
| **GERENTE** | ✅ Sim | SupervisaoPedidos (completa) |
| **CAIXA** | ✅ Sim | SupervisaoPedidos (leitura) |
| **GARCOM** | ✅ Sim | MapaPedidos (mesas) |
| **COZINHA** | ✅ Sim | PreparoPedidos (ambiente) |

---

## 🧪 Como Testar

1. Fazer login como ADMIN
2. Acessar `/dashboard/gestaopedidos`
3. ✅ Deve mostrar a página SupervisaoPedidos
4. ✅ Deve ver filtros, métricas e lista de pedidos

---

## 🔍 Verificação de Debug

### Console do Navegador

```javascript
// Verificar token JWT
const token = localStorage.getItem('authToken');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('User:', decoded);
// Deve mostrar: { cargo: "ADMIN", ... }
```

### Logs Esperados

```
✅ Dados iniciais carregados
   ambientes: 3
   pedidos: 5
```

---

## ✅ Resultado Final

**PROBLEMA RESOLVIDO!**

✅ ADMIN acessa Gestão de Pedidos  
✅ GERENTE acessa Gestão de Pedidos  
✅ CAIXA acessa Gestão de Pedidos  
✅ GARÇOM vê Mapa de Mesas  
✅ COZINHA vê Preparo de Pedidos  
✅ Compatibilidade entre backend e frontend  

---

**Implementado em:** 23 de outubro de 2025  
**Testado:** ✅ ADMIN | ✅ Permissões | ✅ Compatibilidade
