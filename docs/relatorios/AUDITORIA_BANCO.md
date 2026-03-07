# Auditoria de Banco de Dados — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura linha-a-linha de todas 31 entities, data-source, migrations, migrations_backup, migrations_old, SQL soltos
**Regra:** Baseado APENAS no que existe no codigo. Nada inventado.

---

## Indice de Problemas

| Severidade | Qtd | Descricao |
|-----------|-----|-----------|
| **P0 — Critico** | 7 | Isolamento comprometido, integridade referencial quebrada |
| **P1 — Alto** | 12 | Indices faltantes, constraints ausentes, divergencias |
| **P2 — Medio** | 9 | Legado, limpeza, organizacao |
| **Total** | **28** | — |

---

## 1. Inventario Completo de Entidades

### 1.1 Entity Files (31 arquivos → 30 tabelas + 1 abstrata)

| # | Entity | Tabela | Tipo | Colunas | Arquivo |
|---|--------|--------|------|---------|---------|
| 1 | Ambiente | ambientes | Operacional | 7 | ambiente/entities/ |
| 2 | Mesa | mesas | Operacional | 8 | mesa/entities/ |
| 3 | Produto | produtos | Operacional | 7 | produto/entities/ |
| 4 | Comanda | comandas | Operacional | 10 | comanda/entities/ |
| 5 | ComandaAgregado | comanda_agregados | Operacional | 5 | comanda/entities/ |
| 6 | Pedido | pedidos | Operacional | 12 | pedido/entities/ |
| 7 | ItemPedido | itens_pedido | Operacional | 18 | pedido/entities/ |
| 8 | RetiradaItem | retiradas_itens | Operacional | 7 | pedido/entities/ |
| 9 | Cliente | clientes | Operacional | 7 | cliente/entities/ |
| 10 | Funcionario | funcionarios | Operacional | 10 | funcionario/entities/ |
| 11 | Empresa | empresas | Operacional | 7 | empresa/entities/ |
| 12 | Evento | eventos | Operacional | 8 | evento/entities/ |
| 13 | PaginaEvento | paginas_evento | Operacional | 5 | pagina-evento/entities/ |
| 14 | PontoEntrega | pontos_entrega | Operacional | 11 | ponto-entrega/entities/ |
| 15 | AberturaCaixa | aberturas_caixa | Operacional | 10 | caixa/entities/ |
| 16 | FechamentoCaixa | fechamentos_caixa | Operacional | 24 | caixa/entities/ |
| 17 | Sangria | sangrias | Operacional | 11 | caixa/entities/ |
| 18 | MovimentacaoCaixa | movimentacoes_caixa | Operacional | 10 | caixa/entities/ |
| 19 | Avaliacao | avaliacoes | Operacional | 7 | avaliacao/entities/ |
| 20 | TurnoFuncionario | turnos_funcionario | Operacional | 8 | turno/entities/ |
| 21 | Medalha | medalhas | Operacional | 8 | medalha/entities/ |
| 22 | MedalhaGarcom | medalhas_garcons | Operacional | 5 | medalha/entities/ |
| 23 | AuditLog | audit_logs | Operacional | 12 | audit/entities/ |
| 24 | LayoutEstabelecimento | layouts_estabelecimento | Operacional | 7 | estabelecimento/entities/ |
| 25 | Tenant | tenants | Global | 8 | common/tenant/entities/ |
| 26 | Plan | plans | Global | 10 | plan/entities/ |
| 27 | PaymentConfig | payment_configs | Global | 10 | payment/entities/ |
| 28 | RefreshToken | refresh_tokens | Global/Tenant | 9 | auth/entities/ |
| 29 | Subscription | subscriptions | Tenant | 14 | payment/entities/ |
| 30 | PaymentTransaction | payment_transactions | Tenant | 13 | payment/entities/ |
| 31 | TenantAwareEntity | (abstrata) | Base | 2 | common/tenant/entities/ |

### 1.2 Resumo

| Metrica | Valor |
|---------|-------|
| Total entity files | 31 |
| Tabelas reais | 30 |
| Tabelas operacionais (com tenant_id) | 24 |
| Tabelas globais (sem tenant_id) | 3 (tenants, plans, payment_configs) |
| Tabelas hibridas (tenant_id mas sem FK ou nullable) | 3 (refresh_tokens, subscriptions, payment_transactions) |
| Classe abstrata (nao gera tabela) | 1 (TenantAwareEntity) |

---

## 2. Auditoria de tenant_id — Tabela por Tabela

### 2.1 Tabelas Operacionais

| # | Tabela | nullable | NOT NULL | FK → tenants | ON DELETE | Indice simples | Indice composto |
|---|--------|----------|----------|-------------|-----------|---------------|-----------------|
| 1 | ambientes | **true** | Nao | Nao | — | idx_ambiente_tenant_id | idx_ambiente_nome_tenant (nome+tid UNIQUE) |
| 2 | mesas | **true** | Nao | Nao | — | idx_mesa_tenant_id | Nao |
| 3 | produtos | **true** | Nao | Nao | — | idx_produto_tenant_id | Nao |
| 4 | comandas | **true** | Nao | Nao | — | idx_comanda_tenant_id | Nao |
| 5 | comanda_agregados | **true** | Nao | Nao | — | idx_comanda_agregado_tenant_id | Nao |
| 6 | pedidos | **true** | Nao | Nao | — | idx_pedido_tenant_id | Nao |
| 7 | itens_pedido | **true** | Nao | Nao | — | idx_item_pedido_tenant_id | Nao |
| 8 | retiradas_itens | **true** | Nao | Nao | — | idx_retirada_item_tenant_id | Nao |
| 9 | clientes | **true** | Nao | Nao | — | idx_cliente_tenant_id | Nao |
| 10 | funcionarios | **true** | Nao | Nao | — | idx_funcionario_tenant_id | idx_funcionario_email_tenant (email+tid UNIQUE) |
| 11 | empresas | **true** | Nao | Nao | — | idx_empresa_tenant_id | Nao |
| 12 | eventos | **true** | Nao | Nao | — | idx_evento_tenant_id | Nao |
| 13 | paginas_evento | **true** | Nao | Nao | — | idx_pagina_evento_tenant_id | Nao |
| 14 | pontos_entrega | **true** | Nao | Nao | — | idx_ponto_entrega_tenant_id | Nao |
| 15 | aberturas_caixa | **true** | Nao | Nao | — | idx_abertura_caixa_tenant_id | Nao |
| 16 | fechamentos_caixa | **true** | Nao | Nao | — | idx_fechamento_caixa_tenant_id | Nao |
| 17 | sangrias | **true** | Nao | Nao | — | idx_sangria_tenant_id | Nao |
| 18 | movimentacoes_caixa | **true** | Nao | Nao | — | idx_movimentacao_caixa_tenant_id | Nao |
| 19 | avaliacoes | **true** | Nao | Nao | — | idx_avaliacao_tenant_id | Nao |
| 20 | turnos_funcionario | **true** | Nao | Nao | — | idx_turno_funcionario_tenant_id | Nao |
| 21 | medalhas | **true** | Nao | Nao | — | idx_medalha_tenant_id | Nao |
| 22 | medalhas_garcons | **true** | Nao | Nao | — | idx_medalha_garcom_tenant_id | Nao |
| 23 | audit_logs | **true** | Nao | Nao | — | idx_audit_log_tenant_id | Nao |
| 24 | layouts_estabelecimento | **true** | Nao | Nao | — | idx_layout_estabelecimento_tenant_id | Nao |

### 2.2 Tabelas com tenant_id (hibridas/especiais)

| Tabela | nullable | NOT NULL | FK → tenants | ON DELETE |
|--------|----------|----------|-------------|-----------|
| refresh_tokens | **true** | Nao | Nao | — |
| subscriptions | Nao | **Sim** | **Sim** | CASCADE |
| payment_transactions | Nao | **Sim** | Nao | — |

### 2.3 Resumo tenant_id

| Metrica | Valor |
|---------|-------|
| Tabelas com tenant_id | 27 |
| tenant_id NOT NULL | **2** (subscriptions, payment_transactions) |
| tenant_id nullable: true | **25** |
| FK tenant_id → tenants(id) | **1** (subscriptions) |
| FK com ON DELETE CASCADE | **1** (subscriptions) |
| Indices simples tenant_id | 24 |
| Indices compostos com tenant_id | **2** (ambientes nome+tid, funcionarios email+tid) |

### 2.4 TenantAwareEntity (classe base correta — NAO USADA)

```typescript
// tenant-aware.entity.ts
export abstract class TenantAwareEntity {
  @Column({ type: 'uuid', name: 'tenant_id' })  // NOT NULL (sem nullable)!
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })  // FK com CASCADE!
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

Esta classe faz EXATAMENTE o correto: NOT NULL + FK + CASCADE. **Nenhuma entity a herda.** Todas definem `@Column({ nullable: true })` manualmente sem FK.

---

## 3. Auditoria de Indices

### 3.1 Indices Existentes por Tabela

| Tabela | Indice | Tipo | Colunas |
|--------|--------|------|---------|
| ambientes | idx_ambiente_tenant_id | B-tree | tenant_id |
| ambientes | idx_ambiente_nome_tenant | UNIQUE | nome, tenant_id |
| mesas | idx_mesa_tenant_id | B-tree | tenant_id |
| mesas | UQ_mesas_numero_ambiente | UNIQUE | numero, ambiente_id |
| produtos | idx_produto_tenant_id | B-tree | tenant_id |
| comandas | idx_comanda_tenant_id | B-tree | tenant_id |
| comandas | idx_comanda_status | B-tree | status |
| comandas | idx_comanda_data_abertura | B-tree | dataAbertura |
| pedidos | idx_pedido_tenant_id | B-tree | tenant_id |
| pedidos | idx_pedido_data | B-tree | data |
| itens_pedido | idx_item_pedido_tenant_id | B-tree | tenant_id |
| itens_pedido | idx_item_pedido_status | B-tree | status |
| clientes | idx_cliente_tenant_id | B-tree | tenant_id |
| clientes | idx_cliente_cpf | UNIQUE | cpf |
| funcionarios | idx_funcionario_tenant_id | B-tree | tenant_id |
| funcionarios | idx_funcionario_email | B-tree | email |
| funcionarios | idx_funcionario_email_tenant | UNIQUE | email, tenant_id |
| empresas | idx_empresa_tenant_id | B-tree | tenant_id |
| empresas | idx_empresas_slug | UNIQUE | slug |
| turnos_funcionario | idx_turno_funcionario_tenant_id | B-tree | tenant_id |
| turnos_funcionario | idx_turno_funcionario_ativo | B-tree | funcionarioId, ativo |
| movimentacoes_caixa | idx_movimentacao_caixa_tenant_id | B-tree | tenant_id |
| movimentacoes_caixa | idx_movimentacao_data | B-tree | data |
| audit_logs | (composto) | B-tree | funcionario, createdAt |
| audit_logs | (composto) | B-tree | entityName, entityId |
| audit_logs | (composto) | B-tree | action, createdAt |
| audit_logs | (simples) | B-tree | createdAt |
| audit_logs | idx_audit_log_tenant_id | B-tree | tenant_id |
| tenants | idx_tenants_slug | UNIQUE | slug |
| tenants | idx_tenants_status | B-tree | status |
| plans | idx_plans_code | UNIQUE | code |
| refresh_tokens | idx_refresh_token_tenant | B-tree | tenantId |
| refresh_tokens | (composto) | B-tree | tenantId, funcionario |

**Total: 33 indices.**

### 3.2 Indices Compostos FALTANTES (criticos para performance multi-tenant)

| Tabela | Indice necessario | Motivo |
|--------|------------------|--------|
| comandas | (tenant_id, status) | Dashboard: comandas abertas por tenant |
| comandas | (tenant_id, dataAbertura) | Relatorios por periodo |
| pedidos | (tenant_id, status) | Cozinha: pedidos por status |
| pedidos | (tenant_id, data) | Relatorios por periodo |
| itens_pedido | (tenant_id, status) | Cozinha: itens por status |
| itens_pedido | (tenant_id, status, iniciadoEm) | Scheduler: quase pronto |
| mesas | (tenant_id, status) | Mapa de mesas |
| produtos | (tenant_id, ativo) | Cardapio: produtos ativos |
| funcionarios | (tenant_id, cargo, status) | Lista funcionarios ativos por cargo |
| clientes | (tenant_id, cpf) | Busca CPF por tenant (substituir UNIQUE global) |
| aberturas_caixa | (tenant_id, status) | Caixa aberto atual |
| movimentacoes_caixa | (tenant_id, data) | Relatorios financeiros |
| turnos_funcionario | (tenant_id, funcionarioId, ativo) | Check-in ativo |
| avaliacoes | (tenant_id, criadoEm) | Relatorios de avaliacao |

**Total: 14 indices compostos faltantes.**

---

## 4. Auditoria de Foreign Keys

### 4.1 FKs Existentes (relacoes entre entidades)

| Tabela | Coluna FK | Referencia | ON DELETE | Status |
|--------|----------|-----------|-----------|--------|
| mesas | ambiente_id | ambientes(id) | (default) | OK |
| produtos | ambienteId | ambientes(id) | (default) | OK |
| comandas | mesa → mesas | mesas(id) | (default) | OK |
| comandas | cliente → clientes | clientes(id) | (default) | OK |
| comandas | ponto_entrega_id | pontos_entrega(id) | (default) | OK |
| comandas | criado_por_id | funcionarios(id) | SET NULL | OK |
| comanda_agregados | comanda_id | comandas(id) | CASCADE | OK |
| pedidos | comandaId | comandas(id) | (default) | OK |
| pedidos | criado_por_id | funcionarios(id) | SET NULL | OK |
| pedidos | entregue_por_id | funcionarios(id) | SET NULL | OK |
| itens_pedido | pedidoId | pedidos(id) | CASCADE | OK |
| itens_pedido | produtoId | produtos(id) | SET NULL | OK |
| itens_pedido | ambiente_retirada_id | ambientes(id) | SET NULL | OK |
| itens_pedido | retirado_por_garcom_id | funcionarios(id) | SET NULL | OK |
| itens_pedido | garcom_entrega_id | funcionarios(id) | SET NULL | OK |
| retiradas_itens | item_pedido_id | itens_pedido(id) | CASCADE | OK |
| retiradas_itens | garcom_id | funcionarios(id) | CASCADE | OK |
| retiradas_itens | ambiente_id | ambientes(id) | CASCADE | OK |
| clientes | ambiente_id | ambientes(id) | SET NULL | OK |
| clientes | ponto_entrega_id | pontos_entrega(id) | SET NULL | OK |
| funcionarios | empresa_id | empresas(id) | SET NULL | OK (legado) |
| funcionarios | ambiente_id | ambientes(id) | SET NULL | OK |
| pontos_entrega | mesa_proxima_id | mesas(id) | SET NULL | OK |
| pontos_entrega | ambiente_atendimento_id | ambientes(id) | RESTRICT | OK |
| pontos_entrega | ambiente_preparo_id | ambientes(id) | RESTRICT | OK |
| pontos_entrega | empresa_id | empresas(id) | CASCADE | OK (legado) |
| aberturas_caixa | turno_funcionario_id | turnos_funcionario(id) | CASCADE | OK |
| aberturas_caixa | funcionario_id | funcionarios(id) | CASCADE | OK |
| fechamentos_caixa | abertura_caixa_id | aberturas_caixa(id) | (default) | OK |
| fechamentos_caixa | turno_funcionario_id | turnos_funcionario(id) | CASCADE | OK |
| fechamentos_caixa | funcionario_id | funcionarios(id) | CASCADE | OK |
| sangrias | abertura_caixa_id | aberturas_caixa(id) | (default) | OK |
| sangrias | turno_funcionario_id | turnos_funcionario(id) | CASCADE | OK |
| sangrias | funcionario_id | funcionarios(id) | CASCADE | OK |
| movimentacoes_caixa | abertura_caixa_id | aberturas_caixa(id) | (default) | OK |
| movimentacoes_caixa | funcionario_id | funcionarios(id) | CASCADE | OK |
| avaliacoes | comandaId | comandas(id) | (default) | OK |
| avaliacoes | clienteId | clientes(id) | (default) | OK |
| turnos_funcionario | funcionario_id | funcionarios(id) | CASCADE | OK |
| turnos_funcionario | evento_id | eventos(id) | (default) | OK |
| medalhas_garcons | funcionario_id | funcionarios(id) | CASCADE | OK |
| medalhas_garcons | medalha_id | medalhas(id) | CASCADE | OK |
| eventos | paginaEvento → paginas_evento | paginas_evento(id) | (default) | OK |
| audit_logs | funcionarioId | funcionarios(id) | SET NULL | OK |
| layouts_estabelecimento | ambiente_id | ambientes(id) | (default) | OK |
| refresh_tokens | funcionarioId | funcionarios(id) | CASCADE | OK |
| subscriptions | tenantId | tenants(id) | CASCADE | OK |
| payment_transactions | subscriptionId | subscriptions(id) | SET NULL | OK |

**Total: 48 FKs de negocio.**

### 4.2 FKs de tenant_id (AUSENTES)

| Tabela | FK Esperada | Status |
|--------|-----------|--------|
| ambientes | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| mesas | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| produtos | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| comandas | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| comanda_agregados | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| pedidos | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| itens_pedido | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| retiradas_itens | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| clientes | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| funcionarios | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| empresas | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| eventos | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| paginas_evento | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| pontos_entrega | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| aberturas_caixa | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| fechamentos_caixa | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| sangrias | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| movimentacoes_caixa | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| avaliacoes | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| turnos_funcionario | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| medalhas | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| medalhas_garcons | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| audit_logs | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| layouts_estabelecimento | tenant_id → tenants(id) CASCADE | **AUSENTE** |
| subscriptions | tenantId → tenants(id) CASCADE | **EXISTE** |

**FKs tenant_id existentes: 1/25 (4%)**

---

## 5. Auditoria de Constraints

### 5.1 CHECK Constraints

| Tabela | Constraint | Expressao | Status |
|--------|-----------|-----------|--------|
| itens_pedido | chk_quantidade_positiva | "quantidade" > 0 | OK |

**Total: 1 CHECK constraint.** Faltam constraints para:

| Tabela | Constraint necessaria |
|--------|---------------------|
| avaliacoes | nota BETWEEN 1 AND 5 |
| produtos | preco >= 0 |
| sangrias | valor > 0 |
| movimentacoes_caixa | valor >= 0 |
| aberturas_caixa | valorInicial >= 0 |

### 5.2 UNIQUE Constraints

| Tabela | Colunas | Scope | Problema? |
|--------|---------|-------|-----------|
| ambientes | (nome, tenantId) | Per-tenant | OK |
| funcionarios | (email, tenantId) | Per-tenant | OK |
| clientes | cpf | **GLOBAL** | **P0 — Impede mesmo CPF em tenants diferentes** |
| empresas | cnpj | **GLOBAL** | **P1 — Pode colidir entre tenants** |
| empresas | slug | **GLOBAL** | OK (slugs sao globais por design) |
| mesas | (numero, ambiente) | Per-ambiente | OK (mas falta tenant) |
| tenants | slug | **GLOBAL** | OK |
| plans | code | **GLOBAL** | OK |
| payment_configs | gateway | **GLOBAL** | OK |

### 5.3 Problemas de UNIQUE

**P0 — clientes.cpf UNIQUE global:**
```typescript
// cliente.entity.ts:24
@Column({ unique: true, length: 14 })
cpf: string;
```
Deveria ser: `@Index(['cpf', 'tenantId'], { unique: true })` — CPF unico POR TENANT.

**P1 — empresas.cnpj UNIQUE global:**
```typescript
// empresa.entity.ts:8
@Column({ unique: true, nullable: true })
cnpj: string;
```
Deveria ser composto com tenant_id se multiplas empresas por tenant forem permitidas.

**P1 — mesas (numero, ambiente) sem tenant:**
```typescript
// mesa.entity.ts:24
@Unique(['numero', 'ambiente'])
```
Deveria incluir tenant_id: `@Unique(['numero', 'ambiente', 'tenantId'])`.

---

## 6. Auditoria de Enums

### 6.1 Enums no Banco

| Enum | Valores | Tabela |
|------|---------|--------|
| TipoAmbiente | PREPARO, ATENDIMENTO | ambientes |
| MesaStatus | LIVRE, OCUPADA, RESERVADA, AGUARDANDO_PAGAMENTO | mesas |
| ComandaStatus | ABERTA, FECHADA, PAGA | comandas |
| PedidoStatus | FEITO, EM_PREPARO, QUASE_PRONTO, PRONTO, DEIXADO_NO_AMBIENTE, RETIRADO, ENTREGUE, CANCELADO | itens_pedido, pedidos |
| Cargo | SUPER_ADMIN, ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO, COZINHA, BARTENDER | funcionarios |
| FuncionarioStatus | ATIVO, INATIVO, FERIAS, DEMITIDO | funcionarios |
| StatusCaixa | ABERTO, FECHADO, CONFERENCIA | aberturas_caixa, fechamentos_caixa |
| TipoMovimentacao | ABERTURA, VENDA, SANGRIA, SUPRIMENTO, FECHAMENTO | movimentacoes_caixa |
| FormaPagamento | DINHEIRO, PIX, DEBITO, CREDITO, VALE_REFEICAO, VALE_ALIMENTACAO | movimentacoes_caixa |
| TipoMedalha | (definido em enum file) | medalhas |
| NivelMedalha | (definido em enum file) | medalhas |
| AuditAction | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PERMISSION_CHANGE, EXPORT, IMPORT, ACCESS_DENIED | audit_logs |
| TenantStatus | ATIVO, INATIVO, SUSPENSO, TRIAL | tenants |
| TenantPlano | FREE, BASIC, PRO, ENTERPRISE | tenants, subscriptions |
| PaymentGateway | mercado_pago, pagseguro, picpay | payment_configs, subscriptions, payment_transactions |
| SubscriptionStatus | active, pending, cancelled, expired, trial | subscriptions |
| BillingCycle | monthly, yearly | subscriptions |
| TransactionStatus | pending, approved, rejected, refunded, cancelled, in_process | payment_transactions |
| TransactionType | subscription, upgrade, downgrade, renewal, refund | payment_transactions |

**Total: 19 enums. Todos definidos corretamente.**

---

## 7. Auditoria de Migrations

### 7.1 Pastas de Migrations

| Pasta | Arquivos | Usada pelo DataSource | Status |
|-------|----------|----------------------|--------|
| migrations/ | 1 | **Sim** | Ativa |
| migrations_backup/ | 25 | Nao | Nao executada |
| migrations_old/ | 8 | Nao | Nao executada |

### 7.2 Migration Ativa (unica)

```
migrations/1707660000000-AddMissingCargoEnumValues.ts
```
Adiciona SUPER_ADMIN, GERENTE, COZINHEIRO, BARTENDER ao enum Cargo. **Status: executada em prod.**

### 7.3 Migrations Backup (NAO EXECUTADAS)

| Timestamp | Nome | O que faz | Critico? |
|-----------|------|----------|----------|
| 1700000000000 | InitialSchema | Cria schema inicial | — |
| 1731431000000 | CreateCaixaTables | Tabelas de caixa | — |
| 1733838000000 | AddMissingForeignKeys | FKs faltantes | Alto |
| 1759808901232 | UpdateEventoEntity | Atualiza eventos | — |
| 1760047542018 | AddPaginaEventoIdToComandas | FK pagina_evento | — |
| 1760052372683 | AddPaginaEventoToEvento | FK pagina_evento | — |
| 1760060000000 | CreatePontoEntregaTable | Tabela pontos_entrega | — |
| 1760060100000 | CreateComandaAgregadoTable | Tabela comanda_agregados | — |
| 1760060200000 | AddPontoEntregaToComanda | FK ponto_entrega | — |
| 1760060300000 | AddDeixadoNoAmbienteStatus | Status DEIXADO | — |
| 1760070000000 | AddMapaVisualFields | Campos posicao/tamanho | — |
| 1760080000000 | AddMissingColumns | Colunas faltantes | — |
| 1760090000000 | AddAmbienteAtendimentoToPE | Coluna em pontos_entrega | — |
| 1760100000000 | AddForeignKeysToFuncionarios | FKs empresa/ambiente | — |
| 1760100000000 | AddMissingColumnsFromOldMig | Colunas de migracao antiga | — |
| 1765461300000 | FixTempoEntregaMinutosColumn | Corrige coluna | — |
| 1765461400000 | CreateRefreshTokensTable | Tabela refresh_tokens | — |
| 1765461500000 | CreateAuditLogsTable | Tabela audit_logs | — |
| 1765461600000 | AddTelefoneToFuncionarios | Coluna telefone | — |
| 1765461700000 | AddMissingColumnsToFunc | Colunas em funcionarios | — |
| 1765462000000 | AddSlugToEmpresas | Coluna slug | — |
| **1765463000000** | **CreateTenantsAndAddTenantId** | **Cria tenants, add tenant_id** | **P0** |
| **1765464000000** | **MakeTenantIdNotNull** | **ALTER tenant_id SET NOT NULL** | **P0** |
| 1765465000000 | AddTenantIdToRemainingTables | tenant_id em tabelas restantes | Alto |
| 1765466000000 | CreateMissingTablesAndFinalize | Finaliza multi-tenancy | Alto |
| 1765467000000 | AddTenantIdPrimaryKeyIndexes | Indices compostos | Alto |
| 1765468000000 | CreatePaymentTables | Tabelas de pagamento | — |

### 7.4 Analise da MakeTenantIdNotNull

```typescript
// MakeTenantIdNotNull — migrations_backup/1765464000000
private readonly tables = [
  'ambientes', 'avaliacoes', 'clientes', 'comanda_agregados',
  'comandas', 'eventos', 'funcionarios', 'mesas',
  'paginas_evento', 'pedidos', 'pontos_entrega', 'produtos',
  'sangrias', 'turnos_funcionario',
];
```

**Problemas nesta migration:**

| ID | Problema |
|----|---------|
| 1 | Lista tem 14 tabelas — faltam 10 (itens_pedido, retiradas_itens, aberturas_caixa, fechamentos_caixa, movimentacoes_caixa, medalhas, medalhas_garcons, audit_logs, layouts_estabelecimento, empresas) |
| 2 | NAO adiciona FKs tenant_id → tenants(id) |
| 3 | NAO adiciona indices compostos |
| 4 | Nunca foi executada em producao |

### 7.5 Divergencia Migrations vs Schema Real

O banco de producao foi criado/mantido via **synchronize: true** (historico) e depois via **a unica migration ativa** (AddMissingCargoEnumValues). As 25 migrations_backup descrevem a evolucao desejada mas **nenhuma foi executada**.

**Resultado:** O schema real e definido inteiramente pelas entities TypeORM com `autoLoadEntities: true`. O que esta nas entities E o schema real. Migrations sao decorativas.

---

## 8. DataSource Config

```typescript
// data-source.ts
{
  type: 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '**', '*.{ts,js}')],
  synchronize: false,        // OK — desabilitado
  migrationsRun: false,      // OK — migrations manuais
}
```

```typescript
// app.module.ts (TypeORM config)
{
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNC === 'true',  // PERIGO: pode ser ativado via env
  // Comentarios referenciam "Neon Cloud" — obsoletos
}
```

### Problemas

| ID | Sev | Problema |
|----|-----|---------|
| DS01 | P1 | `synchronize: process.env.DB_SYNC === 'true'` — pode ser ativado acidentalmente em prod |
| DS02 | P2 | Comentarios referenciam Neon Cloud — banco real e PG 17 local |
| DS03 | P2 | `rejectUnauthorized: false` em SSL — inseguro se SSL ativado |

---

## 9. SQL Soltos na Raiz

| Arquivo | Conteudo provavel | Problema |
|---------|------------------|---------|
| add-ordem-column.sql | ALTER TABLE | Sem controle de versao |
| check-ambiente.sql | SELECT debug | Debug solto |
| check-pedido.sql | SELECT debug | Debug solto |
| check-users.sql | SELECT debug | Debug solto |
| create-admin.sql | INSERT admin | **Credencial exposta?** |
| create-agregados-table.sql | CREATE TABLE | Deveria ser migration |
| rename-agregados.sql | ALTER TABLE | Deveria ser migration |
| test-quase-pronto.sql | SELECT teste | Debug solto |

**Total: 8 arquivos SQL soltos.** Todos deveriam estar em migrations ou ser deletados.

---

## 10. Campos Legado

### 10.1 empresaId em Entidades

| Entity | Campo | FK | Problema |
|--------|-------|-----|---------|
| Funcionario | empresaId (uuid, nullable) | empresas(id) SET NULL | Legado — coexiste com tenant_id |
| PontoEntrega | empresaId (uuid, NOT NULL) | empresas(id) CASCADE | Legado — coexiste com tenant_id |

Estes campos eram a forma antiga de isolamento (por empresa). Agora o isolamento e via `tenant_id`. Os campos `empresaId` sao redundantes e devem ser removidos ou transformados em relacao semantica (nao de isolamento).

### 10.2 Nomes de Coluna Inconsistentes

| Padrao | Exemplo | Tabelas |
|--------|---------|---------|
| snake_case | criado_em, atualizado_em, tenant_id | Maioria |
| camelCase | comandaId, produtoId, ambienteId | pedidos, itens_pedido |
| Misto | criadoEm vs created_at | Varias |

**Inconsistencia:** Pedido.comandaId usa camelCase como nome de coluna FK, enquanto a maioria usa snake_case.

---

## 11. Problemas Especificos por Tabela

### 11.1 clientes

| Problema | Detalhe |
|---------|---------|
| cpf UNIQUE global | Dois tenants nao podem cadastrar mesmo CPF |
| Sem constraint de formato CPF | Aceita qualquer string de 14 chars |

### 11.2 mesas

| Problema | Detalhe |
|---------|---------|
| UNIQUE (numero, ambiente) sem tenant | Funciona por acaso pq ambiente ja tem tenant_id, mas semanticamente incompleto |

### 11.3 itens_pedido

| Problema | Detalhe |
|---------|---------|
| Tabela mais complexa (18 colunas) | Muitos timestamps nullable sem defaults |
| 4 FKs para funcionarios | Diferentes garcons em cada etapa — correto mas complexo |

### 11.4 fechamentos_caixa

| Problema | Detalhe |
|---------|---------|
| 24 colunas | Tabela muito larga — considerar normalizacao |
| Valores esperados/informados/diferenca por forma de pagamento | 6 formas × 3 colunas = 18 colunas so para valores |

### 11.5 payment_transactions

| Problema | Detalhe |
|---------|---------|
| tenantId NOT NULL (correto!) | MAS sem FK para tenants — integridade nao garantida |

### 11.6 refresh_tokens

| Problema | Detalhe |
|---------|---------|
| tenantId nullable | Permite tokens sem tenant |
| Sem FK para tenants | Referencia por convencao, nao por constraint |

---

## 12. PG Dev vs Prod

| Ambiente | Versao | Container | Porta |
|----------|--------|-----------|-------|
| Dev | 15-alpine | pub_system_db | 5432 (exposta) |
| CI | 15 | service container | 5432 |
| Prod | **17** | pub-postgres | 5432 (interna) |

**Divergencia de versao:** Dev/CI usam PG 15, prod usa PG 17. Funcionalidades do PG 17 (melhorias em JSON, MERGE, COPY improvements) podem nao estar disponiveis em dev/CI.

---

## 13. Catalogo Completo de Problemas

### P0 — Critico (7)

| ID | Problema | Impacto |
|----|---------|---------|
| P0-01 | tenant_id nullable em 25 tabelas | INSERT sem tenant permitido — dados orfaos |
| P0-02 | Zero FKs tenant_id → tenants(id) (exceto subscriptions) | DELETE tenant nao limpa 24 tabelas |
| P0-03 | Migration MakeTenantIdNotNull NUNCA executada | Banco em estado inconsistente |
| P0-04 | MakeTenantIdNotNull incompleta — faltam 10 tabelas | Mesmo se executada, 10 tabelas ficam nullable |
| P0-05 | Cliente.cpf UNIQUE global | Conflito entre tenants |
| P0-06 | TenantAwareEntity (classe correta) nao e usada por nenhuma entity | NOT NULL + FK + CASCADE ignorados |
| P0-07 | Sem migrations ativas para multi-tenancy (todas em backup) | Nenhuma garantia de schema via migrations |

### P1 — Alto (12)

| ID | Problema | Impacto |
|----|---------|---------|
| P1-01 | 14 indices compostos (tenant + filtro) ausentes | Queries lentas em ambiente multi-tenant |
| P1-02 | Mesa UNIQUE (numero, ambiente) sem tenant_id | Funciona por acaso mas semanticamente errado |
| P1-03 | Empresa.cnpj UNIQUE global | Pode colidir entre tenants |
| P1-04 | RefreshToken.tenantId nullable | Tokens sem tenant permitidos |
| P1-05 | PaymentTransaction sem FK para tenants | Integridade nao garantida |
| P1-06 | DB_SYNC env pode ativar synchronize em prod | Alteracoes automaticas no schema |
| P1-07 | PG 15 dev/CI vs PG 17 prod | Comportamento divergente |
| P1-08 | 8 SQL soltos na raiz sem controle | Potencial credencial exposta (create-admin.sql) |
| P1-09 | 5 CHECK constraints ausentes (nota, preco, valor) | Dados invalidos aceitos |
| P1-10 | Nomes de coluna FK inconsistentes (camelCase vs snake_case) | Confusao em queries manuais |
| P1-11 | FechamentoCaixa com 24 colunas | Tabela desnormalizada |
| P1-12 | 25 migrations_backup + 8 migrations_old nunca executadas | Schema controlado apenas pelas entities, nao por migrations |

### P2 — Medio (9)

| ID | Problema | Impacto |
|----|---------|---------|
| P2-01 | empresaId legado em Funcionario e PontoEntrega | Confusao com tenant_id |
| P2-02 | Comentarios Neon Cloud obsoletos em data-source e app.module | Documentacao enganosa |
| P2-03 | rejectUnauthorized: false em SSL | Inseguro se SSL ativado |
| P2-04 | create-admin.sql pode conter credenciais | Exposicao |
| P2-05 | Pedido.comandaId camelCase como nome de coluna | Inconsistencia |
| P2-06 | Produto.ambienteId sem name: 'ambiente_id' explicito | Depende do TypeORM naming |
| P2-07 | ItemPedido com muitos timestamps nullable sem defaults | Dados incompletos |
| P2-08 | 4 audit_logs indices compostos nao incluem tenant_id | Queries de audit sem isolamento eficiente |
| P2-09 | Seeder roda toda vez que app inicia (sem flag de controle granular) | Dados duplicados se falhar check |

---

## 14. Correcoes Propostas (Prioridade)

### Fase 1 — Seguranca do Schema (Semana 1)

| # | Acao | SQL Estimado |
|---|------|-------------|
| 1 | Verificar registros com tenant_id IS NULL em todas tabelas | `SELECT 'tabela', COUNT(*) FROM tabela WHERE tenant_id IS NULL` |
| 2 | Preencher tenant_id nos registros orfaos com DEFAULT_TENANT | `UPDATE tabela SET tenant_id = :default WHERE tenant_id IS NULL` |
| 3 | Criar migration: ALTER COLUMN tenant_id SET NOT NULL em 25 tabelas | 25 ALTER TABLE statements |
| 4 | Criar migration: ADD FK tenant_id REFERENCES tenants(id) ON DELETE CASCADE em 24 tabelas | 24 ALTER TABLE ADD CONSTRAINT |
| 5 | Criar migration: ALTER UNIQUE (cpf) para (cpf, tenant_id) em clientes | DROP + ADD CONSTRAINT |
| 6 | Fazer todas entities herdarem TenantAwareEntity | Refator 24 entity files |

### Fase 2 — Indices e Constraints (Semana 2)

| # | Acao |
|---|------|
| 7 | Criar 14 indices compostos (tenant + filtro) |
| 8 | Criar 5 CHECK constraints (nota, preco, valor) |
| 9 | Corrigir UNIQUE (numero, ambiente) para (numero, ambiente, tenantId) em mesas |
| 10 | Adicionar FK tenant_id em payment_transactions |
| 11 | Tornar refresh_tokens.tenantId NOT NULL (apos limpar orfaos) |

### Fase 3 — Limpeza (Semana 3)

| # | Acao |
|---|------|
| 12 | Mover migrations_backup para migrations/ (reorganizar) |
| 13 | Deletar migrations_old/ |
| 14 | Deletar 8 SQL soltos da raiz |
| 15 | Remover empresaId legado de Funcionario e PontoEntrega (apos validar) |
| 16 | Alinhar PG 15 → 17 no docker-compose.yml e CI |
| 17 | Remover DB_SYNC env var (forcar synchronize: false) |
| 18 | Padronizar nomes de coluna FK (snake_case) |

---

## 15. Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| tenant_id NOT NULL | 2/27 (7%) | **27/27 (100%)** |
| FK tenant_id → tenants | 1/25 (4%) | **25/25 (100%)** |
| Indices compostos tenant | 2 | **16+** |
| CHECK constraints | 1 | **6** |
| Entities herdando TenantAwareEntity | 0/24 | **24/24** |
| SQL soltos na raiz | 8 | **0** |
| Migrations organizadas | 1 ativa + 33 mortas | **Todas ativas e ordenadas** |
| PG versao alinhada | 15 dev / 17 prod | **17 em todos** |
