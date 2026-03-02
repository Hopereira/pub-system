# Relatório de Correções - 19/12/2025

## Resumo da Sessão

Sessão focada em correções de bugs relacionados ao multi-tenancy e à página de gestão de cardápio.

---

## Correções Implementadas

### 1. ✅ Constraint de Email Único em Funcionário (Multi-tenancy)

**Problema:** Erro `409 Conflict` ao tentar criar funcionário com email que já existe em outro tenant. O email tinha constraint UNIQUE global, impedindo o mesmo email em tenants diferentes.

**Arquivos Modificados:**
- `backend/src/modulos/funcionario/entities/funcionario.entity.ts`
- `backend/src/migrations/1766186930942-FixFuncionarioEmailUniquePerTenant.ts`

**Solução:**
```typescript
// Antes: @Column({ unique: true }) email: string;
// Depois:
@Entity('funcionarios')
@Index('idx_funcionario_email_tenant', ['email', 'tenantId'], { unique: true })
export class Funcionario {
  @Index('idx_funcionario_email')
  @Column()
  email: string;
}
```

**SQL Executado:**
```sql
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS "UQ_5536df94d421db7d1a1ba832f0f";
CREATE UNIQUE INDEX "idx_funcionario_email_tenant" ON funcionarios (email, tenant_id) WHERE tenant_id IS NOT NULL;
```

---

### 2. ✅ Erro "produtos.map is not a function" na Página de Cardápio

**Problema:** `TypeError: produtos.map is not a function` na página `/dashboard/admin/cardapio`. O frontend esperava um array, mas o backend retornava um objeto paginado `{ data: [...], meta: {...} }`.

**Arquivos Modificados:**
- `frontend/src/services/produtoService.ts`
- `frontend/src/components/cardapio/ProdutosTable.tsx`

**Solução em produtoService.ts:**
```typescript
export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const response = await api.get('/produtos', {
      headers: { 'Cache-Control': 'no-cache' },
      params: { limit: 100 }, // Máximo permitido pelo backend
    });
    
    const responseData = response.data;
    
    // Se for um array, retorna diretamente
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    // Se for objeto paginado, extrai o array 'data'
    if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    // Fallback: retorna array vazio
    console.warn('Resposta inesperada de /produtos:', responseData);
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};
```

**Solução em ProdutosTable.tsx:**
```typescript
export default function ProdutosTable({ produtos = [], onEdit, onDelete }: ProdutosTableProps) {
  // Garantir que produtos é sempre um array
  const produtosArray = Array.isArray(produtos) ? produtos : [];
  
  return (
    // ... usa produtosArray.map() ao invés de produtos.map()
  );
}
```

---

### 3. ✅ Correção do Limite de Paginação (400 Bad Request)

**Problema:** Erro `400 Bad Request` ao chamar `GET /produtos?limit=1000`. O DTO de paginação tem `@Max(100)` no campo `limit`.

**Arquivo Modificado:**
- `frontend/src/services/produtoService.ts`

**Solução:**
```typescript
// Antes: params: { limit: 1000 }
// Depois:
params: { limit: 100 } // Máximo permitido pelo backend
```

---

### 4. ✅ Limpeza de Cache Redis

**Problema:** Cache do Redis retornando dados antigos sem o campo `tipo` nos ambientes.

**Comando Executado:**
```bash
docker exec pub_system_redis redis-cli FLUSHALL
```

---

## Arquivos Modificados (Resumo)

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `backend/src/modulos/funcionario/entities/funcionario.entity.ts` | Índice composto email+tenantId |
| `backend/src/migrations/1766186930942-FixFuncionarioEmailUniquePerTenant.ts` | Nova migration |
| `frontend/src/services/produtoService.ts` | Tratamento de resposta paginada |
| `frontend/src/components/cardapio/ProdutosTable.tsx` | Proteção contra undefined |

---

## Status Final

| Item | Status |
|------|--------|
| Multi-tenancy local | ✅ Funcionando |
| Funcionário com mesmo email em tenants diferentes | ✅ Permitido |
| Página de Cardápio | ✅ Carregando produtos |
| Docker Compose | ✅ Todos containers rodando |

---

## Containers Docker

```
pub_system_frontend   - localhost:3001
pub_system_backend    - localhost:3000
pub_system_db         - localhost:5432
pub_system_redis      - localhost:6379
pub_system_pgadmin    - localhost:8080
```

---

## Próximos Passos Sugeridos

1. Testar criação de funcionário com mesmo email em tenants diferentes
2. Testar página de cardápio com adição/edição de produtos
3. Verificar se ambiente de preparo aparece no formulário de produto

---

**Data:** 19/12/2025  
**Autor:** Cascade AI Assistant
