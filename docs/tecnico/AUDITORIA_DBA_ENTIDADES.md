# 🗄️ Auditoria DBA - Entidades TypeORM

**Data:** 10/12/2024  
**Auditor:** DBA Sênior  
**Branch:** `audit/security-controllers`

---

## 📊 Resumo Executivo

| Categoria | Status | Problemas |
|-----------|--------|-----------|
| **Relações Bidirecionais** | ✅ OK | Todas corretas |
| **Colunas Obrigatórias** | ⚠️ PARCIAL | 3 problemas |
| **Índices de Busca** | 🔴 CRÍTICO | Faltam índices importantes |
| **Tipos de Dados Financeiros** | ✅ OK | decimal(10,2) correto |
| **Integridade Referencial** | ⚠️ PARCIAL | 2 problemas |

---

## ✅ RELAÇÕES BIDIRECIONAIS - CORRETAS

### Comanda ↔ Pedido
```typescript
// Comanda.entity.ts
@OneToMany(() => Pedido, (pedido) => pedido.comanda)
pedidos: Pedido[];

// Pedido.entity.ts
@ManyToOne(() => Comanda, (comanda) => comanda.pedidos)
@JoinColumn({ name: 'comandaId' })
comanda: Comanda;
```
✅ **Correto** - Relação bidirecional completa

### Pedido ↔ ItemPedido
```typescript
// Pedido.entity.ts
@OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true, eager: true })
itens: ItemPedido[];

// ItemPedido.entity.ts
@ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'pedidoId' })
pedido: Pedido;
```
✅ **Correto** - Com cascade e onDelete

### Cliente ↔ Comanda
```typescript
// Cliente.entity.ts
@OneToMany(() => Comanda, (comanda) => comanda.cliente)
comandas: Comanda[];

// Comanda.entity.ts
@ManyToOne(() => Cliente, (cliente) => cliente.comandas, { nullable: true, eager: true })
cliente: Cliente;
```
✅ **Correto** - Cliente opcional (comanda pode ser anônima)

### Mesa ↔ Comanda
```typescript
// Mesa.entity.ts
@OneToMany(() => Comanda, (comanda) => comanda.mesa)
comandas: Comanda[];

// Comanda.entity.ts
@ManyToOne(() => Mesa, (mesa) => mesa.comandas, { nullable: true, eager: true })
mesa: Mesa;
```
✅ **Correto** - Mesa opcional (pode usar PontoEntrega)

### Ambiente ↔ Mesa
```typescript
// Ambiente.entity.ts
@OneToMany(() => Mesa, (mesa) => mesa.ambiente)
mesas: Mesa[];

// Mesa.entity.ts
@ManyToOne(() => Ambiente, (ambiente) => ambiente.mesas)
@JoinColumn({ name: 'ambiente_id' })
ambiente: Ambiente;
```
✅ **Correto**

### Ambiente ↔ Produto
```typescript
// Ambiente.entity.ts
@OneToMany(() => Produto, (produto) => produto.ambiente)
produtos: Produto[];

// Produto.entity.ts
@ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos)
@JoinColumn({ name: 'ambienteId' })
ambiente: Ambiente;
```
✅ **Correto**

### AberturaCaixa ↔ MovimentacaoCaixa
```typescript
// AberturaCaixa.entity.ts
@OneToMany(() => MovimentacaoCaixa, (movimentacao) => movimentacao.aberturaCaixa)
movimentacoes: MovimentacaoCaixa[];

// MovimentacaoCaixa.entity.ts
@ManyToOne(() => AberturaCaixa, (aberturaCaixa) => aberturaCaixa.movimentacoes, { eager: true })
@JoinColumn({ name: 'abertura_caixa_id' })
aberturaCaixa: AberturaCaixa;
```
✅ **Correto**

---

## 🔴 ÍNDICES FALTANDO - CRÍTICO

### 1. Cliente.cpf - SEM ÍNDICE EXPLÍCITO
**Arquivo:** `cliente.entity.ts`
```typescript
@Column({ unique: true })
cpf: string;
```
**Problema:** `unique: true` cria índice, mas não é otimizado para buscas parciais (LIKE).

**Recomendação:**
```typescript
@Index('idx_cliente_cpf')
@Column({ unique: true, length: 14 })
cpf: string;
```

### 2. Pedido.data - SEM ÍNDICE
**Arquivo:** `pedido.entity.ts`
```typescript
@CreateDateColumn()
data: Date;
```
**Problema:** Buscas por período são frequentes em relatórios.

**Recomendação:**
```typescript
@Index('idx_pedido_data')
@CreateDateColumn()
data: Date;
```

### 3. Comanda.status - SEM ÍNDICE
**Arquivo:** `comanda.entity.ts`
```typescript
@Column({ type: 'enum', enum: ComandaStatus, default: ComandaStatus.ABERTA })
status: ComandaStatus;
```
**Problema:** Busca por comandas abertas é muito frequente.

**Recomendação:**
```typescript
@Index('idx_comanda_status')
@Column({ type: 'enum', enum: ComandaStatus, default: ComandaStatus.ABERTA })
status: ComandaStatus;
```

### 4. Comanda.dataAbertura - SEM ÍNDICE
**Arquivo:** `comanda.entity.ts`
```typescript
@CreateDateColumn()
dataAbertura: Date;
```
**Recomendação:**
```typescript
@Index('idx_comanda_data_abertura')
@CreateDateColumn()
dataAbertura: Date;
```

### 5. ItemPedido.status - SEM ÍNDICE
**Arquivo:** `item-pedido.entity.ts`
```typescript
@Column({ type: 'enum', enum: PedidoStatus, default: PedidoStatus.FEITO })
status: PedidoStatus;
```
**Problema:** Busca por itens PRONTOS é crítica para cozinha.

**Recomendação:**
```typescript
@Index('idx_item_pedido_status')
@Column({ type: 'enum', enum: PedidoStatus, default: PedidoStatus.FEITO })
status: PedidoStatus;
```

### 6. TurnoFuncionario.funcionarioId + ativo - ÍNDICE COMPOSTO
**Arquivo:** `turno-funcionario.entity.ts`
```typescript
@Column({ name: 'funcionario_id' })
funcionarioId: string;

@Column({ type: 'boolean', default: true })
ativo: boolean;
```
**Problema:** Busca por turno ativo de funcionário é frequente.

**Recomendação:**
```typescript
@Index('idx_turno_funcionario_ativo', ['funcionarioId', 'ativo'])
```

### 7. MovimentacaoCaixa.data - SEM ÍNDICE
**Arquivo:** `movimentacao-caixa.entity.ts`
```typescript
@Column({ type: 'date' })
data: Date;
```
**Recomendação:**
```typescript
@Index('idx_movimentacao_data')
@Column({ type: 'date' })
data: Date;
```

---

## ⚠️ COLUNAS OBRIGATÓRIAS - PROBLEMAS

### 1. Produto.ambiente - PODE SER NULL
**Arquivo:** `produto.entity.ts`
```typescript
@ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos)
@JoinColumn({ name: 'ambienteId' })
ambiente: Ambiente;
```
**Problema:** Produto sem ambiente não sabe onde é preparado.

**Recomendação:**
```typescript
@ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos, { nullable: false })
@JoinColumn({ name: 'ambienteId' })
ambiente: Ambiente;
```

### 2. Comanda sem Mesa E sem PontoEntrega
**Arquivo:** `comanda.entity.ts`
```typescript
@ManyToOne(() => Mesa, ..., { nullable: true })
mesa: Mesa;

@ManyToOne(() => PontoEntrega, ..., { nullable: true })
pontoEntrega: PontoEntrega;
```
**Problema:** Ambos podem ser null simultaneamente.

**Recomendação:** Adicionar validação no service ou constraint CHECK no banco:
```sql
ALTER TABLE comandas ADD CONSTRAINT chk_comanda_local 
CHECK (mesa_id IS NOT NULL OR ponto_entrega_id IS NOT NULL);
```

### 3. ItemPedido.quantidade - SEM VALIDAÇÃO
**Arquivo:** `item-pedido.entity.ts`
```typescript
@Column()
quantidade: number;
```
**Problema:** Pode ser 0 ou negativo.

**Recomendação:**
```typescript
@Column({ type: 'int', unsigned: true, default: 1 })
@Check('quantidade > 0')
quantidade: number;
```

---

## ✅ TIPOS DE DADOS FINANCEIROS - CORRETOS

| Entidade | Campo | Tipo | Status |
|----------|-------|------|--------|
| Pedido | total | decimal(10,2) | ✅ |
| ItemPedido | precoUnitario | numeric(10,2) | ✅ |
| Produto | preco | decimal(10,2) | ✅ |
| AberturaCaixa | valorInicial | decimal(10,2) | ✅ |
| MovimentacaoCaixa | valor | decimal(10,2) | ✅ |
| FechamentoCaixa | todos os valores | decimal(10,2) | ✅ |
| Sangria | valor | decimal(10,2) | ✅ |

**Observação:** Todos os campos monetários usam `decimal(10,2)` ou `numeric(10,2)`, que são equivalentes e adequados para valores financeiros.

---

## ⚠️ INTEGRIDADE REFERENCIAL - PROBLEMAS

### 1. Funcionario.empresaId - SEM RELAÇÃO
**Arquivo:** `funcionario.entity.ts`
```typescript
@Column({ type: 'uuid', nullable: true, name: 'empresa_id' })
empresaId: string;
```
**Problema:** Coluna FK sem `@ManyToOne`, não há integridade referencial.

**Recomendação:**
```typescript
@Column({ type: 'uuid', nullable: true, name: 'empresa_id' })
empresaId: string;

@ManyToOne(() => Empresa, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'empresa_id' })
empresa: Empresa;
```

### 2. Funcionario.ambienteId - SEM RELAÇÃO
**Arquivo:** `funcionario.entity.ts`
```typescript
@Column({ type: 'uuid', nullable: true, name: 'ambiente_id' })
ambienteId: string;
```
**Problema:** Mesma situação - FK sem relação TypeORM.

**Recomendação:**
```typescript
@ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'ambiente_id' })
ambiente: Ambiente;
```

---

## 📋 RESUMO DE CORREÇÕES NECESSÁRIAS

### Prioridade 1 - CRÍTICO (Performance)
1. Adicionar índice em `Cliente.cpf`
2. Adicionar índice em `Pedido.data`
3. Adicionar índice em `Comanda.status`
4. Adicionar índice em `ItemPedido.status`
5. Adicionar índice composto em `TurnoFuncionario(funcionarioId, ativo)`

### Prioridade 2 - ALTA (Integridade)
6. Adicionar relação `Funcionario.empresa`
7. Adicionar relação `Funcionario.ambiente`
8. Tornar `Produto.ambiente` obrigatório

### Prioridade 3 - MÉDIA (Validação)
9. Adicionar CHECK constraint em `ItemPedido.quantidade`
10. Adicionar CHECK constraint em `Comanda` (mesa OU pontoEntrega)

---

## 🔧 MIGRATION SUGERIDA

```typescript
// migration: AddMissingIndexes
export class AddMissingIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices simples
    await queryRunner.query(`CREATE INDEX idx_pedido_data ON pedidos(data)`);
    await queryRunner.query(`CREATE INDEX idx_comanda_status ON comandas(status)`);
    await queryRunner.query(`CREATE INDEX idx_comanda_data_abertura ON comandas("dataAbertura")`);
    await queryRunner.query(`CREATE INDEX idx_item_pedido_status ON itens_pedido(status)`);
    await queryRunner.query(`CREATE INDEX idx_movimentacao_data ON movimentacoes_caixa(data)`);
    
    // Índice composto
    await queryRunner.query(`CREATE INDEX idx_turno_funcionario_ativo ON turnos_funcionario(funcionario_id, ativo)`);
    
    // Constraints
    await queryRunner.query(`ALTER TABLE itens_pedido ADD CONSTRAINT chk_quantidade_positiva CHECK (quantidade > 0)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_pedido_data`);
    await queryRunner.query(`DROP INDEX idx_comanda_status`);
    await queryRunner.query(`DROP INDEX idx_comanda_data_abertura`);
    await queryRunner.query(`DROP INDEX idx_item_pedido_status`);
    await queryRunner.query(`DROP INDEX idx_movimentacao_data`);
    await queryRunner.query(`DROP INDEX idx_turno_funcionario_ativo`);
    await queryRunner.query(`ALTER TABLE itens_pedido DROP CONSTRAINT chk_quantidade_positiva`);
  }
}
```

---

## 📊 Matriz de Entidades Auditadas

| Entidade | Relações | Índices | Tipos | Nullable | Status |
|----------|:--------:|:-------:|:-----:|:--------:|:------:|
| Pedido | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| Comanda | ✅ | 🔴 | ✅ | ⚠️ | ⚠️ |
| ItemPedido | ✅ | 🔴 | ✅ | ⚠️ | ⚠️ |
| Cliente | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| Produto | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Funcionario | 🔴 | ✅ | ✅ | ✅ | 🔴 |
| Mesa | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ambiente | ✅ | ✅ | ✅ | ✅ | ✅ |
| AberturaCaixa | ✅ | ✅ | ✅ | ✅ | ✅ |
| MovimentacaoCaixa | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| TurnoFuncionario | ✅ | 🔴 | ✅ | ✅ | ⚠️ |
| PontoEntrega | ✅ | ✅ | ✅ | ✅ | ✅ |

---

*Auditoria realizada em 10/12/2024*
