# [F6] Admin SaaS - Painel do Dono da Plataforma

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Implementação do painel administrativo SaaS para gestão da plataforma:

1. **F6.1 - Frontend Super Admin**: Interface visual para criar tenants
2. **F6.2 - Gestão de Planos**: Bloqueio de features por plano

---

## 🖥️ F6.1 - Frontend Super Admin

### Página `/super-admin`

Interface completa para o dono da plataforma:

- **Métricas Globais**: Total de bares, pedidos hoje, faturamento, MRR
- **Status dos Tenants**: Ativos, Trial, Suspensos, Inativos
- **Distribuição por Plano**: FREE, BASIC, PRO, ENTERPRISE
- **Lista de Tenants**: Busca, filtros, ações rápidas
- **Criar Novo Tenant**: Modal com validação de slug

### Ações Disponíveis

| Ação | Descrição |
|------|-----------|
| 👁️ Ver Detalhes | Abre página de detalhes do tenant |
| ⬆️ Alterar Plano | Muda o plano do tenant |
| ✅ Reativar | Reativa tenant suspenso |
| 🚫 Suspender | Suspende tenant (com motivo) |

### Criar Novo Tenant

O modal de criação inclui:
- Nome e slug (com validação de disponibilidade)
- Plano inicial
- CNPJ e telefone (opcionais)
- Dados do admin inicial (nome, email, senha)

---

## 🔐 F6.2 - Gestão de Planos

### Features por Plano

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|:----:|:-----:|:---:|:----------:|
| Pedidos | ✅ | ✅ | ✅ | ✅ |
| Comandas | ✅ | ✅ | ✅ | ✅ |
| Mesas | ✅ | ✅ | ✅ | ✅ |
| Produtos | ✅ | ✅ | ✅ | ✅ |
| Funcionários | ✅ | ✅ | ✅ | ✅ |
| Clientes | ❌ | ✅ | ✅ | ✅ |
| Avaliações | ❌ | ✅ | ✅ | ✅ |
| Eventos | ❌ | ✅ | ✅ | ✅ |
| Pontos de Entrega | ❌ | ✅ | ✅ | ✅ |
| **Analytics** | ❌ | ❌ | ✅ | ✅ |
| Relatórios Avançados | ❌ | ❌ | ✅ | ✅ |
| Medalhas | ❌ | ❌ | ✅ | ✅ |
| Turnos | ❌ | ❌ | ✅ | ✅ |
| Caixa Avançado | ❌ | ❌ | ✅ | ✅ |
| API Externa | ❌ | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ❌ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |
| Multi-Unidade | ❌ | ❌ | ❌ | ✅ |

### Limites por Plano

| Limite | FREE | BASIC | PRO | ENTERPRISE |
|--------|:----:|:-----:|:---:|:----------:|
| Mesas | 10 | 30 | 100 | ∞ |
| Funcionários | 5 | 15 | 50 | ∞ |
| Produtos | 50 | 200 | 1000 | ∞ |
| Ambientes | 3 | 5 | 10 | ∞ |
| Eventos | 0 | 5 | 20 | ∞ |
| Storage | 1 GB | 5 GB | 20 GB | 100 GB |

---

## 💻 Uso no Backend

### Decorator @RequireFeature

```typescript
import { RequireFeature, Feature } from '@/common/tenant';

@Controller('analytics')
export class AnalyticsController {
  
  @Get('dashboard')
  @RequireFeature(Feature.ANALYTICS)
  getDashboard() {
    // Só acessível para PRO+
  }
}
```

### PlanFeaturesService

```typescript
import { PlanFeaturesService, Feature } from '@/common/tenant';

@Injectable()
export class MesaService {
  constructor(private planFeatures: PlanFeaturesService) {}

  async create(dto: CreateMesaDto, plano: string, currentCount: number) {
    // Verificar limite
    this.planFeatures.requireLimit(plano, 'maxMesas', currentCount);
    
    // Criar mesa...
  }
}
```

---

## 💻 Uso no Frontend

### Hook usePlanFeatures

```tsx
import { usePlanFeatures, Feature } from '@/hooks/usePlanFeatures';

function AnalyticsPage() {
  const { hasFeature, currentPlan, isPro } = usePlanFeatures();

  if (!hasFeature(Feature.ANALYTICS)) {
    return <UpgradePrompt />;
  }

  return <AnalyticsDashboard />;
}
```

### Componente FeatureGate

```tsx
import { FeatureGate, Feature } from '@/hooks/usePlanFeatures';

function Sidebar() {
  return (
    <nav>
      <Link href="/pedidos">Pedidos</Link>
      
      <FeatureGate feature={Feature.ANALYTICS}>
        <Link href="/analytics">Analytics</Link>
      </FeatureGate>
    </nav>
  );
}
```

---

## 📁 Arquivos Criados

### Backend
- `backend/src/common/tenant/services/plan-features.service.ts`
- `backend/src/common/tenant/guards/feature.guard.ts`
- `backend/src/common/tenant/controllers/plan-features.controller.ts`

### Frontend
- `frontend/src/services/superAdminService.ts`
- `frontend/src/app/(protected)/super-admin/page.tsx`
- `frontend/src/hooks/usePlanFeatures.ts`

---

## 🔌 Endpoints

### Super Admin
```
GET  /super-admin/metrics
GET  /super-admin/tenants
GET  /super-admin/tenants/:id
POST /super-admin/tenants
POST /super-admin/tenants/:id/suspend
POST /super-admin/tenants/:id/reactivate
PATCH /super-admin/tenants/:id/plan
GET  /super-admin/slugs/:slug/available
```

### Plan Features
```
GET /plan/features   # Features do plano atual
GET /plan/compare    # Comparação entre planos
```

---

## ✅ Critérios de Aceitação

### F6.1 - Frontend Super Admin
| Critério | Status |
|----------|--------|
| Página /super-admin | ✅ |
| Métricas globais | ✅ |
| Lista de tenants | ✅ |
| Busca e filtros | ✅ |
| Modal criar tenant | ✅ |
| Validação de slug | ✅ |
| Suspender/Reativar | ✅ |
| Alterar plano | ✅ |

### F6.2 - Gestão de Planos
| Critério | Status |
|----------|--------|
| PlanFeaturesService | ✅ |
| Features por plano | ✅ |
| Limites por plano | ✅ |
| @RequireFeature decorator | ✅ |
| FeatureGuard | ✅ |
| Endpoint /plan/features | ✅ |
| Hook usePlanFeatures | ✅ |
| Componente FeatureGate | ✅ |

---

## 🚀 Próximos Passos

1. Aplicar `@RequireFeature` nos controllers existentes
2. Usar `FeatureGate` no Sidebar para esconder links
3. Criar página de upgrade de plano
4. Integrar com gateway de pagamento
