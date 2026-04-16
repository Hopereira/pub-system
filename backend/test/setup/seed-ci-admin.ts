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

  // Garantir que tenant_id é nullable em funcionarios para o SUPER_ADMIN
  // (schema:sync cria com NOT NULL; a migration pode usar nome diferente de FK)
  await ds.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'funcionarios'::regclass
          AND contype = 'f'
          AND confrelid = 'tenants'::regclass
      LOOP
        EXECUTE 'ALTER TABLE funcionarios DROP CONSTRAINT ' || quote_ident(r.conname);
      END LOOP;
    END $$;
  `);
  await ds.query(`ALTER TABLE funcionarios ALTER COLUMN tenant_id DROP NOT NULL`);
  await ds.query(`
    ALTER TABLE funcionarios
    ADD CONSTRAINT fk_funcionarios_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  `);

  // SUPER_ADMIN não pertence a nenhum tenant (tenant_id = NULL)
  await ds.query(`
    INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
    VALUES (
      gen_random_uuid(),
      'Admin CI',
      $1,
      $2,
      'SUPER_ADMIN',
      'ATIVO',
      NULL
    )
    ON CONFLICT DO NOTHING
  `, [email, hash]);

  // Mesma correção para refresh_tokens e audit_logs (login gera tokens e audit com tenantId=null)
  for (const table of ['refresh_tokens', 'audit_logs']) {
    await ds.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT conname FROM pg_constraint
          WHERE conrelid = '${table}'::regclass
            AND contype = 'f'
            AND confrelid = 'tenants'::regclass
        LOOP
          EXECUTE 'ALTER TABLE ${table} DROP CONSTRAINT ' || quote_ident(r.conname);
        END LOOP;
      END $$;
    `);
    await ds.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id DROP NOT NULL`);
    await ds.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT fk_${table}_tenant_id
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    `);
  }

  console.log(`✅ CI admin seed: ${email} (SUPER_ADMIN, sem tenant)`);
  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
