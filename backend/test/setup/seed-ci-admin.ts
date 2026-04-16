/**
 * Script de seed para CI — cria o admin de teste no banco vazio.
 * Executado antes dos E2E tests no GitHub Actions.
 *
 * Uso: ts-node test/setup/seed-ci-admin.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'testpass',
    database: process.env.DB_DATABASE || 'pub_system_test',
    ssl: false,
  });

  await ds.initialize();

  const email = process.env.CI_ADMIN_EMAIL || 'admin@admin.com';
  const senha = process.env.CI_ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(senha, 10);

  // Tornar tenant_id nullable nas tabelas que o SUPER_ADMIN usa com tenant_id=NULL.
  // O schema:sync cria com NOT NULL (herdado de TenantAwareEntity).
  // Dropamos todas as FKs para tenants nessas tabelas e removemos a constraint NOT NULL.
  for (const table of ['funcionarios', 'refresh_tokens', 'audit_logs']) {
    await ds.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT conname FROM pg_constraint
          WHERE conrelid = '${table}'::regclass
            AND contype IN ('f', 'c')
            AND (
              confrelid = (SELECT oid FROM pg_class WHERE relname = 'tenants')
              OR conname LIKE '%tenant%'
            )
        LOOP
          EXECUTE 'ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END LOOP;
        -- Garantir DROP NOT NULL independente de FK
        EXECUTE 'ALTER TABLE "${table}" ALTER COLUMN tenant_id DROP NOT NULL';
      END $$;
    `);
    console.log(`✅ tenant_id nullable em ${table}`);
  }

  // SUPER_ADMIN não pertence a nenhum tenant (tenant_id = NULL)
  await ds.query(`
    INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
    VALUES (gen_random_uuid(), 'Admin CI', $1, $2, 'SUPER_ADMIN', 'ATIVO', NULL)
    ON CONFLICT DO NOTHING
  `, [email, hash]);

  console.log(`✅ CI admin seed: ${email} (SUPER_ADMIN, sem tenant)`);
  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
