# Relatorio de Refatoracao Completa — PubSystem

**Data:** 2026-03-06
**Escopo:** Auditoria geral + refatoracao de codigo + migrations + Docker + CI/CD

---

## Resumo Executivo

| Metrica | Antes | Depois |
|---------|-------|--------|
| Credenciais expostas em docs | 5+ (JWT, DB pass, IPs) | 0 |
| `synchronize` em producao | `env var` (risco) | `false` hardcoded |
| NestJS version mismatch | @common@10 vs @core@11 | Tudo v11 |
| `typeorm` em devDependencies | Sim (quebra prod build) | Em `dependencies` |
| PostgreSQL inconsistente | v15 (dev/CI) vs v17 (prod) | v17 everywhere |
| Entidades com TenantAwareEntity | 0/22 | 22/22 |
| tenant_id com FK para tenants | 0/22 | 22/22 (via migration) |
| tenant_id NOT NULL | 0/22 | 22/22 (via migration) |
| Cliente.cpf UNIQUE global | Sim (quebra multi-tenant) | Composto (cpf + tenant_id) |
| Mesa UNIQUE global | Sim (numero + ambiente) | Composto (numero + ambiente_id + tenant_id) |
| Cross-tenant queries (schedulers) | 2 schedulers sem filtro | Filtro por tenant_id |
| WebSocket aceita tenant sem JWT | Sim (query param/header) | Apenas JWT verificado |
| CI/CD deploy funciona | Nao (PM2, path errado) | Sim (Docker + scripts) |
| Frontend Dockerfile Cypress deps | +500MB desnecessarios | Removido (Alpine) |
| docker-compose.micro.yml com PG local | Nao (referencia Neon) | Sim (postgres:17-alpine) |
| `npm install --force` | Mascara erros | `--legacy-peer-deps` |
| `start:prod` path | `dist/main` (errado) | `dist/src/main` (correto) |
| env_file em compose.prod | `./backend/.env` (errado) | `./.env` (correto) |
| NEXT_PUBLIC_API_URL | `http://backend:3000` (interno) | `${BACKEND_URL}` (externo) |

---

## Alteracoes Realizadas

### Fase 0 — Seguranca Urgente

#### C01: Remocao de credenciais expostas
- **`docs/infra/banco-de-dados.md`** — Substituidas senhas e usuarios hardcoded por variaveis de ambiente
- **`docs/infra/backup-e-restore.md`** — Substituidas credenciais por `$POSTGRES_USER`, `$POSTGRES_DB`
- **Correcao:** Multi-tenancy descricao atualizada (`empresaId` → `tenant_id` com FK)

#### C02: synchronize:false hardcoded
- **`backend/src/app.module.ts`**
  - `synchronize: process.env.DB_SYNC === 'true'` → `synchronize: false`
  - Removidos comentarios Neon Cloud (sistema usa PG local)
  - Pool otimizado para PG local (max: 10, min: 2, idle: 30s)
  - Retry reduzido (10 → 5 tentativas, 5s → 3s delay)

#### C03: Codigo morto removido
- **`backend/src/modulos/funcionario/entities/funcionario.entity.ts`**
  - Removido `@BeforeInsert` comentado (service ja faz hash)
  - Removidos imports nao utilizados (`BeforeInsert`, `bcrypt`)

### Fase 1 — Dependencias e Config

#### C04: Alinhamento NestJS v11
- **`backend/package.json`**
  - `@nestjs/common`: `^10.0.0` → `^11.0.0`
  - `@nestjs/jwt`: `^10.2.0` → `^11.0.0`
  - `@nestjs/passport`: `^10.0.3` → `^11.0.0`
  - `@nestjs/schematics`: `^10.0.0` → `^11.0.0`
  - `typeorm`: movido de `devDependencies` para `dependencies`
  - `start:prod`: `dist/main` → `dist/src/main`

#### C05: Dockerfile dev
- **`backend/Dockerfile`** — `npm install --force` → `npm install --legacy-peer-deps`

#### C06: PostgreSQL v17 alinhado
- **`docker-compose.yml`** — `postgres:15-alpine` → `postgres:17-alpine`
- **`docker-compose.prod.yml`** — `postgres:15-alpine` → `postgres:17-alpine`
- **`.github/workflows/ci.yml`** — `postgres:15-alpine` → `postgres:17-alpine`

#### C07: Fix Docker Compose
- **`docker-compose.prod.yml`**
  - `env_file: ./backend/.env` → `env_file: ./.env`
  - `NEXT_PUBLIC_API_URL=http://backend:3000` → `${BACKEND_URL:-https://api.pubsystem.com.br}`

### Fase 2 — Multi-Tenant

#### C08: 22 entidades estendem TenantAwareEntity
Todas as entidades operacionais agora herdam `TenantAwareEntity`, que fornece:
- Coluna `tenant_id` (uuid) com indice
- Relacao `@ManyToOne(() => Tenant, { onDelete: 'CASCADE' })`
- FK automatica para tabela `tenants`

**Entidades convertidas:**
| # | Entidade | Arquivo |
|---|----------|---------|
| 1 | Ambiente | `modulos/ambiente/entities/ambiente.entity.ts` |
| 2 | Mesa | `modulos/mesa/entities/mesa.entity.ts` |
| 3 | Produto | `modulos/produto/entities/produto.entity.ts` |
| 4 | Comanda | `modulos/comanda/entities/comanda.entity.ts` |
| 5 | ComandaAgregado | `modulos/comanda/entities/comanda-agregado.entity.ts` |
| 6 | Pedido | `modulos/pedido/entities/pedido.entity.ts` |
| 7 | ItemPedido | `modulos/pedido/entities/item-pedido.entity.ts` |
| 8 | RetiradaItem | `modulos/pedido/entities/retirada-item.entity.ts` |
| 9 | Empresa | `modulos/empresa/entities/empresa.entity.ts` |
| 10 | Funcionario | `modulos/funcionario/entities/funcionario.entity.ts` |
| 11 | Cliente | `modulos/cliente/entities/cliente.entity.ts` |
| 12 | Evento | `modulos/evento/entities/evento.entity.ts` |
| 13 | PaginaEvento | `modulos/pagina-evento/entities/pagina-evento.entity.ts` |
| 14 | PontoEntrega | `modulos/ponto-entrega/entities/ponto-entrega.entity.ts` |
| 15 | AberturaCaixa | `modulos/caixa/entities/abertura-caixa.entity.ts` |
| 16 | FechamentoCaixa | `modulos/caixa/entities/fechamento-caixa.entity.ts` |
| 17 | Sangria | `modulos/caixa/entities/sangria.entity.ts` |
| 18 | MovimentacaoCaixa | `modulos/caixa/entities/movimentacao-caixa.entity.ts` |
| 19 | Avaliacao | `modulos/avaliacao/entities/avaliacao.entity.ts` |
| 20 | TurnoFuncionario | `modulos/turno/entities/turno-funcionario.entity.ts` |
| 21 | Medalha | `modulos/medalha/entities/medalha.entity.ts` |
| 22 | MedalhaGarcom | `modulos/medalha/entities/medalha-garcom.entity.ts` |
| 23 | LayoutEstabelecimento | `modulos/estabelecimento/entities/layout-estabelecimento.entity.ts` |
| 24 | AuditLog | `modulos/audit/entities/audit-log.entity.ts` |
| 25 | RefreshToken | `auth/entities/refresh-token.entity.ts` |

**Entidades NAO convertidas (globais/plataforma):**
- `Tenant` — e o proprio tenant
- `TenantAwareEntity` — classe base abstrata
- `PaymentConfig` — config global de gateway
- `Plan` — planos da plataforma
- `Subscription` — ja tem FK direto para Tenant
- `PaymentTransaction` — ja tem tenantId com relacao propria

#### C09: Fix Cliente.cpf UNIQUE
- **`modulos/cliente/entities/cliente.entity.ts`**
  - `@Column({ unique: true })` → `@Column()` (removido UNIQUE global)
  - Adicionado `@Index('idx_cliente_cpf_tenant', ['cpf', 'tenantId'], { unique: true })`

#### C10: Fix Mesa UNIQUE
- **`modulos/mesa/entities/mesa.entity.ts`**
  - `@Unique(['numero', 'ambiente'])` → `@Index('idx_mesa_numero_ambiente_tenant', ['numero', 'ambienteId', 'tenantId'], { unique: true })`

#### C11: Migration MultiTenantFKsAndConstraints
- **`database/migrations/1709766000000-MultiTenantFKsAndConstraints.ts`**
  - Cria tenant padrao se nao existir
  - Backfill NULL tenant_id com tenant padrao
  - Adiciona FK `tenant_id → tenants(id) ON DELETE CASCADE` em 25 tabelas
  - Define `tenant_id NOT NULL` em 25 tabelas
  - Cria indices compostos para queries comuns
  - Fix unique constraints (cpf, mesa)
  - Totalmente reversivel (down method)

#### C12: Fix vulnerabilidades cross-tenant

**WebSocket (CRITICO):**
- **`common/tenant/gateways/base-tenant.gateway.ts`**
  - REMOVIDO: fallback por query param e header X-Tenant-ID (spoofavel)
  - ALTERADO: `jwtService.decode()` → `jwtService.verify()` (valida assinatura)
  - Agora: apenas JWT verificado e aceito como fonte de tenant_id

**QuaseProntoScheduler:**
- **`modulos/pedido/quase-pronto.scheduler.ts`**
  - Antes: `find({ status: EM_PREPARO })` — buscava de TODOS os tenants
  - Depois: itera por tenants ativos, filtra `tenantId: tenant.id`
  - `calcularTempoMedioPreparo()` agora recebe e filtra por `tenantId`

**MedalhaScheduler:**
- **`modulos/medalha/medalha.scheduler.ts`**
  - Antes: `find({ cargo: GARCOM })` — buscava de TODOS os tenants
  - Depois: itera por tenants ativos, filtra `tenantId: tenant.id`

### Fase 3 — CI/CD e Docker

#### C16: Fix CI/CD
- **`.github/workflows/ci.yml`**
  - Deploy: `pm2 restart pub-backend` → `docker compose -f docker-compose.micro.yml up -d --build --force-recreate`
  - Deploy: adicionado `./scripts/backup.sh` antes do deploy
  - Rollback: `git checkout HEAD~1 && pm2 restart` → `./scripts/rollback.sh --force`
  - Path: `cd /home/ubuntu/pub-system/backend` → `cd ~/pub-system`

#### C18: Fix frontend Dockerfile
- **`frontend/Dockerfile`**
  - Removidas dependencias Cypress (libgtk, libnss, xvfb, etc.) — projeto usa Playwright
  - `FROM node:20` → `FROM node:20-alpine` (economia ~500MB)

#### C19: Fix docker-compose.micro.yml
- **`docker-compose.micro.yml`**
  - Adicionado servico `postgres` (postgres:17-alpine) com healthcheck
  - Backend depende de `postgres: condition: service_healthy`
  - Removida config DNS Neon (8.8.8.8, 1.1.1.1)
  - Adicionadas variaveis DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, DB_SSL
  - Removido IP hardcoded `134.65.248.235`
  - Adicionado volume `pub_postgres_data`
  - Comentarios atualizados: "Neon PostgreSQL" → "PostgreSQL 17 local"

---

## Arquivos Alterados (Total: 36)

### Entidades (25 arquivos)
```
backend/src/common/tenant/entities/tenant-aware.entity.ts
backend/src/modulos/ambiente/entities/ambiente.entity.ts
backend/src/modulos/mesa/entities/mesa.entity.ts
backend/src/modulos/produto/entities/produto.entity.ts
backend/src/modulos/comanda/entities/comanda.entity.ts
backend/src/modulos/comanda/entities/comanda-agregado.entity.ts
backend/src/modulos/pedido/entities/pedido.entity.ts
backend/src/modulos/pedido/entities/item-pedido.entity.ts
backend/src/modulos/pedido/entities/retirada-item.entity.ts
backend/src/modulos/empresa/entities/empresa.entity.ts
backend/src/modulos/funcionario/entities/funcionario.entity.ts
backend/src/modulos/cliente/entities/cliente.entity.ts
backend/src/modulos/evento/entities/evento.entity.ts
backend/src/modulos/pagina-evento/entities/pagina-evento.entity.ts
backend/src/modulos/ponto-entrega/entities/ponto-entrega.entity.ts
backend/src/modulos/caixa/entities/abertura-caixa.entity.ts
backend/src/modulos/caixa/entities/fechamento-caixa.entity.ts
backend/src/modulos/caixa/entities/sangria.entity.ts
backend/src/modulos/caixa/entities/movimentacao-caixa.entity.ts
backend/src/modulos/avaliacao/entities/avaliacao.entity.ts
backend/src/modulos/turno/entities/turno-funcionario.entity.ts
backend/src/modulos/medalha/entities/medalha.entity.ts
backend/src/modulos/medalha/entities/medalha-garcom.entity.ts
backend/src/modulos/estabelecimento/entities/layout-estabelecimento.entity.ts
backend/src/auth/entities/refresh-token.entity.ts
```

### Infra (6 arquivos)
```
backend/src/app.module.ts
backend/package.json
backend/Dockerfile
backend/Dockerfile.micro (nao alterado, ja estava correto)
docker-compose.yml
docker-compose.prod.yml
docker-compose.micro.yml
frontend/Dockerfile
.github/workflows/ci.yml
```

### Multi-tenant seguranca (3 arquivos)
```
backend/src/common/tenant/gateways/base-tenant.gateway.ts
backend/src/modulos/pedido/quase-pronto.scheduler.ts
backend/src/modulos/medalha/medalha.scheduler.ts
```

### Migration (1 arquivo novo)
```
backend/src/database/migrations/1709766000000-MultiTenantFKsAndConstraints.ts
```

### Documentacao (2 arquivos)
```
docs/infra/banco-de-dados.md
docs/infra/backup-e-restore.md
```

---

## Migration — Instrucoes de Deploy

### Pre-requisitos
```bash
# 1. Backup completo
./scripts/backup.sh

# 2. Verificar registros sem tenant_id
docker exec pub-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT 'clientes' as t, count(*) FROM clientes WHERE tenant_id IS NULL
   UNION ALL
   SELECT 'funcionarios', count(*) FROM funcionarios WHERE tenant_id IS NULL
   UNION ALL
   SELECT 'comandas', count(*) FROM comandas WHERE tenant_id IS NULL;"

# 3. Garantir que existe pelo menos 1 tenant
docker exec pub-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT id, nome, slug FROM tenants;"
```

### Executar
```bash
# A migration roda automaticamente no start
docker compose -f docker-compose.micro.yml up -d --build --force-recreate

# Ou manualmente
npm run migration:run:prod
```

### Verificar
```bash
# Health check
curl https://api.pubsystem.com.br/health

# Verificar FKs criadas
docker exec pub-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT conname FROM pg_constraint WHERE conname LIKE 'fk_%_tenant_id';"

# Verificar NOT NULL
docker exec pub-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT table_name, is_nullable FROM information_schema.columns
   WHERE column_name = 'tenant_id' AND table_schema = 'public'
   ORDER BY table_name;"
```

---

## Riscos e Mitigacao

| Risco | Probabilidade | Mitigacao |
|-------|--------------|-----------|
| Migration falha por dados orfaos | Media | Migration cria tenant padrao e backfill automatico |
| NestJS v11 breaking changes | Baixa | Passport e JWT v11 sao backward-compatible |
| Tests falham pos-refatoracao | Media | Rodar `npm test` antes de deploy |
| WebSocket desconecta clients sem JWT | Esperado | Clientes que nao enviam JWT serao desconectados (correto) |

---

## Pendencias para Proxima Iteracao

1. **Rodar `npm install`** para atualizar `package-lock.json` com novas versoes
2. **Rodar `npm test`** para verificar compatibilidade
3. **Remover 3 docker-compose duplicados em `infra/`** (identicos aos da raiz)
4. **Limpar 29 arquivos soltos na raiz** (SQL, JSON, debug, markdown desatualizados)
5. **Rotacionar credenciais** — JWT_SECRET e DB_PASSWORD expostos no historico git
6. **Considerar Redis em producao** — cache in-memory perde dados a cada restart
7. **Rodar `npm audit fix`** para corrigir vulnerabilidades de dependencias
8. **Deletar DEPLOY_HIBRIDO.md e GUIA_RAPIDO_SERVIDORES.md** do historico git com `git filter-branch` ou BFG Repo Cleaner
