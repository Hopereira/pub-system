# Diagnóstico: Tenants Excedendo Limites do Plano

**Última atualização:** 2026-04-19

---

## Contexto

A partir de 2026-04-19, o `TenantProvisioningService` respeita os limites do plano ao criar ambientes e mesas iniciais. Tenants criados ANTES dessa correção podem ter mais recursos do que o plano permite.

Este documento traz queries SQL para identificar esses tenants **sem apagar nada automaticamente**. O SUPER_ADMIN decide caso a caso: fazer upgrade do plano ou remover recursos manualmente.

---

## Como Executar

Conectar no postgres da VM de produção:

```bash
ssh -i "<caminho-da-chave>" ubuntu@134.65.248.235
docker exec -it pub-postgres psql -U postgres -d pub
```

Depois executar as queries abaixo.

---

## Query 1 — Resumo por Tenant

Lista todos os tenants com contagem de mesas, ambientes, funcionários, produtos e limites do plano.

```sql
WITH plan_limits AS (
  SELECT code, limits
  FROM plans
  WHERE is_active = true
)
SELECT
  t.id,
  t.nome,
  t.slug,
  t.plano,
  t.status,
  (SELECT COUNT(*) FROM mesas WHERE tenant_id = t.id)         AS mesas_atual,
  (pl.limits->>'maxMesas')::int                                AS mesas_limite,
  (SELECT COUNT(*) FROM ambientes WHERE tenant_id = t.id)     AS ambientes_atual,
  (pl.limits->>'maxAmbientes')::int                            AS ambientes_limite,
  (SELECT COUNT(*) FROM funcionarios WHERE tenant_id = t.id)  AS funcionarios_atual,
  (pl.limits->>'maxFuncionarios')::int                         AS funcionarios_limite,
  (SELECT COUNT(*) FROM produtos WHERE tenant_id = t.id)      AS produtos_atual,
  (pl.limits->>'maxProdutos')::int                             AS produtos_limite
FROM tenants t
LEFT JOIN plan_limits pl ON pl.code = t.plano
ORDER BY t.nome;
```

---

## Query 2 — Apenas Tenants Excedentes

Retorna apenas tenants que superam algum limite (ignora `-1` que significa ilimitado).

```sql
WITH plan_limits AS (
  SELECT code, limits
  FROM plans
  WHERE is_active = true
),
tenant_counts AS (
  SELECT
    t.id,
    t.nome,
    t.slug,
    t.plano,
    (SELECT COUNT(*) FROM mesas WHERE tenant_id = t.id)        AS mesas,
    (SELECT COUNT(*) FROM ambientes WHERE tenant_id = t.id)    AS ambientes,
    (SELECT COUNT(*) FROM funcionarios WHERE tenant_id = t.id) AS funcionarios,
    (SELECT COUNT(*) FROM produtos WHERE tenant_id = t.id)     AS produtos,
    (pl.limits->>'maxMesas')::int        AS max_mesas,
    (pl.limits->>'maxAmbientes')::int    AS max_ambientes,
    (pl.limits->>'maxFuncionarios')::int AS max_funcionarios,
    (pl.limits->>'maxProdutos')::int     AS max_produtos
  FROM tenants t
  LEFT JOIN plan_limits pl ON pl.code = t.plano
)
SELECT
  nome, slug, plano,
  CASE WHEN max_mesas        <> -1 AND mesas        > max_mesas        THEN mesas        || '/' || max_mesas        END AS mesas_excedente,
  CASE WHEN max_ambientes    <> -1 AND ambientes    > max_ambientes    THEN ambientes    || '/' || max_ambientes    END AS ambientes_excedente,
  CASE WHEN max_funcionarios <> -1 AND funcionarios > max_funcionarios THEN funcionarios || '/' || max_funcionarios END AS funcionarios_excedente,
  CASE WHEN max_produtos     <> -1 AND produtos     > max_produtos     THEN produtos     || '/' || max_produtos     END AS produtos_excedente
FROM tenant_counts
WHERE
  (max_mesas        <> -1 AND mesas        > max_mesas)
  OR (max_ambientes    <> -1 AND ambientes    > max_ambientes)
  OR (max_funcionarios <> -1 AND funcionarios > max_funcionarios)
  OR (max_produtos     <> -1 AND produtos     > max_produtos)
ORDER BY nome;
```

---

## Ações Possíveis Por Tenant

### Opção A — Upgrade do plano (recomendado se tenant é ativo)

```sql
-- Exemplo: subir tenant "bar-do-ze" de FREE para BASIC
UPDATE tenants SET plano = 'BASIC' WHERE slug = 'bar-do-ze';
```

### Opção B — Remover recursos excedentes (CUIDADO: destrutivo)

Antes de remover, verificar se a mesa tem pedidos/comandas ativos:

```sql
-- Ver mesas com atividade recente (últimos 30 dias)
SELECT m.id, m.numero, COUNT(DISTINCT p.id) AS pedidos_30d
FROM mesas m
LEFT JOIN pedidos p ON p.mesa_id = m.id AND p.created_at > NOW() - INTERVAL '30 days'
WHERE m.tenant_id = '<TENANT_ID>'
GROUP BY m.id, m.numero
ORDER BY m.numero;
```

Remover apenas mesas **sem histórico** e que estão além do limite (ordenar por número desc, manter as mais baixas):

```sql
-- NÃO EXECUTAR SEM CONFERIR
DELETE FROM mesas
WHERE id IN (
  SELECT m.id FROM mesas m
  WHERE m.tenant_id = '<TENANT_ID>'
    AND NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.mesa_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM comandas c WHERE c.mesa_id = m.id)
  ORDER BY m.numero DESC
  LIMIT <QUANTIDADE_EXCEDENTE>
);
```

### Opção C — Manter como está

Tenants excedentes não serão bloqueados retroativamente. A validação `requireLimitForTenant` só impede **novas** criações além do limite. Eles podem continuar operando, mas não conseguirão criar mais recursos sem upgrade.

---

## Procedimento Recomendado

1. Rodar Query 2 para listar excedentes
2. Para cada tenant, decidir:
   - Cliente ativo pagante → oferecer upgrade (Opção A)
   - Conta de teste/demo sem histórico → remover excedentes (Opção B)
   - Conta legada sem uso → deixar como está (Opção C)
3. Documentar decisões em `docs/operacao/decisoes-tenants-<data>.md`
