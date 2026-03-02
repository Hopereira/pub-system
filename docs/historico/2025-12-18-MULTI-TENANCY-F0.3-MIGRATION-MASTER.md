# Issue #3: [F0.3] Migration Master - Adição de tenant_id ao Schema Global

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição (PO)

Esta é a tarefa técnica mais crítica. Vamos adicionar a coluna `tenant_id` em todas as tabelas operacionais para garantir o isolamento físico dos dados no banco PostgreSQL.

---

## 💻 Implementação Técnica

### Arquivos Criados

```
backend/src/database/migrations/
└── 1765463000000-CreateTenantsAndAddTenantIdToAllTables.ts

backend/src/common/tenant/entities/
├── tenant.entity.ts           # Entidade Tenant com status e plano
└── tenant-aware.entity.ts     # Classe base para entidades com tenant_id
```

### Tabela `tenants`

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18),
  status ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'TRIAL') DEFAULT 'ATIVO',
  plano ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE') DEFAULT 'FREE',
  config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE UNIQUE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### Tabelas que Recebem `tenant_id`

| # | Tabela | Descrição |
|---|--------|-----------|
| 1 | `ambientes` | Ambientes de preparo (cozinha, bar) |
| 2 | `avaliacoes` | Avaliações de clientes |
| 3 | `abertura_caixa` | Aberturas de caixa |
| 4 | `fechamento_caixa` | Fechamentos de caixa |
| 5 | `movimentacao_caixa` | Movimentações financeiras |
| 6 | `sangrias` | Sangrias de caixa |
| 7 | `clientes` | Cadastro de clientes |
| 8 | `comanda_agregados` | Clientes agregados em comandas |
| 9 | `comandas` | Comandas abertas/fechadas |
| 10 | `layout_estabelecimento` | Layout visual do estabelecimento |
| 11 | `eventos` | Eventos especiais |
| 12 | `funcionarios` | Funcionários do estabelecimento |
| 13 | `medalha_garcom` | Medalhas conquistadas por garçons |
| 14 | `medalhas` | Tipos de medalhas |
| 15 | `mesas` | Mesas do estabelecimento |
| 16 | `paginas_evento` | Landing pages de eventos |
| 17 | `item_pedido` | Itens dos pedidos |
| 18 | `pedidos` | Pedidos realizados |
| 19 | `retirada_item` | Retiradas de itens |
| 20 | `pontos_entrega` | Pontos de entrega (balcão, etc) |
| 21 | `produtos` | Cardápio de produtos |
| 22 | `turnos_funcionario` | Turnos de trabalho |

**Total:** 22 tabelas

### Índices Compostos para Performance

```sql
-- Queries frequentes otimizadas
CREATE INDEX idx_pedidos_tenant_id_status ON pedidos(tenant_id, status);
CREATE INDEX idx_pedidos_tenant_id_created_at ON pedidos(tenant_id, created_at);
CREATE INDEX idx_comandas_tenant_id_status ON comandas(tenant_id, status);
CREATE INDEX idx_produtos_tenant_id_ativo ON produtos(tenant_id, ativo);
CREATE INDEX idx_mesas_tenant_id_status ON mesas(tenant_id, status);
CREATE INDEX idx_funcionarios_tenant_id_status ON funcionarios(tenant_id, status);
```

### Entidade Tenant

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nome: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ATIVO,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlano,
    default: TenantPlano.FREE,
  })
  plano: TenantPlano;

  @Column({ type: 'jsonb', nullable: true })
  config: TenantConfig;
}
```

### Classe Base TenantAwareEntity

```typescript
export abstract class TenantAwareEntity {
  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

// Uso:
@Entity('produtos')
export class Produto extends TenantAwareEntity {
  @Column()
  nome: string;
}
```

---

## 🚀 Infraestrutura (DevOps)

### Backup Antes da Migration

```bash
# Backup completo do banco Neon
pg_dump -h <NEON_HOST> -U <USER> -d <DATABASE> -F c -f backup_pre_multitenancy.dump

# Ou via Neon Console
# Dashboard > Project > Backups > Create Backup
```

### Monitoramento da Migration

```bash
# Verificar tempo de execução
time npm run typeorm:migration:run

# Monitorar locks no PostgreSQL
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Verificar progresso
SELECT schemaname, relname, n_live_tup 
FROM pg_stat_user_tables 
WHERE relname = 'tenants';
```

### Rollback em Caso de Falha

```bash
# Reverter migration
npm run typeorm:migration:revert

# Ou restaurar backup
pg_restore -h <NEON_HOST> -U <USER> -d <DATABASE> backup_pre_multitenancy.dump
```

---

## ✅ Critérios de Aceitação (QA)

### 1. Tabela tenants criada

```sql
-- ✅ PASSA
SELECT * FROM tenants;
-- Deve retornar registros migrados de empresas
```

### 2. Todas as tabelas têm tenant_id

```sql
-- ✅ PASSA
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'tenant_id'
ORDER BY table_name;
-- Deve retornar 22 tabelas
```

### 3. Índices compostos criados

```sql
-- ✅ PASSA
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE 'idx_%_tenant_id%';
-- Deve retornar índices para todas as tabelas
```

### 4. FKs configuradas

```sql
-- ✅ PASSA
SELECT conname FROM pg_constraint 
WHERE conname LIKE 'fk_%_tenant';
-- Deve retornar 22 FKs
```

### 5. Inserção sem tenant_id falha (após NOT NULL)

```sql
-- ✅ PASSA (após tornar NOT NULL)
INSERT INTO produtos (nome, preco) VALUES ('Teste', 10.00);
-- ERROR: null value in column "tenant_id" violates not-null constraint
```

---

## 📊 Estimativa de Tempo

| Etapa | Tempo Estimado |
|-------|----------------|
| Criar tabela tenants | ~100ms |
| Migrar dados de empresas | ~500ms |
| Adicionar tenant_id (22 tabelas) | ~5s |
| Criar índices compostos | ~2s |
| **Total** | **~8 segundos** |

*Para bancos com milhões de registros, considerar migration em batches.*

---

## 🔧 Como Executar

### 1. Fazer backup

```bash
# OBRIGATÓRIO antes de rodar em produção
pg_dump -h <HOST> -U <USER> -d <DB> -F c -f backup.dump
```

### 2. Executar migration

```bash
# Via Docker
docker-compose exec backend npm run typeorm:migration:run

# Ou diretamente
cd backend && npm run typeorm:migration:run
```

### 3. Verificar resultado

```bash
# Verificar se todas as tabelas têm tenant_id
docker-compose exec db psql -U postgres -d pub_system_db -c "
  SELECT table_name 
  FROM information_schema.columns 
  WHERE column_name = 'tenant_id'
  ORDER BY table_name;
"
```

---

## 🔜 Próximos Passos

| Issue | Descrição |
|-------|-----------|
| **#4 [F0.4]** | TenantGuard - Validar permissões por tenant |
| **#5 [F0.5]** | Integração TypeORM - Filtro automático por tenant |
| **#6** | Tornar tenant_id NOT NULL (após validação) |

---

## 📁 Arquivos

- `backend/src/database/migrations/1765463000000-CreateTenantsAndAddTenantIdToAllTables.ts`
- `backend/src/common/tenant/entities/tenant.entity.ts`
- `backend/src/common/tenant/entities/tenant-aware.entity.ts`
- `backend/src/common/tenant/index.ts` (atualizado)
- `backend/src/common/tenant/tenant.module.ts` (atualizado)

**Commit:** Pendente
