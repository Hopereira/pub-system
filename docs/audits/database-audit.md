# Auditoria de Banco de Dados — Pub System

**Data:** 2026-03-06
**Auditor:** Arquiteto de Software (PostgreSQL, TypeORM, Multi-Tenant)
**Escopo:** Todas as entidades, migrations, indices, FKs, scripts SQL, documentacao
**Metodo:** Leitura de todas as 31 entity files, migrations, data-source, seeder, scripts SQL

---

## 1. Inventario Completo de Tabelas

### 1.1 Tabelas Operacionais (26) — com tenant_id

| # | Tabela | Entity | tenant_id | nullable | FK Tenant | Indice tenant_id |
|---|--------|--------|-----------|----------|-----------|-----------------|
| 1 | `ambientes` | Ambiente | SIM | **true** | NAO | `idx_ambiente_tenant_id` |
| 2 | `funcionarios` | Funcionario | SIM | **true** | NAO | `idx_funcionario_tenant_id` |
| 3 | `mesas` | Mesa | SIM | **true** | NAO | `idx_mesa_tenant_id` |
| 4 | `produtos` | Produto | SIM | **true** | NAO | `idx_produto_tenant_id` |
| 5 | `clientes` | Cliente | SIM | **true** | NAO | `idx_cliente_tenant_id` |
| 6 | `comandas` | Comanda | SIM | **true** | NAO | `idx_comanda_tenant_id` |
| 7 | `comanda_agregados` | ComandaAgregado | SIM | **true** | NAO | `idx_comanda_agregado_tenant_id` |
| 8 | `pedidos` | Pedido | SIM | **true** | NAO | `idx_pedido_tenant_id` |
| 9 | `itens_pedido` | ItemPedido | SIM | **true** | NAO | `idx_item_pedido_tenant_id` |
| 10 | `retiradas_itens` | RetiradaItem | SIM | **true** | NAO | `idx_retirada_item_tenant_id` |
| 11 | `empresas` | Empresa | SIM | **true** | NAO | `idx_empresa_tenant_id` |
| 12 | `eventos` | Evento | SIM | **true** | NAO | `idx_evento_tenant_id` |
| 13 | `paginas_evento` | PaginaEvento | SIM | **true** | NAO | `idx_pagina_evento_tenant_id` |
| 14 | `pontos_entrega` | PontoEntrega | SIM | **true** | NAO | `idx_ponto_entrega_tenant_id` |
| 15 | `aberturas_caixa` | AberturaCaixa | SIM | **true** | NAO | `idx_abertura_caixa_tenant_id` |
| 16 | `fechamentos_caixa` | FechamentoCaixa | SIM | **true** | NAO | `idx_fechamento_caixa_tenant_id` |
| 17 | `movimentacoes_caixa` | MovimentacaoCaixa | SIM | **true** | NAO | `idx_movimentacao_caixa_tenant_id` |
| 18 | `sangrias` | Sangria | SIM | **true** | NAO | `idx_sangria_tenant_id` |
| 19 | `avaliacoes` | Avaliacao | SIM | **true** | NAO | `idx_avaliacao_tenant_id` |
| 20 | `turnos_funcionario` | TurnoFuncionario | SIM | **true** | NAO | `idx_turno_funcionario_tenant_id` |
| 21 | `medalhas` | Medalha | SIM | **true** | NAO | `idx_medalha_tenant_id` |
| 22 | `medalhas_garcons` | MedalhaGarcom | SIM | **true** | NAO | `idx_medalha_garcom_tenant_id` |
| 23 | `audit_logs` | AuditLog | SIM | **true** | NAO | `idx_audit_log_tenant_id` |
| 24 | `layouts_estabelecimento` | LayoutEstabelecimento | SIM | **true** | NAO | `idx_layout_estabelecimento_tenant_id` |
| 25 | `subscriptions` | Subscription | SIM | **false** | SIM (CASCADE) | — (auto FK) |
| 26 | `payment_transactions` | PaymentTransaction | SIM | **false** | NAO | — |

### 1.2 Tabelas Globais (4) — sem tenant_id

| # | Tabela | Entity | Motivo |
|---|--------|--------|--------|
| 1 | `tenants` | Tenant | E o proprio tenant |
| 2 | `plans` | Plan | Planos sao globais da plataforma |
| 3 | `payment_configs` | PaymentConfig | Config de gateways global |
| 4 | `refresh_tokens` | RefreshToken | Vinculado a funcionario; tem tenantId separado (nullable) |

### 1.3 Entidade Abstrata (nao gera tabela)

| Entity | Arquivo | Descricao |
|--------|---------|-----------|
| TenantAwareEntity | `tenant-aware.entity.ts` | Classe base com tenant_id NOT NULL + FK CASCADE — **NAO USADA por nenhuma entidade** |

### 1.4 Tabela TypeORM interna

| Tabela | Descricao |
|--------|-----------|
| `migrations` | Controle de migrations executadas |

---

## 2. Problemas de tenant_id

### 2.1 CRITICO — Todas as 24 tabelas operacionais tem tenant_id NULLABLE

```typescript
// Padrao encontrado em TODAS as entidades (exceto Subscription/PaymentTransaction):
@Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
tenantId: string;
```

**Impacto:** O banco permite inserir registros SEM tenant_id. A integridade depende 100% da aplicacao.

### 2.2 CRITICO — NENHUMA tabela tem FK para tenants

Das 24 tabelas com tenant_id nullable, **ZERO** tem foreign key para `tenants(id)`. Apenas `subscriptions` tem FK com CASCADE.

**Impacto:** Se um tenant for deletado, os dados orfaos permanecem em todas as 24 tabelas.

### 2.3 CRITICO — TenantAwareEntity NAO e usada

A classe base `TenantAwareEntity` define `tenant_id NOT NULL + FK CASCADE` corretamente, mas **nenhuma entidade a herda**. Todas as entidades definem `tenant_id` manualmente como `nullable: true` sem FK.

### 2.4 ALTO — empresaId legado em 2 entidades

| Tabela | Coluna | FK | onDelete |
|--------|--------|----|----------|
| `funcionarios` | `empresa_id` | SIM → empresas | SET NULL |
| `pontos_entrega` | `empresa_id` | SIM → empresas | CASCADE |

Essas colunas coexistem com `tenant_id`, criando ambiguidade.

### 2.5 ALTO — Cliente.cpf e UNIQUE global

```typescript
// cliente.entity.ts:24
@Column({ unique: true, length: 14 })
cpf: string;
```

**Impacto:** Dois tenants diferentes NAO podem ter o mesmo cliente (mesmo CPF). Em um SaaS real, o CPF deveria ser unique **per tenant** (indice composto `[cpf, tenantId]`), nao globalmente unique.

---

## 3. Tabelas que Podem Vazar Dados

### 3.1 Schedulers com queries cross-tenant (sem WHERE tenant_id)

| Scheduler | Tabela | Query | Risco |
|-----------|--------|-------|-------|
| `QuaseProntoScheduler` | `itens_pedido` | `find({ where: { status: EM_PREPARO } })` | CRITICO — processa itens de todos os tenants |
| `QuaseProntoScheduler` | `itens_pedido` | `createQueryBuilder` sem tenant | ALTO — media de tempo cross-tenant |
| `MedalhaScheduler` | `funcionarios` | `find({ where: { cargo: GARCOM } })` | ALTO — processa garcons de todos os tenants |

### 3.2 Tabelas sem FK tenant que podem ter orfaos

Se `synchronize: true` cria as tabelas sem as FKs de tenant, qualquer INSERT pode gerar dados sem tenant_id associado a um tenant valido.

### 3.3 refresh_tokens — tenantId nullable

O campo `tenantId` em `refresh_tokens` e nullable. Tokens antigos criados antes da implementacao multi-tenant podem nao ter tenant associado.

---

## 4. Indices e Performance

### 4.1 Indices Existentes (por categoria)

#### Indices de tenant_id (24) — Todos B-Tree simples

Todas as 24 tabelas operacionais tem indice simples em `tenant_id`. Isso e adequado para filtros de igualdade.

#### Indices Compostos (5)

| Tabela | Indice | Colunas | Tipo |
|--------|--------|---------|------|
| `ambientes` | `idx_ambiente_nome_tenant` | `[nome, tenantId]` | UNIQUE |
| `funcionarios` | `idx_funcionario_email_tenant` | `[email, tenantId]` | UNIQUE |
| `turnos_funcionario` | `idx_turno_funcionario_ativo` | `[funcionarioId, ativo]` | B-Tree |
| `audit_logs` | (auto) | `[funcionario, createdAt]` | B-Tree |
| `audit_logs` | (auto) | `[entityName, entityId]` | B-Tree |

#### Indices de Busca (8)

| Tabela | Indice | Coluna |
|--------|--------|--------|
| `funcionarios` | `idx_funcionario_email` | `email` |
| `clientes` | `idx_cliente_cpf` | `cpf` |
| `comandas` | `idx_comanda_status` | `status` |
| `comandas` | `idx_comanda_data_abertura` | `dataAbertura` |
| `pedidos` | `idx_pedido_data` | `data` |
| `itens_pedido` | `idx_item_pedido_status` | `status` |
| `movimentacoes_caixa` | `idx_movimentacao_data` | `data` |
| `audit_logs` | (auto) | `[action, createdAt]` |

#### Indices UNIQUE (5)

| Tabela | Colunas |
|--------|---------|
| `tenants` | `slug` |
| `empresas` | `slug`, `cnpj` |
| `plans` | `code` |
| `ambientes` | `[nome, tenantId]` |
| `funcionarios` | `[email, tenantId]` |

### 4.2 Problemas de Performance

#### FALTAM indices compostos criticos

| Tabela | Indice Faltando | Motivo |
|--------|----------------|--------|
| `pedidos` | `[tenantId, data]` | Relatorios por periodo filtram por tenant + data |
| `comandas` | `[tenantId, status]` | Busca de comandas abertas por tenant |
| `itens_pedido` | `[tenantId, status]` | Cozinha filtra por tenant + status |
| `movimentacoes_caixa` | `[tenantId, data]` | Relatorios financeiros por tenant + periodo |
| `audit_logs` | `[tenantId, createdAt]` | Logs por tenant e periodo |
| `funcionarios` | `[tenantId, cargo]` | Busca de garcons/caixa por tenant |
| `turnos_funcionario` | `[tenantId, funcionarioId, ativo]` | Turno ativo por funcionario+tenant |

#### Indices desnecessarios/redundantes

| Tabela | Indice | Motivo |
|--------|--------|--------|
| `funcionarios` | `idx_funcionario_email` | Redundante — ja existe `idx_funcionario_email_tenant` |

#### UNIQUE constraint incorreta

| Tabela | Constraint | Problema |
|--------|-----------|----------|
| `clientes` | `cpf UNIQUE` | Deveria ser `[cpf, tenantId]` — impede mesmo CPF em tenants diferentes |
| `mesas` | `[numero, ambiente]` | Correto para scope de ambiente, mas nao inclui tenant |

---

## 5. Integridade Referencial

### 5.1 Mapa de FKs

| Tabela Origem | Coluna FK | Tabela Destino | onDelete |
|---------------|----------|----------------|----------|
| **funcionarios** | empresa_id | empresas | SET NULL |
| **funcionarios** | ambiente_id | ambientes | SET NULL |
| **mesas** | ambiente_id | ambientes | (default) |
| **produtos** | ambienteId | ambientes | (default) |
| **clientes** | ambiente_id | ambientes | SET NULL |
| **clientes** | ponto_entrega_id | pontos_entrega | SET NULL |
| **comandas** | mesa → mesas | mesas | (default) |
| **comandas** | cliente → clientes | clientes | (default) |
| **comandas** | ponto_entrega_id | pontos_entrega | (default) |
| **comandas** | criado_por_id | funcionarios | SET NULL |
| **comanda_agregados** | comanda_id | comandas | CASCADE |
| **pedidos** | comandaId | comandas | (default) |
| **pedidos** | criado_por_id | funcionarios | SET NULL |
| **pedidos** | entregue_por_id | funcionarios | SET NULL |
| **itens_pedido** | pedidoId | pedidos | CASCADE |
| **itens_pedido** | produtoId | produtos | SET NULL |
| **itens_pedido** | ambiente_retirada_id | ambientes | SET NULL |
| **itens_pedido** | retirado_por_garcom_id | funcionarios | SET NULL |
| **itens_pedido** | garcom_entrega_id | funcionarios | SET NULL |
| **retiradas_itens** | item_pedido_id | itens_pedido | CASCADE |
| **retiradas_itens** | garcom_id | funcionarios | CASCADE |
| **retiradas_itens** | ambiente_id | ambientes | CASCADE |
| **pontos_entrega** | empresa_id | empresas | CASCADE |
| **pontos_entrega** | mesa_proxima_id | mesas | SET NULL |
| **pontos_entrega** | ambiente_atendimento_id | ambientes | RESTRICT |
| **pontos_entrega** | ambiente_preparo_id | ambientes | RESTRICT |
| **eventos** | paginaEvento → paginas_evento | paginas_evento | (default) |
| **aberturas_caixa** | turno_funcionario_id | turnos_funcionario | CASCADE |
| **aberturas_caixa** | funcionario_id | funcionarios | CASCADE |
| **fechamentos_caixa** | abertura_caixa_id | aberturas_caixa | (default) |
| **fechamentos_caixa** | turno_funcionario_id | turnos_funcionario | CASCADE |
| **fechamentos_caixa** | funcionario_id | funcionarios | CASCADE |
| **sangrias** | abertura_caixa_id | aberturas_caixa | (default) |
| **sangrias** | turno_funcionario_id | turnos_funcionario | CASCADE |
| **sangrias** | funcionario_id | funcionarios | CASCADE |
| **movimentacoes_caixa** | abertura_caixa_id | aberturas_caixa | (default) |
| **movimentacoes_caixa** | funcionario_id | funcionarios | CASCADE |
| **avaliacoes** | comandaId | comandas | (default) |
| **avaliacoes** | clienteId | clientes | (default) |
| **turnos_funcionario** | funcionario_id | funcionarios | CASCADE |
| **turnos_funcionario** | evento_id | eventos | (default) |
| **medalhas_garcons** | funcionario_id | funcionarios | CASCADE |
| **medalhas_garcons** | medalha_id | medalhas | CASCADE |
| **layouts_estabelecimento** | ambiente_id | ambientes | (default) |
| **subscriptions** | tenantId | tenants | CASCADE |
| **payment_transactions** | subscriptionId | subscriptions | SET NULL |
| **refresh_tokens** | funcionarioId | funcionarios | CASCADE |
| **audit_logs** | funcionarioId | funcionarios | SET NULL |

### 5.2 Problemas de Integridade

#### FKs FALTANTES para tenant_id

**NENHUMA** das 24 tabelas operacionais tem FK de `tenant_id` → `tenants(id)`. Apenas `subscriptions` tem.

**Impacto:** Deletar um tenant da tabela `tenants` NAO deleta dados em cascata. Dados orfaos permanecem em 24 tabelas.

#### onDelete inconsistente

| Padrao | Tabelas | Problemas |
|--------|---------|-----------|
| `CASCADE` | comanda_agregados, itens_pedido, retiradas_itens, etc. | OK — deleta filhos |
| `SET NULL` | funcionarios.empresa_id, pedidos.criado_por_id | OK — preserva registro |
| `(default)` = RESTRICT | mesas→ambientes, comandas→mesas, pedidos→comandas | **PROBLEMA** — impede deletar ambiente/mesa/comanda se tiver filhos |
| `RESTRICT` | pontos_entrega → ambientes | Intencional — protege ambiente |

O uso de `(default)` em muitas FKs significa que deletar uma mesa com comandas associadas vai FALHAR. Isso pode ser intencional (protecao) ou pode causar problemas operacionais.

#### Check Constraints

| Tabela | Constraint | Descricao |
|--------|-----------|-----------|
| `itens_pedido` | `chk_quantidade_positiva` | `quantidade > 0` |

**FALTAM** constraints de validacao em:
- `produtos.preco >= 0`
- `sangrias.valor > 0`
- `avaliacoes.nota BETWEEN 1 AND 5`
- `fechamentos_caixa` valores `>= 0`

---

## 6. Migrations

### 6.1 Estado Atual

| Diretorio | Quantidade | Status |
|-----------|-----------|--------|
| `database/migrations/` | 1 arquivo | ATIVO — usado pelo TypeORM |
| `database/migrations_backup/` | 20 arquivos | BACKUP — nao executados |
| `database/migrations_old/` | 8 arquivos | ANTIGO — nao executados |

**Migration ativa unica:** `1707660000000-AddMissingCargoEnumValues.ts`

### 6.2 Migrations de Backup Relevantes

| Migration | Descricao | Executada? |
|-----------|-----------|-----------|
| `1765463000000-CreateTenantsAndAddTenantIdToAllTables` | Cria tabela tenants e adiciona tenant_id | Provavelmente via synchronize |
| `1765464000000-MakeTenantIdNotNull` | Torna tenant_id NOT NULL | **NAO EXECUTADA** |
| `1765465000000-AddTenantIdToRemainingTables` | Adiciona tenant_id a tabelas faltantes | Provavelmente via synchronize |
| `1765466000000-CreateMissingTablesAndFinalizeMultiTenancy` | Finaliza multi-tenancy | Provavelmente via synchronize |
| `1765467000000-AddTenantIdPrimaryKeyIndexes` | Adiciona indices compostos | **NAO EXECUTADA** |
| `1765468000000-CreatePaymentTables` | Cria tabelas de pagamento | Provavelmente via synchronize |

### 6.3 Problema: synchronize vs migrations

O `data-source.ts` tem `synchronize: false`. Porem o `app.module.ts` tem:

```typescript
synchronize: process.env.DB_SYNC === 'true',
```

Se `DB_SYNC=true` foi usado em producao, as tabelas foram criadas via synchronize (sem migrations), o que explica por que as migrations de backup nao foram necessarias mas tambem por que tenant_id ficou nullable.

---

## 7. Scripts SQL Soltos

### 7.1 Na raiz do projeto (8 arquivos)

| Arquivo | Conteudo Provavel | Risco |
|---------|-------------------|-------|
| `add-ordem-column.sql` | ALTER TABLE para adicionar coluna | Baixo — provavelmente ja aplicado |
| `check-ambiente.sql` | SELECT de debug | Nenhum |
| `check-pedido.sql` | SELECT de debug | Nenhum |
| `check-users.sql` | SELECT de debug | Nenhum |
| `create-admin.sql` | INSERT de admin | MEDIO — pode ter credenciais |
| `create-agregados-table.sql` | CREATE TABLE | Baixo — ja existe via entity |
| `rename-agregados.sql` | ALTER TABLE rename | Baixo |
| `test-quase-pronto.sql` | SELECT de debug | Nenhum |

### 7.2 No backend (1 arquivo)

| Arquivo | Conteudo Provavel | Risco |
|---------|-------------------|-------|
| `backend/fix-funcionario-email.sql` | UPDATE para corrigir emails | MEDIO — pode ter sido executado manualmente |

### 7.3 Em scripts/ (1 arquivo)

| Arquivo | Conteudo Provavel | Risco |
|---------|-------------------|-------|
| `scripts/create-test-empresas.sql` | INSERT de empresas de teste | BAIXO |

### 7.4 Recomendacao

Todos os scripts SQL devem ser movidos para `scripts/sql/` e documentados. Scripts de debug podem ser removidos. Scripts que modificam schema devem ser convertidos em migrations.

---

## 8. Documentacao vs Schema Real

### 8.1 docs/database/schema.md — OBSOLETO

| Aspecto | Documentacao | Schema Real | Status |
|---------|-------------|-------------|--------|
| Isolamento | "via coluna `empresaId`" | Via coluna `tenant_id` | **ERRADO** |
| Tabela empresa | `empresa` (singular) | `empresas` (plural) | **ERRADO** |
| Tabela funcionario | `funcionario` (singular) | `funcionarios` (plural) | **ERRADO** |
| Todas as tabelas | Singular | Plural | **TODAS ERRADAS** |
| Entidades listadas | 16 | 30 tabelas reais | **INCOMPLETO** — falta 14 |
| Tabelas faltantes | — | tenants, refresh_tokens, comanda_agregados, retiradas_itens, layouts_estabelecimento, turnos_funcionario, medalhas, medalhas_garcons, sangrias, aberturas_caixa, fechamentos_caixa, movimentacoes_caixa, subscriptions, payment_transactions, payment_configs, plans | **14 tabelas nao documentadas** |
| Coluna padrao | `empresaId UUID FK` | `tenant_id UUID nullable` | **ERRADO** |
| Timestamps | `criadoEm, atualizadoEm` | Varia por entidade | **IMPRECISO** |
| Diagrama ER | Empresa como centro | Tenant como centro | **DESATUALIZADO** |

**Veredicto:** O documento `docs/database/schema.md` esta completamente obsoleto. Todo o conteudo esta errado — nomes de tabelas, modelo de isolamento, entidades listadas, e diagrama ER.

---

## 9. Resumo de Riscos

### P0 — Criticos

| # | Risco | Impacto |
|---|-------|---------|
| 1 | **tenant_id nullable em 24 tabelas** | Dados podem ser inseridos sem tenant — leak silencioso |
| 2 | **Zero FKs tenant_id → tenants** | Deletar tenant nao limpa dados em cascata |
| 3 | **TenantAwareEntity nao usada** | Classe base correta existe mas nenhuma entidade a herda |
| 4 | **Migration NOT NULL nao executada** | `1765464000000-MakeTenantIdNotNull` esta em backup |

### P1 — Altos

| # | Risco | Impacto |
|---|-------|---------|
| 5 | **Cliente.cpf UNIQUE global** | Impede mesmo CPF em tenants diferentes |
| 6 | **empresaId legado em 2 tabelas** | Ambiguidade entre empresa e tenant |
| 7 | **Faltam indices compostos** | Queries lentas em relatorios por tenant+data |
| 8 | **10 scripts SQL soltos** | Sem controle de versao ou documentacao |

### P2 — Medios

| # | Risco | Impacto |
|---|-------|---------|
| 9 | **onDelete default (RESTRICT) em muitas FKs** | Pode impedir operacoes de cleanup |
| 10 | **Faltam CHECK constraints** | Valores invalidos podem ser inseridos |
| 11 | **Documentacao schema.md completamente errada** | Causa confusao para novos devs |
| 12 | **29 migrations em backup/old nao organizadas** | Historico de schema perdido |

---

## 10. Plano de Correcao

### Semana 1 — Urgente

```sql
-- 1. Adicionar FK tenant_id → tenants em todas as 24 tabelas
-- (executar APOS popular tenant_id em registros orfaos)
ALTER TABLE ambientes
  ADD CONSTRAINT fk_ambientes_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- (repetir para todas as 24 tabelas)

-- 2. Tornar tenant_id NOT NULL
ALTER TABLE ambientes ALTER COLUMN tenant_id SET NOT NULL;
-- (repetir para todas as 24 tabelas)

-- 3. Corrigir Cliente.cpf UNIQUE
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS "UQ_clientes_cpf";
CREATE UNIQUE INDEX idx_cliente_cpf_tenant ON clientes(cpf, tenant_id);
```

### Semana 2 — Performance

```sql
-- Indices compostos faltantes
CREATE INDEX idx_pedidos_tenant_data ON pedidos(tenant_id, data);
CREATE INDEX idx_comandas_tenant_status ON comandas(tenant_id, status);
CREATE INDEX idx_itens_pedido_tenant_status ON itens_pedido(tenant_id, status);
CREATE INDEX idx_movimentacoes_tenant_data ON movimentacoes_caixa(tenant_id, data);
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, "createdAt");
CREATE INDEX idx_funcionarios_tenant_cargo ON funcionarios(tenant_id, cargo);
```

### Semana 3 — Limpeza

- Remover `empresa_id` de `funcionarios` e `pontos_entrega`
- Mover scripts SQL para `scripts/sql/`
- Organizar migrations (mover backup para archive)
- Adicionar CHECK constraints faltantes
- Atualizar documentacao
