# Sprint 2 — Performance & Otimização

**Branch:** `sprint-2-performance`
**Data:** 2026-04-24

---

## 1. Remoção de `eager: true`

### Problema
Relações com `eager: true` carregavam dados desnecessários em **toda** query, gerando joins implícitos e potenciais N+1 queries. Cada `findOne` em uma comanda gerava 4+ JOINs automáticos.

### Entidades alteradas

| Entidade | Relações removidas | Impacto |
|---|---|---|
| **Comanda** | mesa, cliente, pontoEntrega, paginaEvento | 4 JOINs eliminados por query |
| **Pedido** | itens (OneToMany) | 1 JOIN eliminado |
| **ItemPedido** | produto | 1 JOIN eliminado |
| **Evento** | paginaEvento | 1 JOIN eliminado |
| **TurnoFuncionario** | funcionario, evento | 2 JOINs eliminados |
| **AberturaCaixa** | turnoFuncionario, funcionario | 2 JOINs eliminados |
| **FechamentoCaixa** | aberturaCaixa, turnoFuncionario, funcionario | 3 JOINs eliminados |
| **Sangria** | aberturaCaixa, turnoFuncionario, funcionario | 3 JOINs eliminados |
| **MovimentacaoCaixa** | aberturaCaixa, funcionario | 2 JOINs eliminados |
| **RetiradaItem** | garcom (Funcionario), ambiente | 2 JOINs eliminados |

**Total: ~21 JOINs implícitos eliminados**

### Solução
Todas as relações agora são carregadas explicitamente com `relations: [...]` ou `leftJoinAndSelect` nos services que realmente precisam dos dados.

### Serviços com explicit relations adicionadas/verificadas
- `ComandaService` — já tinha explicit relations em `findAll`, `findOne`, `search`, `fecharComanda`
- `PedidoService` — já tinha explicit relations em `findAll`, `findOne`, `findOnePublic`, `createPedidoGarcom`, `deixarNoAmbiente`, etc.
- `CaixaService` — adicionadas `relations: ['funcionario']` em `getTodosCaixasAbertos`, `getCaixaAbertoPorFuncionario`, `getCaixaAbertoAtual`, `getResumoCaixa`. Adicionados `leftJoinAndSelect` em `getHistoricoFechamentos`.
- `TurnoService` — `getFuncionariosAtivos` já tinha explicit relations
- `EventoService` — já tinha explicit `relations: ['paginaEvento']` em todos os métodos

---

## 2. Cache do FeatureGuard

### Problema
O `FeatureGuard` executava até **4 queries** sequenciais por request:
1. `tenantRepository.findOne(tenantId)` 
2. Fallback: `empresaRepository.findOne(tenantId)` → `tenantRepository.findOne(empresaId)`
3. Fallback: `empresaRepository.findOne(id)` → `tenantRepository.findOne(empresaId)`
4. `planFeaturesService.getFeaturesFromDb(plano)` → `planRepository.findOne(code)`

### Solução
Cache in-memory (Map estático) com TTL de 5 minutos:
- **Cache key:** `tenantId`
- **Cache value:** `{ plano, nome, features[], cachedAt }`
- **Invalidação:** `FeatureGuard.invalidateCache(tenantId?)` — pode invalidar um tenant ou todos

### Impacto
- Requests subsequentes do mesmo tenant: **0 queries** (cache hit)
- Cache miss: queries normais + cache populated
- TTL de 5 min garante que mudanças de plano propagam em no máximo 5 min

### Uso da invalidação
Chamar `FeatureGuard.invalidateCache(tenantId)` ao alterar plano de um tenant via SUPER_ADMIN.

---

## 3. Auditoria de `Scope.REQUEST`

### Resultado
Todos os `Scope.REQUEST` são **necessários** para multi-tenancy:

| Tipo | Quantidade | Justificativa |
|---|---|---|
| `BaseTenantRepository` subclasses | 18 repos | Lêem tenantId do request context para filtrar queries |
| Services que dependem de repos | 8 services | Injetam repos REQUEST-scoped |
| `GcsStorageService` | 1 | Usa `TenantContextService` (opcional) para paths isolados por tenant |

**Conclusão:** Nenhum serviço pode ser convertido a singleton sem quebrar o isolamento de dados multi-tenant. O `GcsStorageService` poderia ser singleton se todos os callers passassem `tenantId` explicitamente, mas o risco de regressão não justifica a mudança neste sprint.

---

## 4. Índices adicionados

| Entidade | Índice | Colunas | Padrão de query |
|---|---|---|---|
| **AberturaCaixa** | `idx_abertura_caixa_status` | status | `getTodosCaixasAbertos` |
| **AberturaCaixa** | `idx_abertura_caixa_funcionario_status` | funcionarioId, status | `getCaixaAbertoPorFuncionario` |
| **Sangria** | `idx_sangria_abertura_caixa` | aberturaCaixaId | `getResumoCaixa` |
| **FechamentoCaixa** | `idx_fechamento_abertura_caixa` | aberturaCaixaId | `getResumoCaixa` |
| **FechamentoCaixa** | `idx_fechamento_data` | dataFechamento | `getHistoricoFechamentos` |
| **MovimentacaoCaixa** | `idx_movimentacao_abertura_tipo` | aberturaCaixaId, tipo | `calcularSaldoAtual`, relatórios |
| **Pedido** | `idx_pedido_status` | status | `findAll` com filtro de status |

### Índices já existentes (mantidos)
- `idx_comanda_status`, `idx_comanda_data_abertura`
- `idx_pedido_data`
- `idx_item_pedido_status`
- `idx_turno_funcionario_ativo` (funcionarioId, ativo)
- `idx_movimentacao_data`
- Índices compostos de unicidade (mesa, funcionario, cliente, ambiente, empresa)

---

## 5. Pontos ainda críticos

1. **N+1 em `createPedidoGarcom`**: Cada item faz `findOne` individual para o produto (linhas 282-284 do `pedido.service.ts`). Poderia ser otimizado com batch `findByIds` como no `create`.
2. **Cache de pedidos (`findAll`)**: Já implementado com TTL de 2 min, mas invalidação pode ser melhorada.
3. **GcsStorageService como REQUEST scope**: Funcional mas cria nova instância do `Storage` client a cada request. Considerar refactor futuro.

---

## Rollback

Todas as alterações são **retrocompatíveis**:
- Remover `eager: true` + adicionar `relations` explícitas = mesmo resultado, sem breaking changes
- Cache do FeatureGuard: pode ser desabilitado setando TTL para 0
- Índices: podem ser removidos sem impacto funcional (apenas performance)
