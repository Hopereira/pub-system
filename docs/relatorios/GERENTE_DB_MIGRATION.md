# Migration - Adicionar GERENTE ao Enum PostgreSQL

**Data:** 2026-02-11  
**Status:** Pendente execução em produção

---

## SQL para Executar no Neon

Conecte ao banco de produção via Neon Console ou psql e execute:

```sql
-- =====================================================
-- MIGRATION: Adicionar valores faltantes ao enum cargo
-- =====================================================

-- 1. Verificar valores atuais do enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
ORDER BY enumsortorder;

-- 2. Adicionar SUPER_ADMIN (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
    AND enumlabel = 'SUPER_ADMIN'
  ) THEN
    ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE 'SUPER_ADMIN';
    RAISE NOTICE 'SUPER_ADMIN adicionado';
  ELSE
    RAISE NOTICE 'SUPER_ADMIN já existe';
  END IF;
END $$;

-- 3. Adicionar GERENTE (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
    AND enumlabel = 'GERENTE'
  ) THEN
    ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE 'GERENTE';
    RAISE NOTICE 'GERENTE adicionado';
  ELSE
    RAISE NOTICE 'GERENTE já existe';
  END IF;
END $$;

-- 4. Adicionar COZINHEIRO (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
    AND enumlabel = 'COZINHEIRO'
  ) THEN
    ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE 'COZINHEIRO';
    RAISE NOTICE 'COZINHEIRO adicionado';
  ELSE
    RAISE NOTICE 'COZINHEIRO já existe';
  END IF;
END $$;

-- 5. Adicionar BARTENDER (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
    AND enumlabel = 'BARTENDER'
  ) THEN
    ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE 'BARTENDER';
    RAISE NOTICE 'BARTENDER adicionado';
  ELSE
    RAISE NOTICE 'BARTENDER já existe';
  END IF;
END $$;

-- 6. Verificar resultado final
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
ORDER BY enumsortorder;
```

---

## Alternativa: SQL Simplificado

Se o banco for novo ou você tiver certeza que os valores não existem:

```sql
-- Adicionar valores diretamente (falha se já existir)
ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE IF NOT EXISTS 'GERENTE';
ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE IF NOT EXISTS 'COZINHEIRO';
ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE IF NOT EXISTS 'BARTENDER';
```

**Nota:** `ADD VALUE IF NOT EXISTS` requer PostgreSQL 9.3+

---

## Como Executar no Neon

### Opção 1: Neon Console (Recomendado)
1. Acesse https://console.neon.tech
2. Selecione o projeto `pub-system`
3. Clique em "SQL Editor"
4. Cole o SQL acima
5. Execute

### Opção 2: psql
```bash
psql "postgresql://usuario:senha@ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech/pub_system_db?sslmode=require"
```

### Opção 3: Via Oracle VM
```bash
ssh usuario@134.65.248.235
cd pub-system/backend
NODE_ENV=production npm run typeorm:migration:run
```

---

## Verificação Pós-Migration

Após executar, verifique:

```sql
-- Listar todos os valores do enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum');

-- Resultado esperado:
-- SUPER_ADMIN
-- ADMIN
-- GERENTE
-- CAIXA
-- GARCOM
-- COZINHEIRO
-- COZINHA
-- BARTENDER
```

---

## Rollback (Se Necessário)

⚠️ **ATENÇÃO:** Remover valores de enum no PostgreSQL é complexo e pode quebrar dados.

Se precisar reverter, o processo é:
1. Criar novo enum sem os valores
2. Alterar coluna para usar novo enum
3. Remover enum antigo
4. Renomear novo enum

**Não recomendado em produção com dados existentes.**
