# Matriz de Permissões - Pub System

**Versão:** 1.0  
**Data:** 2026-02-11  
**Status:** Documento oficial de referência

---

## 1. Hierarquia de Roles

```
SUPER_ADMIN (Plataforma)
    └── ADMIN (Tenant)
        └── GERENTE (Supervisão)
            └── CAIXA / GARCOM / COZINHEIRO / BARTENDER (Operacional)
```

---

## 2. Definição de Roles

| Role | Escopo | Descrição |
|------|--------|-----------|
| **SUPER_ADMIN** | Plataforma | Acesso total a todos os tenants. Gerencia planos, assinaturas, tenants. |
| **ADMIN** | Tenant | Dono/administrador do estabelecimento. Acesso total ao próprio tenant. |
| **GERENTE** | Tenant | Supervisão operacional. Relatórios, pedidos, comandas. Sem configurações admin. |
| **CAIXA** | Tenant | Operações financeiras. Abertura/fechamento de caixa, pagamentos. |
| **GARCOM** | Tenant | Atendimento. Pedidos, comandas, mesas. |
| **COZINHEIRO** | Tenant | Preparo. Visualiza e atualiza status de pedidos. |
| **COZINHA** | Tenant | Alias para COZINHEIRO (compatibilidade). |
| **BARTENDER** | Tenant | Preparo de bebidas. Similar a COZINHEIRO. |

---

## 3. Matriz de Permissões por Módulo

### 3.1 Módulos Operacionais

| Ação | SUPER_ADMIN | ADMIN | GERENTE | CAIXA | GARCOM | COZINHEIRO |
|------|:-----------:|:-----:|:-------:|:-----:|:------:|:----------:|
| **Pedidos** |
| Criar pedido | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Listar pedidos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Atualizar status item | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Cancelar pedido | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Deletar pedido | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Comandas** |
| Abrir comanda | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Listar comandas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Fechar comanda | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deletar comanda | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Mesas** |
| Listar mesas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Criar/editar mesa | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Alterar status mesa | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Deletar mesa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Produtos** |
| Listar produtos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar/editar produto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Deletar produto | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Clientes** |
| Listar clientes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Criar/editar cliente | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Deletar cliente | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.2 Módulos Financeiros

| Ação | SUPER_ADMIN | ADMIN | GERENTE | CAIXA | GARCOM | COZINHEIRO |
|------|:-----------:|:-----:|:-------:|:-----:|:------:|:----------:|
| **Caixa** |
| Abrir caixa | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fechar caixa | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sangria | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Suprimento | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Relatório vendas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Turno** |
| Listar turnos | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Criar/editar turno | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.3 Módulos de Analytics

| Ação | SUPER_ADMIN | ADMIN | GERENTE | CAIXA | GARCOM | COZINHEIRO |
|------|:-----------:|:-----:|:-------:|:-----:|:------:|:----------:|
| Relatório geral pedidos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tempos de pedidos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Performance garçons | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Performance ambientes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Produtos mais vendidos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ranking garçons | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 3.4 Módulos Administrativos

| Ação | SUPER_ADMIN | ADMIN | GERENTE | CAIXA | GARCOM | COZINHEIRO |
|------|:-----------:|:-----:|:-------:|:-----:|:------:|:----------:|
| **Funcionários** |
| Listar funcionários | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar funcionário | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar funcionário | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deletar funcionário | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Empresa** |
| Ver dados empresa | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar empresa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ambientes** |
| Listar ambientes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar/editar ambiente | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deletar ambiente | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Módulos de Plataforma (PROIBIDO para GERENTE)

| Ação | SUPER_ADMIN | ADMIN | GERENTE | Outros |
|------|:-----------:|:-----:|:-------:|:------:|
| **Planos** |
| Listar planos | ✅ | ✅ | ❌ | ❌ |
| Gerenciar planos | ✅ | ❌ | ❌ | ❌ |
| **Pagamentos** |
| Ver pagamentos | ✅ | ✅ | ❌ | ❌ |
| Processar pagamentos | ✅ | ✅ | ❌ | ❌ |
| **Super Admin** |
| Gerenciar tenants | ✅ | ❌ | ❌ | ❌ |
| Setup inicial | ✅ | ❌ | ❌ | ❌ |

---

## 4. Regras de Anti-Elevação

### 4.1 Criação de Funcionários

| Criador | Pode criar |
|---------|------------|
| SUPER_ADMIN | Qualquer role |
| ADMIN | ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO, BARTENDER |
| GERENTE | ❌ Não pode criar funcionários |

### 4.2 Edição de Cargo

| Editor | Pode promover para |
|--------|-------------------|
| SUPER_ADMIN | Qualquer role |
| ADMIN | Até ADMIN (não pode criar SUPER_ADMIN) |
| GERENTE | ❌ Não pode alterar cargos |

### 4.3 Regras Obrigatórias

1. **GERENTE nunca pode:**
   - Criar funcionários
   - Alterar cargo de funcionários
   - Atribuir ADMIN ou SUPER_ADMIN
   - Acessar módulos de planos/pagamentos

2. **ADMIN nunca pode:**
   - Criar SUPER_ADMIN
   - Acessar dados de outros tenants

3. **Auditoria obrigatória:**
   - Toda mudança de cargo deve ser logada
   - Log deve conter: actor, target, cargo_anterior, cargo_novo, timestamp

---

## 5. Multi-Tenancy

### 5.1 Isolamento de Dados

| Role | Acesso a dados |
|------|----------------|
| SUPER_ADMIN | Todos os tenants |
| ADMIN | Apenas próprio tenant |
| GERENTE | Apenas próprio tenant |
| Operacionais | Apenas próprio tenant |

### 5.2 Validações

- Todo request deve incluir `tenantId` no JWT
- Backend valida `tenantId` em todas as queries
- GERENTE de tenant A não pode ver dados de tenant B

---

## 6. Implementação Técnica

### 6.1 Backend

```typescript
// Decorator para rotas
@Roles(Cargo.ADMIN, Cargo.GERENTE)

// Constantes auxiliares
import { ROLES_GERENCIAIS } from './enums/cargo.enum';
// ROLES_GERENCIAIS = [SUPER_ADMIN, ADMIN, GERENTE]
```

### 6.2 Frontend

```typescript
// Helper para verificar permissão
import { hasRole, isGerencialRole } from '@/types/auth';

if (isGerencialRole(user)) {
  // Mostrar menu de supervisão
}
```

---

## 7. Changelog

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-02-11 | 1.0 | Documento inicial com matriz completa |

---

**Este documento é a fonte única de verdade para permissões do sistema.**
