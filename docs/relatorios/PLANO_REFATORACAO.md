# Plano de Refatoracao — Pub System

**Data:** 2026-03-06
**Base:** AUDITORIA_BANCO.md (28 problemas), AUDITORIA_INFRA.md (33 problemas), AUDITORIA_MULTITENANT.md
**Regra:** NAO quebrar API existente. Manter compatibilidade.
**Metodo:** Commits atomicos, testavel a cada passo.

---

## Resumo Executivo

| Fase | Commits | Foco | Risco |
|------|---------|------|-------|
| **Fase 0** | C01-C03 | Seguranca urgente (credenciais) | Nenhum |
| **Fase 1** | C04-C07 | Dependencias e config | Baixo |
| **Fase 2** | C08-C12 | Multi-tenant (entidades + migration) | Medio |
| **Fase 3** | C13-C15 | Indices e constraints | Baixo |
| **Fase 4** | C16-C19 | CI/CD e Docker | Baixo |
| **Fase 5** | C20-C22 | Limpeza de arquivos | Nenhum |
| **Total** | **22 commits** | — | — |

---

## Fase 0 — Seguranca Urgente (Dia 1)

### C01: security: remove exposed credentials from tracked files

**Problema:** P0 — JWT Secret, DB passwords, admin creds, IP em plaintext no HEAD.

**Arquivos a DELETAR:**

```
DEPLOY_HIBRIDO.md                   ← JWT Secret, DB Password Neon, admin creds
GUIA_RAPIDO_SERVIDORES.md           ← admin creds, SSH IP
```

**Arquivos a EDITAR (remover senhas em plaintext):**

```
docs/infra/banco-de-dados.md        ← SenhaForte123, pubuser
  Substituir: DATABASE_URL=postgresql://pubuser:SenhaForte123@...
  Por:        DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pub-postgres:5432/${POSTGRES_DB}

docs/infra/backup-e-restore.md      ← test123
  Substituir valores literais por ${VAR} placeholders

docs/historico/ARCHITECTURE.md       ← SenhaForte123
  Substituir por placeholder
```

**Acao manual pos-commit:**
1. Rotacionar JWT_SECRET em producao: `openssl rand -base64 64`
2. Rotacionar DB_PASSWORD em producao
3. Alterar senha admin em producao
4. Considerar BFG Repo-Cleaner para historico Git

**Risco:** Nenhum. Apenas docs.

---

### C02: security: force synchronize false, remove DB_SYNC env var

**Problema:** P0-P1 — `process.env.DB_SYNC === 'true'` pode ativar synchronize em prod.

**Arquivo:** `backend/src/app.module.ts`

```
Linha 151:
  ANTES:  synchronize: process.env.DB_SYNC === 'true',
  DEPOIS: synchronize: false,
```

Tambem remover comentarios obsoletos "Neon Cloud" (linhas 152-175):

```
Linha 152-171: Remover comentarios "Neon Cloud" e simplificar extra config:
  ANTES:  // SSL obrigatório para Neon Cloud
          // ✅ CORREÇÃO: Configurações otimizadas para Neon Cloud
          extra: { max: 5, min: 1, idleTimeoutMillis: 10000, ... }
  DEPOIS: // Connection pool
          extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            keepAlive: true,
            application_name: 'pub-system-backend',
          },
          retryAttempts: 5,
          retryDelay: 3000,
```

**Risco:** Nenhum. synchronize ja esta false em prod. Aumentar pool de 5→10 melhora concorrencia.

---

### C03: security: uncomment hashPassword BeforeInsert

**Problema:** P1 — `@BeforeInsert hashPassword` esta COMENTADO.

**Arquivo:** `backend/src/modulos/funcionario/entities/funcionario.entity.ts`

```
Linhas 77-80:
  ANTES:  //@BeforeInsert()
          //async hashPassword() {
          // this.senha = await bcrypt.hash(this.senha, 10);
          //} --->>>>>  comentei para testes
  DEPOIS: @BeforeInsert()
          async hashPassword() {
            this.senha = await bcrypt.hash(this.senha, 10);
          }
```

**IMPORTANTE:** Verificar se o servico `FuncionarioService.create()` ja faz hash antes de salvar. Se sim, o `@BeforeInsert` pode duplicar o hash. Verificar antes de aplicar.

**Risco:** Medio — testar login apos commit.

---

## Fase 1 — Dependencias e Config (Dia 2-3)

### C04: deps: align nestjs to v11, move typeorm to dependencies

**Problema:** P0 — @nestjs/common@10 vs @nestjs/core@11. TypeORM em devDeps.

**Arquivo:** `backend/package.json`

```json
// dependencies — ALTERAR:
"@nestjs/common": "^10.0.0"     →  "@nestjs/common": "^11.0.0"
"@nestjs/jwt": "^10.2.0"        →  "@nestjs/jwt": "^11.0.0"

// MOVER de devDependencies para dependencies:
"typeorm": "^0.3.27"             →  (mover para dependencies)

// devDependencies — ALTERAR:
"@nestjs/schematics": "^10.0.0" →  "@nestjs/schematics": "^11.0.0"
```

**Apos editar:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build   # verificar se compila
npm test        # verificar se testes passam
```

**Risco:** Medio — possiveis breaking changes do NestJS v10→v11. Testar tudo.

---

### C05: deps: remove --force from Dockerfile, use --legacy-peer-deps

**Problema:** P1 — `npm install --force` mascara erros.

**Arquivo:** `backend/Dockerfile`

```dockerfile
Linha 17:
  ANTES:  RUN npm install --force
  DEPOIS: RUN npm install --legacy-peer-deps
```

**Pre-requisito:** C04 (NestJS alinhado) ja deve estar aplicado.

**Risco:** Baixo — apos C04 o mismatch nao existe mais.

---

### C06: config: align PostgreSQL to v17 everywhere

**Problema:** P1 — PG 15 em dev/CI vs PG 17 em prod.

**Arquivos:**

```
docker-compose.yml (raiz):
  Linha 62:  image: postgres:15-alpine  →  image: postgres:17-alpine

.github/workflows/ci.yml:
  Linha 25:  image: postgres:15-alpine  →  image: postgres:17-alpine
```

**Risco:** Baixo — PG 17 e backward compatible com PG 15.

---

### C07: config: fix env_file paths and NEXT_PUBLIC_API_URL in compose

**Problema:** P1 — env_file `./backend/.env` nao existe; NEXT_PUBLIC_API_URL com nome Docker.

**Arquivo:** `docker-compose.prod.yml` (raiz)

```yaml
Linha 20:
  ANTES:  env_file: ./backend/.env
  DEPOIS: env_file: ./.env

Linha 51:
  ANTES:  NEXT_PUBLIC_API_URL=http://backend:3000
  DEPOIS: NEXT_PUBLIC_API_URL=${BACKEND_URL:-https://api.pubsystem.com.br}
```

**Risco:** Nenhum. docker-compose.prod.yml nao e usado em prod atualmente.

---

## Fase 2 — Multi-Tenant (Dia 4-7)

### C08: entities: make all 24 entities extend TenantAwareEntity

**Problema:** P0 — tenant_id nullable em 25 tabelas, zero FKs, TenantAwareEntity nao usada.

**Estrategia:** Fazer heranca de `TenantAwareEntity` mas **manter nullable: true por enquanto** (migration futura torna NOT NULL). Isso adiciona a FK mas nao quebra dados existentes.

**Arquivo base a editar:** `backend/src/common/tenant/entities/tenant-aware.entity.ts`

```typescript
// ANTES:
export abstract class TenantAwareEntity {
  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

// DEPOIS: Adicionar nullable temporario para compatibilidade
export abstract class TenantAwareEntity {
  @Index()
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

**24 entity files a editar (mesmo padrao para cada um):**

Para CADA entity abaixo, fazer:
1. Adicionar `import { TenantAwareEntity } from '...'`
2. Mudar `export class X {` para `export class X extends TenantAwareEntity {`
3. REMOVER as linhas manuais de tenantId e indice (herda da base)

```
backend/src/modulos/ambiente/entities/ambiente.entity.ts
  - Remover: @Index('idx_ambiente_tenant_id') + @Column tenant_id (linhas 45-47)
  - Adicionar: extends TenantAwareEntity
  - MANTER: @Index('idx_ambiente_nome_tenant', ['nome', 'tenantId']) ← indice composto fica

backend/src/modulos/mesa/entities/mesa.entity.ts
  - Remover: @Index('idx_mesa_tenant_id') + @Column tenant_id (linhas 60-62)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/produto/entities/produto.entity.ts
  - Remover: @Index('idx_produto_tenant_id') + @Column tenant_id (linhas 35-37)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/comanda/entities/comanda.entity.ts
  - Remover: @Index('idx_comanda_tenant_id') + @Column tenant_id (linhas 93-95)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/comanda/entities/comanda-agregado.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 40-42)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/pedido/entities/pedido.entity.ts
  - Remover: @Index('idx_pedido_tenant_id') + @Column tenant_id (linhas 84-86)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/pedido/entities/item-pedido.entity.ts
  - Remover: @Index('idx_item_pedido_tenant_id') + @Column tenant_id (linhas 117-119)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/pedido/entities/retirada-item.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 67-69)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/cliente/entities/cliente.entity.ts
  - Remover: @Index('idx_cliente_tenant_id') + @Column tenant_id (linhas 53-55)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/funcionario/entities/funcionario.entity.ts
  - Remover: @Index('idx_funcionario_tenant_id') + @Column tenant_id (linhas 73-75)
  - Adicionar: extends TenantAwareEntity
  - MANTER: @Index('idx_funcionario_email_tenant', ['email', 'tenantId']) ← composto fica

backend/src/modulos/empresa/entities/empresa.entity.ts
  - Remover: @Index('idx_empresa_tenant_id') + @Column tenant_id (linhas 39-41)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/evento/entities/evento.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 48-50)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/pagina-evento/entities/pagina-evento.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 34-36)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/ponto-entrega/entities/ponto-entrega.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 88-90)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/caixa/entities/abertura-caixa.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 77-79)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/caixa/entities/fechamento-caixa.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 143-145)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/caixa/entities/sangria.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 67-69)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/caixa/entities/movimentacao-caixa.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 90-92)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/avaliacao/entities/avaliacao.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 52-54)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/turno/entities/turno-funcionario.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 54-56)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/medalha/entities/medalha.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 69-71)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/medalha/entities/medalha-garcom.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 45-47)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/audit/entities/audit-log.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 79-81)
  - Adicionar: extends TenantAwareEntity

backend/src/modulos/estabelecimento/entities/layout-estabelecimento.entity.ts
  - Remover: @Index + @Column tenant_id (linhas 44-46)
  - Adicionar: extends TenantAwareEntity
```

**Impacto:** Coluna `tenant_id` permanece identica no banco (mesmo nome, mesmo tipo, mesmo nullable). A diferenca e que agora TypeORM sabe que existe uma FK para `tenants`. Se `synchronize` estiver off (e esta), nada muda no banco ate a migration.

**Risco:** Baixo — sem mudanca no schema real. Testar build e testes.

---

### C09: entities: fix Cliente.cpf UNIQUE to composite (cpf + tenantId)

**Problema:** P0 — cpf UNIQUE global impede mesmo CPF em tenants diferentes.

**Arquivo:** `backend/src/modulos/cliente/entities/cliente.entity.ts`

```typescript
// ANTES:
@Entity('clientes')
export class Cliente extends TenantAwareEntity {
  ...
  @Index('idx_cliente_cpf')
  @Column({ unique: true, length: 14 })
  cpf: string;

// DEPOIS:
@Entity('clientes')
@Index('idx_cliente_cpf_tenant', ['cpf', 'tenantId'], { unique: true })
export class Cliente extends TenantAwareEntity {
  ...
  @Column({ length: 14 })   // remover unique: true
  cpf: string;
```

**Migration necessaria (C11):** DROP old unique, ADD composite unique.

**Risco:** Medio — requer migration coordenada.

---

### C10: entities: fix Mesa UNIQUE to include tenantId

**Problema:** P1 — UNIQUE (numero, ambiente) sem tenant_id.

**Arquivo:** `backend/src/modulos/mesa/entities/mesa.entity.ts`

```typescript
// ANTES:
@Entity('mesas')
@Unique(['numero', 'ambiente'])
export class Mesa extends TenantAwareEntity {

// DEPOIS:
@Entity('mesas')
@Unique(['numero', 'ambiente', 'tenantId'])
export class Mesa extends TenantAwareEntity {
```

**Risco:** Baixo — se ja existe isolamento por ambiente/tenant, nao ha conflitos.

---

### C11: migration: add tenant_id FKs, fix UNIQUE constraints, NOT NULL

**Problema:** P0 — tudo acima precisa de migration real.

**Arquivo NOVO:** `backend/src/database/migrations/TIMESTAMP-MultiTenantForeignKeys.ts`

**O que a migration faz (em ordem):**

```sql
-- 1. Preencher tenant_id NULL com tenant padrao
UPDATE ambientes SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
-- (repetir para todas 24 tabelas)

-- 2. ALTER tenant_id SET NOT NULL (todas 24 tabelas)
ALTER TABLE ambientes ALTER COLUMN tenant_id SET NOT NULL;
-- (repetir para todas 24 tabelas + refresh_tokens)

-- 3. ADD FK tenant_id → tenants(id) ON DELETE CASCADE (24 tabelas)
ALTER TABLE ambientes ADD CONSTRAINT fk_ambientes_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- (repetir para todas 24 tabelas)

-- 4. ADD FK payment_transactions → tenants(id) ON DELETE CASCADE
ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_tenant
  FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. FIX Cliente.cpf UNIQUE
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS "UQ_clientes_cpf";
DROP INDEX IF EXISTS "idx_cliente_cpf";
CREATE UNIQUE INDEX idx_cliente_cpf_tenant ON clientes (cpf, tenant_id);

-- 6. FIX Mesa UNIQUE
ALTER TABLE mesas DROP CONSTRAINT IF EXISTS "UQ_mesas_numero_ambiente";
CREATE UNIQUE INDEX idx_mesa_numero_ambiente_tenant ON mesas (numero, "ambiente_id", tenant_id);
```

**Tabelas completas para steps 1-3:**

```
ambientes, avaliacoes, clientes, comanda_agregados, comandas,
empresas, eventos, funcionarios, mesas, paginas_evento,
pedidos, itens_pedido, retiradas_itens, pontos_entrega,
produtos, sangrias, turnos_funcionario, aberturas_caixa,
fechamentos_caixa, movimentacoes_caixa, medalhas, medalhas_garcons,
audit_logs, layouts_estabelecimento
```

**Pre-requisito na VM:**
```bash
# ANTES de rodar migration, verificar orfaos:
docker exec pub-postgres psql -U pubuser -d pubsystem -c "
  SELECT 'ambientes' as t, COUNT(*) FROM ambientes WHERE tenant_id IS NULL
  UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos WHERE tenant_id IS NULL
  UNION ALL SELECT 'comandas', COUNT(*) FROM comandas WHERE tenant_id IS NULL
  -- ... todas as tabelas
"
```

**Risco:** ALTO — migration destrutiva. SEMPRE backup antes. Testar em dev primeiro.

---

### C12: entities: update TenantAwareEntity to NOT NULL after migration

**Problema:** Apos migration C11, remover nullable temporario.

**Arquivo:** `backend/src/common/tenant/entities/tenant-aware.entity.ts`

```typescript
// ANTES (temporario do C08):
@Column({ type: 'uuid', name: 'tenant_id', nullable: true })
tenantId: string;

@ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })

// DEPOIS (definitivo):
@Column({ type: 'uuid', name: 'tenant_id' })
tenantId: string;

@ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
```

**Risco:** Nenhum — migration ja garantiu NOT NULL no banco.

---

## Fase 3 — Indices e Constraints (Dia 8-9)

### C13: migration: add 14 composite indexes for multi-tenant queries

**Arquivo NOVO:** `backend/src/database/migrations/TIMESTAMP-AddCompositeIndexes.ts`

```sql
-- Dashboard: comandas abertas por tenant
CREATE INDEX idx_comanda_tenant_status ON comandas (tenant_id, status);
CREATE INDEX idx_comanda_tenant_data ON comandas (tenant_id, "dataAbertura");

-- Cozinha: pedidos/itens por status
CREATE INDEX idx_pedido_tenant_status ON pedidos (tenant_id, status);
CREATE INDEX idx_pedido_tenant_data ON pedidos (tenant_id, data);
CREATE INDEX idx_item_pedido_tenant_status ON itens_pedido (tenant_id, status);

-- Mapa de mesas
CREATE INDEX idx_mesa_tenant_status ON mesas (tenant_id, status);

-- Cardapio: produtos ativos
CREATE INDEX idx_produto_tenant_ativo ON produtos (tenant_id, ativo);

-- Funcionarios por cargo
CREATE INDEX idx_funcionario_tenant_cargo ON funcionarios (tenant_id, cargo, status);

-- Caixa
CREATE INDEX idx_abertura_caixa_tenant_status ON aberturas_caixa (tenant_id, status);

-- Financeiro
CREATE INDEX idx_movimentacao_tenant_data ON movimentacoes_caixa (tenant_id, data);

-- Turnos
CREATE INDEX idx_turno_tenant_func_ativo ON turnos_funcionario (tenant_id, "funcionario_id", ativo);

-- Avaliacoes
CREATE INDEX idx_avaliacao_tenant_data ON avaliacoes (tenant_id, "criadoEm");

-- Audit logs com tenant
CREATE INDEX idx_audit_tenant_date ON audit_logs (tenant_id, "createdAt");
```

**Risco:** Baixo — CREATE INDEX CONCURRENTLY nao bloqueia tabelas (se PG 12+).

---

### C14: migration: add CHECK constraints

**Arquivo NOVO:** `backend/src/database/migrations/TIMESTAMP-AddCheckConstraints.ts`

```sql
ALTER TABLE avaliacoes ADD CONSTRAINT chk_avaliacao_nota
  CHECK (nota >= 1 AND nota <= 5);

ALTER TABLE produtos ADD CONSTRAINT chk_produto_preco
  CHECK (preco >= 0);

ALTER TABLE sangrias ADD CONSTRAINT chk_sangria_valor
  CHECK (valor > 0);

ALTER TABLE movimentacoes_caixa ADD CONSTRAINT chk_movimentacao_valor
  CHECK (valor >= 0);

ALTER TABLE aberturas_caixa ADD CONSTRAINT chk_abertura_valor_inicial
  CHECK ("valorInicial" >= 0);
```

**Risco:** Baixo — se dados existentes violam, migration falha. Verificar antes.

---

### C15: entities: add CHECK decorators to match migration

**Arquivos a editar:**

```
backend/src/modulos/avaliacao/entities/avaliacao.entity.ts
  Adicionar: @Check('chk_avaliacao_nota', '"nota" >= 1 AND "nota" <= 5')

backend/src/modulos/produto/entities/produto.entity.ts
  Adicionar: @Check('chk_produto_preco', '"preco" >= 0')

backend/src/modulos/caixa/entities/sangria.entity.ts
  Adicionar: @Check('chk_sangria_valor', '"valor" > 0')

backend/src/modulos/caixa/entities/movimentacao-caixa.entity.ts
  Adicionar: @Check('chk_movimentacao_valor', '"valor" >= 0')

backend/src/modulos/caixa/entities/abertura-caixa.entity.ts
  Adicionar: @Check('chk_abertura_valor_inicial', '"valorInicial" >= 0')
```

**Risco:** Nenhum — decorators apenas documentam o que a migration ja criou.

---

## Fase 4 — CI/CD e Docker (Dia 10-12)

### C16: ci: fix deploy job to use Docker instead of PM2

**Arquivo:** `.github/workflows/ci.yml`

```yaml
# Linhas 168-175 — SUBSTITUIR BLOCO deploy SSH:
ANTES:
  ssh -i ~/.ssh/deploy_key $SSH_USER@$SSH_HOST << 'ENDSSH'
    cd /home/ubuntu/pub-system/backend
    git pull origin main
    npm ci --legacy-peer-deps
    npm run build
    npm run typeorm:migration:run
    pm2 restart pub-backend || pm2 start dist/main.js --name pub-backend
  ENDSSH

DEPOIS:
  ssh -i ~/.ssh/deploy_key $SSH_USER@$SSH_HOST << 'ENDSSH'
    cd /home/ubuntu/pub-system
    ./scripts/deploy.sh --force
  ENDSSH
```

```yaml
# Linhas 202-207 — SUBSTITUIR BLOCO rollback SSH:
ANTES:
  ssh -i ~/.ssh/deploy_key $SSH_USER@$SSH_HOST << 'ENDSSH'
    cd /home/ubuntu/pub-system/backend
    git checkout HEAD~1
    npm run build
    pm2 restart pub-backend
  ENDSSH

DEPOIS:
  ssh -i ~/.ssh/deploy_key $SSH_USER@$SSH_HOST << 'ENDSSH'
    cd /home/ubuntu/pub-system
    ./scripts/rollback.sh --force
  ENDSSH
```

```yaml
# Tambem corrigir:
Linha 86:  continue-on-error: true    →  remover (E2E deve falhar o CI)
Linha 133: npm audit || true          →  npm audit --audit-level=high || true
Linha 137: npm audit || true          →  npm audit --audit-level=high || true
Linha 180: continue-on-error: true    →  remover
```

**Risco:** Baixo — deploy.sh ja funciona, apenas integramos no CI.

---

### C17: ci: align PG to v17 in CI (already done in C06 if combined)

Se C06 ja fez, pular. Senao:

**Arquivo:** `.github/workflows/ci.yml`

```yaml
Linha 25:  image: postgres:15-alpine  →  image: postgres:17-alpine
```

---

### C18: docker: delete 3 duplicate compose files in infra/

**Arquivos a DELETAR:**

```
infra/docker-compose.yml             ← identico a raiz/docker-compose.yml
infra/docker-compose.prod.yml        ← divergente (PG 17) — mesclar diferenca no raiz
infra/docker-compose.micro.yml       ← divergente (env_file) — mesclar no raiz
```

**Arquivo a EDITAR (mesclar diferencas do infra/):**

`docker-compose.prod.yml` (raiz) ja foi corrigido no C06 (PG 17) e C07 (env_file).

`docker-compose.micro.yml` (raiz):
```yaml
# Atualizar comentario
Linha 7:
  ANTES:  # - Database: Neon PostgreSQL (cloud)
  DEPOIS: # - Database: PostgreSQL 17 local (Docker)
```

**Risco:** Nenhum — infra/ nunca era referenciado pelo deploy.sh.

---

### C19: docker: fix frontend Dockerfile (remove Cypress deps)

**Arquivo:** `frontend/Dockerfile`

```dockerfile
# ANTES (Debian + Cypress):
FROM node:20
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev \
    libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# DEPOIS (Alpine, sem Cypress):
FROM node:20-alpine
```

**Risco:** Baixo — Cypress nunca foi usado, projeto usa Playwright.

---

## Fase 5 — Limpeza (Dia 13-14)

### C20: cleanup: delete duplicate files from root (scripts already in scripts/)

**Arquivos a DELETAR (30 duplicatas confirmadas):**

SQL (8 — copias em scripts/db/):
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

PS1 (13 — copias em scripts/deploy/ ou scripts/tests/ ou scripts/maintenance/):
```
docker-rebuild.ps1
docker-start.ps1
instalar-dependencias.ps1
setup.ps1
verify-setup.ps1
aplicar-expiracao-4h.ps1
executar-migration-avaliacao.ps1
executar-migration-tempo.ps1
reset-sistema.ps1
test-cache-validation.ps1
test-invalidacao-cache-demo.ps1
test-sprint-2-1.ps1
test-sprint-2-2-cache-invalidation.ps1
```

JSON (7 — copias em scripts/tests/):
```
test_ambientes.json
test_mesas.json
test_produtos.json
test_produtos_1.json
test_produtos_2.json
test_produtos_page2.json
test_produtos_preco.json
```

Outros (2):
```
debug-token.html
login.json
```

**Total: 30 arquivos a deletar.**

**Risco:** Nenhum — copias ja existem em scripts/.

---

### C21: cleanup: delete test-medalhas.ps1 and sprint ps1 from root

**Arquivos adicionais na raiz:**

```
test-medalhas.ps1                    ← copia em scripts/tests/
test-sprint-3-4-completo.ps1        ← copia em scripts/tests/
RELATORIO-VALIDACAO-CACHE-SPRINT-2-2.md  ← mover para docs/historico/
```

**Risco:** Nenhum.

---

### C22: cleanup: move migrations_backup and migrations_old to archive

**Problema:** P2 — 33 migrations mortas confundem.

**Acao:**

```
backend/src/database/migrations_backup/  →  DELETAR pasta inteira
backend/src/database/migrations_old/     →  DELETAR pasta inteira
```

**Justificativa:** Nenhuma foi executada. O historico esta no Git. As novas migrations (C11, C13, C14) substituem as planejadas.

**Risco:** Nenhum — nunca foram usadas.

---

## Resumo de Arquivos por Commit

| Commit | Arquivos Alterados | Arquivos Deletados | Arquivos Novos |
|--------|-------------------|-------------------|---------------|
| C01 | 3 docs editados | 2 docs deletados | — |
| C02 | 1 (app.module.ts) | — | — |
| C03 | 1 (funcionario.entity.ts) | — | — |
| C04 | 1 (package.json) | — | — |
| C05 | 1 (Dockerfile) | — | — |
| C06 | 2 (docker-compose.yml, ci.yml) | — | — |
| C07 | 1 (docker-compose.prod.yml) | — | — |
| C08 | 25 (tenant-aware + 24 entities) | — | — |
| C09 | 1 (cliente.entity.ts) | — | — |
| C10 | 1 (mesa.entity.ts) | — | — |
| C11 | — | — | 1 migration |
| C12 | 1 (tenant-aware.entity.ts) | — | — |
| C13 | — | — | 1 migration |
| C14 | — | — | 1 migration |
| C15 | 5 entities | — | — |
| C16 | 1 (ci.yml) | — | — |
| C17 | (coberto por C06) | — | — |
| C18 | 1 (micro.yml) | 3 compose files | — |
| C19 | 1 (frontend/Dockerfile) | — | — |
| C20 | — | 30 arquivos | — |
| C21 | — | 3 arquivos | — |
| C22 | — | 2 pastas (~33 files) | — |

---

## Ordem de Execucao e Dependencias

```
C01 ─── (independente)
C02 ─── (independente)
C03 ─── (independente, testar login)
C04 ─── (independente, testar build)
C05 ─── depende de C04
C06 ─── (independente)
C07 ─── (independente)
C08 ─── depende de C04 (build deve funcionar)
C09 ─── depende de C08
C10 ─── depende de C08
C11 ─── depende de C08 + C09 + C10 (migration aplica tudo)
C12 ─── depende de C11 (migration executada)
C13 ─── depende de C11
C14 ─── depende de C11
C15 ─── depende de C14
C16 ─── (independente)
C18 ─── depende de C06 + C07
C19 ─── (independente)
C20 ─── (independente)
C21 ─── (independente)
C22 ─── (independente)
```

---

## Checklist Pre-Deploy de Cada Fase

### Antes da Fase 2 (Multi-Tenant)

- [ ] `npm run build` compila sem erros
- [ ] `npm test` passa
- [ ] Backup completo do banco (`./scripts/backup.sh`)
- [ ] Verificar registros com tenant_id IS NULL
- [ ] Ter tenant padrao criado no banco

### Antes da Migration C11

- [ ] Backup COMPLETO do banco
- [ ] Testar migration em ambiente local primeiro
- [ ] Verificar que NENHUM registro tem tenant_id IS NULL
- [ ] Confirmar que tabela `tenants` tem pelo menos 1 registro
- [ ] Deploy em horario de baixo uso

### Apos cada Fase

- [ ] `curl https://api.pubsystem.com.br/health` retorna 200
- [ ] Login funciona (testar com credenciais reais)
- [ ] Criar pedido de teste
- [ ] WebSocket funciona (acompanhar pedido em tempo real)
- [ ] Manter backup por 72h

---

## Metricas de Sucesso Final

| Metrica | Antes | Depois |
|---------|-------|--------|
| Credenciais no HEAD | 5+ | **0** |
| NestJS version mismatch | v10/v11 | **v11 unico** |
| typeorm em devDeps | Sim | **dependencies** |
| tenant_id NOT NULL | 2/27 (7%) | **27/27 (100%)** |
| FK tenant_id → tenants | 1/25 (4%) | **25/25 (100%)** |
| Entities herdam TenantAwareEntity | 0/24 | **24/24** |
| Indices compostos tenant | 2 | **16** |
| CHECK constraints | 1 | **6** |
| Docker compose files | 6 | **3** |
| Arquivos soltos na raiz | 43 | **~8** |
| CI/CD deploy funciona | Nao | **Sim** |
| PG versao alinhada | 15/17 mix | **17 unico** |
| synchronize hardcoded false | Nao (env var) | **Sim** |
| Migrations mortas | 33 | **0** |
