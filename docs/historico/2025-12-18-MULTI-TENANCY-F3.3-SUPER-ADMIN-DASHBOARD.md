# [F3.3] Dashboard Super Admin - Gestão da Plataforma

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado (Backend)

---

## 📖 Descrição

Implementação de endpoints para gestão da plataforma pelo Super Admin, permitindo visualizar todos os bares, monitorar faturamento global e suspender acessos de inadimplentes.

---

## 🔐 Segurança

- Todos os endpoints requerem **autenticação JWT**
- Apenas usuários com cargo **SUPER_ADMIN** têm acesso
- Endpoints ignoram o filtro de tenant (`@SkipTenantGuard()`)

---

## 📊 Endpoints

### Métricas Globais

```
GET /super-admin/metrics
```

Retorna:
```json
{
  "totalTenants": 25,
  "tenantsByStatus": {
    "ATIVO": 20,
    "TRIAL": 3,
    "SUSPENSO": 2,
    "INATIVO": 0
  },
  "tenantsByPlano": {
    "FREE": 10,
    "BASIC": 8,
    "PRO": 5,
    "ENTERPRISE": 2
  },
  "pedidosHoje": 1250,
  "comandasAbertas": 45,
  "faturamentoHoje": 15890.50,
  "mrr": 4985
}
```

### Listar Tenants

```
GET /super-admin/tenants
```

Retorna lista com resumo de cada tenant:
- ID, nome, slug, status, plano
- Pedidos hoje, comandas abertas, funcionários ativos

### Detalhes do Tenant

```
GET /super-admin/tenants/:id
```

Retorna dados completos + estatísticas detalhadas.

### Criar Tenant

```
POST /super-admin/tenants
```

Body:
```json
{
  "nome": "Bar do Zé",
  "slug": "bar-do-ze",
  "cnpj": "12.345.678/0001-90",
  "plano": "BASIC",
  "nomeFantasia": "Bar do Zé",
  "adminNome": "José Silva",
  "adminEmail": "jose@bardoze.com",
  "adminSenha": "SenhaSegura123!"
}
```

### Suspender Tenant

```
POST /super-admin/tenants/:id/suspend
```

Body:
```json
{
  "motivo": "Inadimplência - 3 meses sem pagamento"
}
```

### Reativar Tenant

```
POST /super-admin/tenants/:id/reactivate
```

### Alterar Plano

```
PATCH /super-admin/tenants/:id/plan
```

Body:
```json
{
  "plano": "PRO"
}
```

### Verificar Slug

```
GET /super-admin/slugs/:slug/available
```

Retorna:
```json
{
  "slug": "bar-do-ze",
  "available": false,
  "suggestions": ["bar-do-ze-1", "bar-do-ze-2", "bar-do-ze-sp"]
}
```

---

## 💻 Arquivos Criados

### Backend
- `backend/src/common/tenant/services/super-admin.service.ts`
- `backend/src/common/tenant/controllers/super-admin.controller.ts`

### Atualizados
- `backend/src/common/tenant/tenant.module.ts`

---

## 📈 Métricas Calculadas

| Métrica | Descrição |
|---------|-----------|
| **totalTenants** | Total de bares cadastrados |
| **tenantsByStatus** | Distribuição por status |
| **tenantsByPlano** | Distribuição por plano |
| **pedidosHoje** | Pedidos de todos os bares hoje |
| **comandasAbertas** | Comandas abertas em todos os bares |
| **faturamentoHoje** | Soma das comandas fechadas hoje |
| **mrr** | Receita Mensal Recorrente estimada |

### Cálculo do MRR

```typescript
const planoValues = {
  FREE: 0,
  BASIC: 99,
  PRO: 199,
  ENTERPRISE: 499,
};

mrr = Σ (valor_plano × quantidade_tenants)
```

---

## ✅ Critérios de Aceitação

| Critério | Status |
|----------|--------|
| Endpoint de métricas globais | ✅ |
| Listagem de todos os tenants | ✅ |
| Detalhes de tenant específico | ✅ |
| Suspender tenant | ✅ |
| Reativar tenant | ✅ |
| Alterar plano | ✅ |
| Criar novo tenant | ✅ |
| Verificar disponibilidade de slug | ✅ |
| Apenas SUPER_ADMIN acessa | ✅ |

---

## 🚀 Próximos Passos

1. **Frontend:** Criar página `/super-admin` no Next.js
2. **WebSocket:** Deslogar usuários ao suspender tenant
3. **Email:** Notificar admin do tenant sobre suspensão
4. **Billing:** Integrar com gateway de pagamento
