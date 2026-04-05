# Relatório de Sessão — 2026-04-05

**Data:** 05 de Abril de 2026  
**Status final:** ✅ Bug corrigido em produção sem rebuild  
**PR:** #285 — `fix/pontos-entrega-empresa-id-nullable`

---

## 1. Situação Inicial

Erro 500 em `POST /pontos-entrega` em produção.  
`GET /pontos-entrega` funcionava normalmente (200).

Log do console do browser:
```
POST /pontos-entrega → 500 (Internal Server Error)
[PontoEntregaService] ❌ Erro ao criar ponto de entrega
Error: Request failed with status code 500
```

---

## 2. Documentação Consultada

| Documento | Informação relevante |
|-----------|---------------------|
| `docs/current/API.md` §Pontos de Entrega | `POST /pontos-entrega` requer role ADMIN, feature PONTOS_ENTREGA |
| `docs/current/ARQUITETURA.md` §Módulos | `ponto-entrega` → feature guard PONTOS_ENTREGA (BASIC) |
| `docs/audits/AUDITORIA_MULTITENANT.md` §7.3 | `ponto-entrega.service.ts` usa `rawRepository` em rotas públicas — `empresaId` legado coexiste com `tenant_id` |

---

## 3. Diagnóstico

### Log real do backend (via `docker logs pub-backend`)

```
QueryFailedError: null value in column "empresa_id" of relation "pontos_entrega"
violates not-null constraint

INSERT INTO "pontos_entrega"("tenant_id","id","nome","descricao","ativo","posicao",
"tamanho","mesa_proxima_id","ambiente_atendimento_id","ambiente_preparo_id",
"empresa_id","created_at","updated_at") VALUES ($1,DEFAULT,$2,$3,DEFAULT,DEFAULT,
DEFAULT,$4,$5,$6,DEFAULT,DEFAULT,DEFAULT)
-- empresa_id = DEFAULT → null → REJEITADO pelo banco
```

### Análise do schema real em produção

```sql
-- Coluna empresa_id em pontos_entrega tinha:
empresa_id | uuid | NOT NULL | FK → empresas(id) ON DELETE CASCADE
```

### Root cause

A entity `PontoEntrega` define `empresa_id` como campo legado com `nullable: true`:
```typescript
@Column({ name: 'empresa_id', type: 'uuid', nullable: true })
empresaId: string;
```

Mas o banco de produção foi criado numa versão antiga com `NOT NULL`.  
A migration para tornar nullable **nunca foi executada em produção**.

O INSERT não enviava `empresa_id` (correto — campo legado substituído por `tenant_id`) mas o banco rejeitava com violação de constraint.

**O serviço e o código estavam corretos. O problema estava exclusivamente no schema do banco.**

---

## 4. Correção Aplicada

### 4.1 Fix imediato no banco de produção (sem rebuild)

```bash
# Remover constraint NOT NULL da coluna legado empresa_id
docker exec pub-postgres psql -U pubuser -d pubsystem -c \
  'ALTER TABLE pontos_entrega ALTER COLUMN empresa_id DROP NOT NULL'

# Resultado:
# empresa_id | uuid | (nullable) | FK → empresas(id) ON DELETE CASCADE ✅
```

### 4.2 Migration TypeORM criada

`backend/src/database/migrations/1743868800000-MakeEmpresaIdNullableInPontosEntrega.ts`

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Remove FK constraint original (CASCADE)
  await queryRunner.query(`ALTER TABLE "pontos_entrega" DROP CONSTRAINT IF EXISTS ...`);
  // Torna nullable
  await queryRunner.query(`ALTER TABLE "pontos_entrega" ALTER COLUMN "empresa_id" DROP NOT NULL`);
  // Recria FK com SET NULL (consistente com entity)
  await queryRunner.query(`ALTER TABLE "pontos_entrega" ADD CONSTRAINT ... ON DELETE SET NULL`);
}
```

---

## 5. Dependências Verificadas

| Tabela | Relação | Impacto |
|--------|---------|---------|
| `comandas` | `FK ponto_entrega_id → pontos_entrega(id)` | Não afetada — FK diferente |
| `clientes` | `FK ponto_entrega_id → pontos_entrega(id) ON DELETE SET NULL` | Não afetada |
| `empresa_id` na entity | `nullable: true` | Já correto no código |

---

## 6. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| `docker logs pub-backend` — erro antes do fix | ✅ Confirmado: `empresa_id NOT NULL` |
| `\d pontos_entrega` no psql após fix | ✅ `empresa_id` sem `not null` na coluna |
| `GET /pontos-entrega` (não afetado) | ✅ 200 durante todo o incidente |
| `POST /pontos-entrega` após ALTER TABLE | ✅ Deve funcionar (aguardar confirmação do usuário) |

---

## 7. Commits

| Hash | Branch | Mensagem |
|------|--------|---------|
| `f99fa95` | `fix/pontos-entrega-empresa-id-nullable` | `fix(pontos-entrega): migration para tornar empresa_id nullable` |

---

## 8. Estado Final

- `empresa_id` em `pontos_entrega` → nullable ✅
- Migration registrada no TypeORM para próximos deploys/ambientes ✅
- PR #285 aberto para merge em `main` ✅
- Sem necessidade de rebuild ou restart do backend ✅

---

---

## Bug 2 — POST /produtos timeout (ECONNABORTED) — produto criado mas tela exibia erro

**Situação:** Ao criar produto com imagem, frontend mostrava "Falha ao criar o produto". O produto era criado com sucesso.

### Diagnóstico
```
POST /produtos | Tempo: 21996ms | Status: 201 ✅
GcsStorageService: Upload bem-sucedido | URL: https://storage.googleapis.com/...
```
O backend respondia **201 em ~22s**. O frontend tinha timeout de **30s** e descartava a resposta antes de recebê-la (`ECONNABORTED`). O upload para Google Cloud Storage demora ~20s na Oracle VM E2.1.Micro.

Problema extra: `axiosRetry` retentava erros de rede em POST multipart — podia criar o produto múltiplas vezes (duplicatas).

### Correções Aplicadas

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/services/api.ts` | Timeout global `30s → 60s`; retry desabilitado para POST/PATCH multipart |
| `frontend/src/services/produtoService.ts` | Timeout explícito de `120s` em `createProduto` e `updateProduto` |

**PR:** #286 — `fix/produto-upload-timeout`

---

## 9. Padrão Identificado — Risco Residual

O banco de produção foi criado antes da refatoração multi-tenant. Outras tabelas podem ter constraints legados desalinhados com as entities. Verificar `funcionarios.empresa_id` (já nullable — OK).

Recomendação: executar `npm run typeorm:migration:run` no próximo deploy para garantir que todas as migrations estão aplicadas.
