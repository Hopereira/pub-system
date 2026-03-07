# Relatorio Banco de Dados — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura de todas entities, data-source.ts, migrations, seeder, schema.md
**Regra:** Baseado APENAS no que existe no codigo

---

## 1. Configuracao Real

| Item | Desenvolvimento | Producao |
|------|----------------|----------|
| Engine | PostgreSQL 15-alpine | PostgreSQL 17 |
| Container | pub_system_db | pub-postgres |
| Host | db (Docker network) | localhost (Docker host) |
| Porta | 5432 (exposta) | 5432 (nao exposta) |
| Volume | postgres_data | postgres_data |
| SSL | Nao | Nao (DB local) |
| Extensoes | uuid-ossp | uuid-ossp |
| User | pubuser | pubuser |
| Database | pubsystem | pubsystem |
| Password | pubpass123 | (rotacionar — exposta no Git) |

### Divergencia Versao PostgreSQL

| Ambiente | Versao | Arquivo |
|----------|--------|---------|
| Dev (raiz) | 15-alpine | docker-compose.yml |
| CI/CD | 15 | .github/workflows/ci.yml |
| Prod (infra) | 17-alpine | infra/docker-compose.prod.yml |
| Prod (real) | 17 | docker-compose.micro.yml (DB local) |

**Risco:** Comportamento diferente entre versoes pode causar bugs em prod que nao aparecem em dev.

---

## 2. TypeORM Config

**Arquivo:** `backend/src/database/data-source.ts`

```typescript
entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
migrations: [path.join(__dirname, 'migrations', '**', '*.{ts,js}')],
synchronize: false,
migrationsRun: false,
```

- `synchronize: false` — correto para producao
- `migrationsRun: false` — migrations rodam via script separado (`run-migrations.ts`)
- SSL condicional via `DB_SSL=true`
- Extensao `uuid-ossp` configurada

### Problema: typeorm em devDependencies

```json
// backend/package.json
"devDependencies": {
  "typeorm": "^0.3.27"
}
```

`typeorm` esta em devDependencies. Em `Dockerfile.prod` com `npm ci --only=production`, typeorm NAO e instalado. Falha no build de producao.

**Nota:** `Dockerfile.micro` usa `npm install` (sem --only=production), por isso funciona em prod atualmente. Mas e um bug latente.

---

## 3. Inventario de Tabelas (30)

### 3.1 Tabelas Operacionais com tenant_id (24)

| Tabela | Entity | tenant_id | nullable | FK tenant | Indices |
|--------|--------|-----------|----------|-----------|---------|
| ambientes | Ambiente | Sim | **true** | Nao | nome |
| avaliacoes | Avaliacao | Sim | **true** | Nao | — |
| abertura_caixa | AberturaCaixa | Sim | **true** | Nao | — |
| clientes | Cliente | Sim | **true** | Nao | cpf (UNIQUE global!) |
| comandas | Comanda | Sim | **true** | Nao | codigo |
| comanda_agregados | ComandaAgregado | Sim | **true** | Nao | — |
| empresas | Empresa | Sim | **true** | Nao | — |
| eventos | Evento | Sim | **true** | Nao | — |
| funcionarios | Funcionario | Sim | **true** | Nao | email (UNIQUE global!) |
| item_pedido | ItemPedido | Sim | **true** | Nao | — |
| medalhas | Medalha | Sim | **true** | Nao | — |
| medalha_funcionario | MedalhaGarcom | Sim | **true** | Nao | — |
| mesas | Mesa | Sim | **true** | Nao | numero |
| paginas_evento | PaginaEvento | Sim | **true** | Nao | — |
| pagina_evento_media | PaginaEventoMedia | Sim | **true** | Nao | — |
| pedidos | Pedido | Sim | **true** | Nao | — |
| pontos_entrega | PontoEntrega | Sim | **true** | Nao | — |
| produtos | Produto | Sim | **true** | Nao | — |
| subscription | Subscription | Sim | **true** | FK tenant | — |
| payment_transactions | PaymentTransaction | Sim | **true** | Nao | — |
| turnos | Turno | Sim | **true** | Nao | — |
| audit_logs | AuditLog | Sim | **true** | Nao | — |

### 3.2 Tabelas Globais (4)

| Tabela | Entity | Proposito |
|--------|--------|----------|
| tenants | Tenant | Registro de cada bar/pub |
| plans | Plan | Planos de assinatura |
| payment_configs | PaymentConfig | Config gateways de pagamento |
| refresh_tokens | RefreshToken | Tokens de renovacao JWT |

### 3.3 Tabela de Sistema

| Tabela | Proposito |
|--------|----------|
| migrations | Controle de migrations TypeORM |

---

## 4. Problemas CRITICOS

### 4.1 tenant_id nullable em 24 tabelas

**Impacto:** O banco permite INSERT sem tenant_id. Se a camada de aplicacao falhar (bug, bypass, scheduler), dados ficam sem dono.

```sql
-- Isto e permitido hoje:
INSERT INTO pedidos (id, ...) VALUES (uuid_generate_v4(), ...);
-- tenant_id fica NULL
```

**Verificacao necessaria antes de corrigir:**
```sql
SELECT table_name, COUNT(*) 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
GROUP BY table_name;

-- Verificar dados orfaos:
SELECT 'ambientes' as tabela, COUNT(*) as orfaos FROM ambientes WHERE tenant_id IS NULL
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos WHERE tenant_id IS NULL
-- ... (repetir para todas 24 tabelas)
```

### 4.2 Zero Foreign Keys para tenants

Nenhuma das 24 tabelas tem:
```sql
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
```

**Impacto:**
- Deletar tenant nao limpa dados
- Dados orfaos se acumulam indefinidamente
- Sem integridade referencial

### 4.3 TenantAwareEntity existe mas ninguem herda

```typescript
// common/tenant/entities/tenant-aware.entity.ts
export abstract class TenantAwareEntity {
  @Column({ type: 'uuid', nullable: false })  // NOT NULL
  @Index()                                      // Com indice
  tenant_id: string;

  @ManyToOne(() => Tenant)                     // Com FK
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

Esta classe base CORRETA existe no codigo. Mas NENHUMA entity a herda. Todas definem tenant_id manualmente com `nullable: true` e sem FK.

### 4.4 Migration NOT NULL nao executada

A migration `MakeTenantIdNotNull` foi criada mas esta em `migrations_backup/` (fora do path de migrations). Nunca foi executada em producao.

---

## 5. Problemas ALTOS

### 5.1 Cliente.cpf UNIQUE Global

```typescript
@Column({ unique: true, nullable: true })
cpf: string;
```

UNIQUE global impede que Pub A e Pub B tenham clientes com o mesmo CPF. Em multi-tenant, deveria ser:

```typescript
@Unique(['cpf', 'tenant_id'])
```

### 5.2 Funcionario.email UNIQUE Global

Mesmo problema do CPF. Dois tenants nao podem ter funcionarios com o mesmo email.

**Nota:** Para login, o email precisa ser unico dentro do tenant (resolve-se pelo subdominio + email). Mas UNIQUE global e excessivo.

### 5.3 empresaId Legado

`Funcionario` e `PontoEntrega` mantam coluna `empresaId` que era o antigo sistema de isolamento. Coexiste com `tenant_id`, criando confusao.

### 5.4 Faltam 7 Indices Compostos

Queries de relatorios (analytics, listagens com filtro) fazem:
```sql
WHERE tenant_id = ? AND status = ? AND criadoEm BETWEEN ? AND ?
```

Sem indices compostos, estas queries fazem full table scan + filter.

**Indices necessarios:**

| Tabela | Indice proposto |
|--------|----------------|
| pedidos | (tenant_id, status, criadoEm) |
| item_pedido | (tenant_id, status, criadoEm) |
| comandas | (tenant_id, status, criadoEm) |
| abertura_caixa | (tenant_id, abertoEm) |
| funcionarios | (tenant_id, cargo, status) |
| produtos | (tenant_id, ativo) |
| audit_logs | (tenant_id, entityName, criadoEm) |

### 5.5 Scripts SQL Soltos na Raiz

10 scripts SQL na raiz do projeto sem controle:

```
add-ordem-column.sql
check-ambiente.sql
check-pedido.sql
check-users.sql
create-admin.sql
create-agregados-table.sql
rename-agregados.sql
test-quase-pronto.sql
```

**Risco:** Alguem pode executar estes scripts diretamente, bypassando migrations.

---

## 6. Migrations

### 6.1 Execucao

Migrations rodam automaticamente no boot via `run-migrations.ts`:

```typescript
const dataSource = new DataSource(dataSourceOptions);
await dataSource.initialize();
const migrations = await dataSource.runMigrations({ transaction: 'all' });
```

Se falhar, o boot e abortado (correto).

### 6.2 Migrations Pendentes Conhecidas

| Migration | Status | Impacto |
|----------|--------|---------|
| MakeTenantIdNotNull | Em migrations_backup/ | tenant_id continua nullable |
| EnforceMultiTenantIsolation | Em migrations_backup/ | Sem FKs |
| AddCompositeIndexes | Nao existe | Sem indices compostos |

### 6.3 ci.yml Migration Test

O CI roda migrations como parte do job backend:
```yaml
- name: Run migrations
  run: npm run migration:run
  env:
    DB_HOST: localhost
    DB_PORT: 5432
```

Funciona com PG 15 no CI mas prod usa PG 17.

---

## 7. Seeder

**Arquivo:** `backend/src/database/seeder.service.ts`

Executa na primeira inicializacao se tabelas estiverem vazias:

| Dado | Quantidade |
|------|-----------|
| Ambientes de preparo | 5 (Cozinha, Bar, Pizzaria, etc.) |
| Ambientes de atendimento | 3 (Salao, Varanda, Jardim) |
| Mesas | 22 |
| Produtos | 42 |
| Clientes | 5 |
| Comandas abertas | 5 |

Requer `DEFAULT_TENANT_ID` no .env para atribuir tenant aos dados seed.

---

## 8. Divergencias Documentacao vs Codigo

| Documento | Afirmacao | Realidade |
|-----------|----------|-----------|
| docs/database/schema.md | 16 tabelas | **30 tabelas** |
| docs/database/schema.md | Isolamento via empresaId | **tenant_id** |
| docs/database/schema.md | Nomes no singular | **Nomes no plural** |
| docs/current/ARQUITETURA.md | PostgreSQL 15 | **17 em producao** |
| DEPLOY_HIBRIDO.md | Neon Cloud | **PostgreSQL Docker local** |

**Nota:** `docs/database/schema.md` foi reescrito na auditoria anterior (716 linhas, 30 tabelas documentadas). A versao atualizada esta correta.

---

## 9. Correcoes Propostas

### Fase 1 — Dados Existentes (antes de alterar schema)

```sql
-- 1. Verificar dados orfaos
SELECT 'ambientes' as t, COUNT(*) FROM ambientes WHERE tenant_id IS NULL
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos WHERE tenant_id IS NULL
-- ... todas 24 tabelas

-- 2. Se houver orfaos, atribuir ao tenant padrao ou deletar
UPDATE ambientes SET tenant_id = 'DEFAULT_TENANT_UUID' WHERE tenant_id IS NULL;
```

### Fase 2 — Schema (migration)

```sql
-- 3. NOT NULL em todas 24 tabelas
ALTER TABLE ambientes ALTER COLUMN tenant_id SET NOT NULL;
-- ... repetir

-- 4. FKs com CASCADE
ALTER TABLE ambientes ADD CONSTRAINT fk_ambientes_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- ... repetir

-- 5. Indices compostos
CREATE INDEX idx_pedidos_tenant_status_data ON pedidos(tenant_id, status, "criadoEm");
-- ... mais 6
```

### Fase 3 — Codigo

```
6. Fazer todas entities herdarem TenantAwareEntity
7. Alterar Cliente.cpf para UNIQUE [cpf, tenant_id]
8. Alterar Funcionario.email para UNIQUE [email, tenant_id]
9. Remover empresaId de Funcionario e PontoEntrega
10. Mover typeorm de devDeps para deps
11. Alinhar PG para v17 em todos os compose files
12. Mover scripts SQL soltos para migrations ou deletar
```
