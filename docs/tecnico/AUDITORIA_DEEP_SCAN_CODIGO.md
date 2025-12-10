# AUDITORIA DEEP SCAN - PUB SYSTEM
**Data:** 09/12/2025  
**Última Atualização:** 09/12/2025 - Correções Implementadas  
**Tipo:** Varredura completa de código-fonte (sem documentação .md)  
**Escopo:** Frontend (Next.js 15), Backend (NestJS 10), Banco de Dados (PostgreSQL)

---

## 1. VISÃO GERAL DA INTEGRIDADE

### 1.1 Conectividade Ponta-a-Ponta
| Camada | Status | Observação |
|--------|--------|------------|
| Frontend → Backend | ✅ OK | Axios configurado com retry, timeout 30s, interceptors |
| Backend → Database | ✅ OK | TypeORM com migrations, entities sincronizadas |
| WebSocket | ✅ OK | Socket.io com CORS configurado via env |

### 1.2 Pontos Críticos Identificados

| Severidade | Quantidade | Descrição |
|------------|------------|-----------|
| 🔴 CRÍTICO | 3 | Segurança e integridade |
| 🟠 MÉDIO | 8 | Código morto, duplicações, más práticas |
| 🟡 BAIXO | 12 | Melhorias e otimizações |

---

## 2. ARQUIVOS DUPLICADOS OU REDUNDANTES

### 2.1 Serviços Duplicados/Redundantes

| Arquivo | Problema | Sugestão |
|---------|----------|----------|
| `frontend/src/services/authService.ts` | Usa `axios` diretamente em vez de `api.ts` | Refatorar para usar instância centralizada |
| `frontend/src/services/firstAccessService.ts` | Usa `fetch` nativo em vez de `api.ts` | Migrar para axios/api.ts |

### 2.2 Funções Obsoletas Identificadas

```
frontend/src/services/pedidoService.ts:124-141
  - updatePedidoStatus() - Marcada como "obsoleta, mantida para compatibilidade"
  
frontend/src/services/caixaService.ts:156-159
  - getCaixaAbertoAtual() - Marcada como @deprecated

backend/src/modulos/caixa/caixa.service.ts:391-402
  - getCaixaAbertoAtual() - Marcada como @deprecated
```

### 2.3 Código Morto Potencial

| Local | Descrição |
|-------|-----------|
| `backend/src/modulos/comanda/dto/finalizar-pedido.dto.ts` | DTO com 5 TODOs, parece não utilizado |
| `backend/src/modulos/caixa/caixa.service.ts:443` | `suprimentos: []` - TODO não implementado |
| `frontend/src/services/caixaService.ts:74-87` | `registrarSuprimento()` - Endpoint não existe no backend |

---

## 3. QUEBRAS DE LIGAÇÃO (FRONT → BACK → DB)

### 3.1 Endpoints Frontend sem Backend Correspondente

| Frontend Service | Endpoint Chamado | Status Backend |
|------------------|------------------|----------------|
| `caixaService.registrarSuprimento()` | `POST /caixa/suprimento` | ❌ NÃO EXISTE |

**Evidência:**
```typescript
// frontend/src/services/caixaService.ts:74-87
async registrarSuprimento(data: {...}): Promise<Suprimento> {
  const response = await api.post('/caixa/suprimento', data);
  return response.data;
}

// backend/src/modulos/caixa/caixa.controller.ts
// NÃO HÁ @Post('suprimento')
```

### 3.2 Colunas Entity vs Migration Inconsistentes

| Entity | Coluna | Migration | Status |
|--------|--------|-----------|--------|
| `Funcionario` | `empresaId`, `ambienteId` | `1760080000000-AddMissingColumns.ts` | ⚠️ Sem FK definida |

**Evidência:**
```typescript
// backend/src/database/migrations/1760080000000-AddMissingColumns.ts:8-12
await queryRunner.query(`
  ALTER TABLE "funcionarios" 
  ADD COLUMN IF NOT EXISTS "empresa_id" UUID,
  ADD COLUMN IF NOT EXISTS "ambiente_id" UUID
`);
// FALTA: ADD CONSTRAINT FOREIGN KEY
```

### 3.3 Enum Inconsistente

| Local | Valores |
|-------|---------|
| `backend/src/database/migrations/1700000000000-InitialSchema.ts:32` | `'FEITO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'` |
| `backend/src/modulos/pedido/enums/pedido-status.enum.ts` | Inclui `QUASE_PRONTO`, `RETIRADO`, `DEIXADO_NO_AMBIENTE` |

**Problema:** Migration inicial não inclui todos os status usados pelo sistema.

---

## 4. SUGESTÕES CRÍTICAS (CORRIGIR AGORA)

### 4.1 ✅ CORRIGIDO: Credenciais Hardcoded na Página de Login

**Arquivo:** `frontend/src/app/(auth)/login/page.tsx:25-26`
```typescript
// ANTES (vulnerável):
const [email, setEmail] = useState("admin@admin.com");
const [password, setPassword] = useState("admin123");

// DEPOIS (corrigido):
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
```

### 4.2 ✅ CORRIGIDO: CORS Hardcoded no main.ts

**Arquivo:** `backend/src/main.ts:26-30`
```typescript
// ANTES (hardcoded):
app.enableCors({
  origin: 'http://localhost:3001',
  ...
});

// DEPOIS (usa variável de ambiente):
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  ...
});
```

### 4.3 ✅ CORRIGIDO: Falta RolesGuard no CaixaController

**Arquivo:** `backend/src/modulos/caixa/caixa.controller.ts`
```typescript
// DEPOIS (com RolesGuard):
@Controller('caixa')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GERENTE)
export class CaixaController {
```

---

## 5. PROBLEMAS DE SEGURANÇA E ROBUSTEZ

### 5.1 Console.log em Produção

**Total encontrado:** 36 ocorrências no frontend

| Arquivo | Ocorrências |
|---------|-------------|
| `MapaPedidos.tsx` | 5 |
| `ConfiguradorMapa.tsx` | 5 |
| `ClienteHubPage.tsx` | 4 |
| `CaixaContext.tsx` | 4 |
| Outros | 18 |

**Recomendação:** Usar `logger.ts` em vez de `console.log` direto.

### 5.2 TODOs e FIXMEs Pendentes

**Total encontrado:** 65 no backend

| Arquivo | Quantidade | Exemplo |
|---------|------------|---------|
| `caixa.controller.ts` | 6 | Implementar suprimentos |
| `pedido.service.ts` | 6 | Melhorias de performance |
| `produto.service.ts` | 6 | Validações adicionais |
| `caixa.service.ts` | 5 | Ajustar integração comandas |

### 5.3 Uso Excessivo de `any`

**Total encontrado:** 119 ocorrências no backend

| Arquivo | Ocorrências |
|---------|-------------|
| `comanda.entity.ts` | 9 |
| `pedido.service.ts` | 7 |
| `ponto-entrega.entity.ts` | 7 |

**Recomendação:** Substituir `any` por tipos específicos.

### 5.4 Tratamento de Erro Inconsistente

**Problema:** Alguns services usam `console.error`, outros usam `logger.error`.

```typescript
// frontend/src/services/comandaService.ts - INCONSISTENTE
console.error('Erro ao abrir comanda:', error); // linha 37
logger.error('Erro ao buscar todas as comandas'...); // linha 14
```

---

## 6. PROBLEMAS DE BANCO DE DADOS

### 6.1 Índices Existentes (OK)

| Migration | Índices Criados |
|-----------|-----------------|
| `CreateRetiradaItensTable` | 12 índices |
| `AddTimestampsAndResponsaveis` | 8 índices |
| `CreateTurnoFuncionarioTable` | 6 índices |
| `AddFluxoGarcomCompleto` | 6 índices |

### 6.2 Tabelas sem Índices em Colunas de Busca

| Tabela | Coluna | Uso | Recomendação |
|--------|--------|-----|--------------|
| `clientes` | `nome` | Busca por nome | CREATE INDEX |
| `comandas` | `status` | Filtro frequente | CREATE INDEX |
| `pedidos` | `status` | Filtro frequente | CREATE INDEX |
| `itens_pedido` | `status` | Filtro frequente | CREATE INDEX |

### 6.3 Foreign Keys Ausentes

| Tabela | Coluna | Referência | Status |
|--------|--------|------------|--------|
| `funcionarios` | `empresa_id` | `empresas.id` | ❌ SEM FK |
| `funcionarios` | `ambiente_id` | `ambientes.id` | ❌ SEM FK |
| `pontos_entrega` | `empresa_id` | `empresas.id` | ❌ SEM FK |

---

## 7. LISTA DE MELHORIAS (LOW-PRIORITY)

### 7.1 Refatorações Recomendadas

1. **Unificar instâncias Axios**
   - `authService.ts` e `firstAccessService.ts` devem usar `api.ts`

2. **Remover código obsoleto**
   - `updatePedidoStatus()` em `pedidoService.ts`
   - `getCaixaAbertoAtual()` (deprecated)

3. **Implementar Suprimentos**
   - Backend: Criar endpoint `POST /caixa/suprimento`
   - Ou remover do frontend se não for necessário

4. **Padronizar tratamento de erros**
   - Usar `logger` em vez de `console.error` em todos os services

### 7.2 Ferramentas/Linters Recomendados

| Ferramenta | Propósito | Configuração |
|------------|-----------|--------------|
| ESLint `no-console` | Bloquear console.log | `"error"` em produção |
| ESLint `@typescript-eslint/no-explicit-any` | Bloquear `any` | `"warn"` |
| Husky + lint-staged | Pre-commit hooks | Lint antes de commit |
| `npm audit` | Vulnerabilidades | CI/CD pipeline |

### 7.3 Scripts de CI Recomendados

```yaml
# .github/workflows/lint.yml
- name: Lint Backend
  run: cd backend && npm run lint

- name: Lint Frontend  
  run: cd frontend && npm run lint

- name: Audit Dependencies
  run: |
    cd backend && npm audit --audit-level=high
    cd ../frontend && npm audit --audit-level=high
```

---

## 8. RESUMO EXECUTIVO

### O que está funcionando bem:
- ✅ Arquitetura modular (NestJS modules)
- ✅ Validação com class-validator
- ✅ Migrations organizadas cronologicamente
- ✅ WebSocket para tempo real
- ✅ Retry logic no frontend
- ✅ Decimal.js para cálculos monetários
- ✅ Lock pessimista para race conditions

### O que precisa de atenção imediata:
- 🔴 Credenciais hardcoded no login
- 🔴 CORS hardcoded no main.ts
- 🔴 Falta RolesGuard no CaixaController
- 🟠 Endpoint suprimento não existe
- 🟠 FKs ausentes em funcionarios
- 🟠 36 console.log em produção

### Estimativa de esforço para correções:

| Prioridade | Itens | Tempo Estimado |
|------------|-------|----------------|
| Crítico | 3 | 30 minutos |
| Médio | 8 | 2 horas |
| Baixo | 12 | 4 horas |

---

**Conclusão:** O sistema está estruturalmente sólido, mas possui 3 vulnerabilidades críticas que devem ser corrigidas antes de ir para produção. As correções são simples e rápidas de implementar.
