# Auditoria Inicial - Role GERENTE

**Data:** 2026-02-11  
**Objetivo:** Mapear estado atual do sistema para implementação completa do role GERENTE

---

## 1. Mapeamento de Roles e Enforcement

### 1.1 Enum de Cargo
**Arquivo:** `backend/src/modulos/funcionario/enums/cargo.enum.ts`

```typescript
export enum Cargo {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',  // ✅ JÁ EXISTE no enum
  CAIXA = 'CAIXA',
  GARCOM = 'GARCOM',
  COZINHEIRO = 'COZINHEIRO',
  COZINHA = 'COZINHA',
  BARTENDER = 'BARTENDER',
}

// Constantes auxiliares já definidas:
export const ROLES_GERENCIAIS = [Cargo.SUPER_ADMIN, Cargo.ADMIN, Cargo.GERENTE];
export const ROLES_OPERACIONAIS = [Cargo.CAIXA, Cargo.GARCOM, Cargo.COZINHEIRO, Cargo.COZINHA, Cargo.BARTENDER];
export const ROLES_PREPARO = [Cargo.COZINHEIRO, Cargo.COZINHA, Cargo.BARTENDER];
```

### 1.2 Decorator @Roles()
**Arquivo:** `backend/src/auth/decorators/roles.decorator.ts`

```typescript
export const ROLES_KEY = 'cargos';
export const Roles = (...cargos: Cargo[]) => SetMetadata(ROLES_KEY, cargos);
```

### 1.3 RolesGuard
**Arquivo:** `backend/src/auth/guards/roles.guard.ts`

- Verifica `user.cargo` contra roles permitidos
- Se não há `@Roles()`, permite acesso
- Aplicado por controller/rota (não global)

### 1.4 Controllers com @Roles() (19 arquivos, 98 ocorrências)

| Controller | Rotas com @Roles | GERENTE incluído? |
|------------|------------------|-------------------|
| `pedido.controller.ts` | 11 | ❌ Parcial |
| `ponto-entrega.controller.ts` | 9 | ❌ Não |
| `analytics.controller.ts` | 7 | ✅ Sim (7 rotas) |
| `comanda.controller.ts` | 7 | ❌ Não |
| `mesa.controller.ts` | 7 | ❌ Não |
| `payment.controller.ts` | 7 | ❌ Não (PROIBIDO) |
| `ambiente.controller.ts` | 6 | ❌ Não |
| `evento.controller.ts` | 6 | ❌ Não |
| `funcionario.controller.ts` | 6 | ❌ Não |
| `pagina-evento.controller.ts` | 6 | ❌ Não |
| `plan.controller.ts` | 5 | ❌ Não (PROIBIDO) |
| `turno.controller.ts` | 4 | ❌ Não |
| `avaliacao.controller.ts` | 3 | ❌ Não |
| `caixa.controller.ts` | 3 | ✅ Sim (controller) |
| `medalha.controller.ts` | 3 | ❌ Não |
| `produto.controller.ts` | 3 | ❌ Não |
| `cliente.controller.ts` | 2 | ❌ Não |
| `pedido-analytics.controller.ts` | 2 | ❌ Não |
| `empresa.controller.ts` | 1 | ❌ Não |

---

## 2. Mapeamento do Banco de Dados

### 2.1 Coluna de Cargo
**Entidade:** `backend/src/modulos/funcionario/entities/funcionario.entity.ts`

```typescript
@Column({
  type: 'enum',
  enum: Cargo,
  default: Cargo.GARCOM,
})
cargo: Cargo;
```

**Tipo no PostgreSQL:** `funcionarios_cargo_enum` (enum nativo)

### 2.2 Migration Original
**Arquivo:** `backend/src/database/migrations_backup/1700000000000-InitialSchema.ts`

```sql
CREATE TYPE "public"."funcionarios_cargo_enum" AS ENUM('ADMIN', 'CAIXA', 'GARCOM', 'COZINHA')
```

**⚠️ PROBLEMA:** O enum no banco NÃO inclui:
- `SUPER_ADMIN`
- `GERENTE`
- `COZINHEIRO`
- `BARTENDER`

**Ação necessária:** Criar migration para adicionar valores ao enum.

### 2.3 Seeders
- Admin padrão criado em `funcionario.service.ts` com cargo `ADMIN`
- Não há seeder específico para GERENTE

---

## 3. Mapeamento do Frontend

### 3.1 Tipos de Role
**Arquivo:** `frontend/src/types/auth.ts`

```typescript
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'CAIXA' | 'GARCOM' | 'COZINHEIRO' | 'BARTENDER';
```
✅ GERENTE já incluído

### 3.2 Tipo Funcionario
**Arquivo:** `frontend/src/types/funcionario.ts`

```typescript
cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO' | 'BARTENDER';
```
❌ GERENTE NÃO incluído

### 3.3 Formulário de Funcionário
**Arquivo:** `frontend/src/components/funcionarios/FuncionarioFormDialog.tsx`

```typescript
const cargos = ['ADMIN', 'GARCOM', 'CAIXA', 'COZINHEIRO', 'BARTENDER'];
```
❌ GERENTE NÃO incluído no dropdown

### 3.4 Helpers de Role
**Arquivo:** `frontend/src/types/auth.ts`

```typescript
export const isGerencialRole = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'GERENTE']);
};
```
✅ GERENTE já considerado em helpers

### 3.5 Menus/Sidebar
**Arquivos:**
- `frontend/src/components/layout/Sidebar.tsx` - 8 referências a GERENTE
- `frontend/src/components/layout/MobileMenu.tsx` - 8 referências a GERENTE

✅ GERENTE já tem acesso a menus operacionais

---

## 4. Problemas Identificados

### 4.1 Backend - Críticos
1. **Migration pendente:** Enum no banco não inclui GERENTE, SUPER_ADMIN, COZINHEIRO, BARTENDER
2. **Anti-elevação ausente:** Nenhuma validação impede GERENTE de atribuir ADMIN/SUPER_ADMIN
3. **@Roles incompleto:** GERENTE não está em 15 dos 19 controllers

### 4.2 Frontend - Críticos
1. **Tipo funcionario.ts:** Não inclui GERENTE
2. **Dropdown de cargos:** Não inclui GERENTE
3. **Sem filtro de roles:** GERENTE pode ver/selecionar ADMIN no dropdown

### 4.3 Segurança
1. **GERENTE pode acessar plan/payments:** Não há bloqueio explícito
2. **Sem auditoria:** Mudanças de cargo não são logadas

---

## 5. Plano de Ação

### Fase 1: Banco de Dados
- [ ] Criar migration para adicionar valores ao enum `funcionarios_cargo_enum`

### Fase 2: Backend
- [ ] Aplicar @Roles(GERENTE) em controllers operacionais
- [ ] Bloquear GERENTE em plan/payments/super-admin
- [ ] Implementar anti-elevação no FuncionarioService
- [ ] Adicionar auditoria de mudança de cargo

### Fase 3: Frontend
- [ ] Adicionar GERENTE ao tipo funcionario.ts
- [ ] Adicionar GERENTE ao dropdown de cargos
- [ ] Filtrar roles visíveis conforme permissão do usuário

### Fase 4: Testes
- [ ] Criar testes E2E para permissões
- [ ] Testar multi-tenant isolation

### Fase 5: Documentação
- [ ] Criar PERMISSOES.md
- [ ] Atualizar SEGURANCA.md

---

## 6. Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `backend/src/database/migrations/` | Nova migration |
| `backend/src/modulos/funcionario/funcionario.service.ts` | Anti-elevação |
| `backend/src/modulos/funcionario/funcionario.controller.ts` | @Roles |
| `backend/src/modulos/pedido/pedido.controller.ts` | @Roles |
| `backend/src/modulos/comanda/comanda.controller.ts` | @Roles |
| `backend/src/modulos/mesa/mesa.controller.ts` | @Roles |
| `backend/src/modulos/produto/produto.controller.ts` | @Roles |
| `backend/src/modulos/cliente/cliente.controller.ts` | @Roles |
| `backend/src/modulos/ambiente/ambiente.controller.ts` | @Roles |
| `backend/src/modulos/ponto-entrega/ponto-entrega.controller.ts` | @Roles |
| `backend/src/modulos/evento/evento.controller.ts` | @Roles |
| `backend/src/modulos/turno/turno.controller.ts` | @Roles |
| `frontend/src/types/funcionario.ts` | Adicionar GERENTE |
| `frontend/src/components/funcionarios/FuncionarioFormDialog.tsx` | Dropdown + filtro |
| `docs/current/PERMISSOES.md` | Novo arquivo |
| `docs/current/SEGURANCA.md` | Atualizar |

---

**Status:** Auditoria concluída. Iniciando implementação.
