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
  console.log(`🔧 Seed: email=${email}, senha=${senha.substring(0, 3)}***`);

  const hash = await bcrypt.hash(senha, 10);

  // Verificar se tabela existe
  const tableCheck = await ds.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'funcionarios'
    ) AS exists
  `);
  console.log(`🔧 Tabela funcionarios existe: ${tableCheck[0].exists}`);

  // SUPER_ADMIN não pertence a nenhum tenant (tenant_id = NULL)
  await ds.query(`
    INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
    VALUES (gen_random_uuid(), 'Admin CI', $1, $2, 'SUPER_ADMIN', 'ATIVO', NULL)
  `, [email, hash]);

  const check = await ds.query(`SELECT id, email, cargo FROM funcionarios WHERE email = $1`, [email]);
  console.log(`✅ CI admin seed: ${JSON.stringify(check[0])}`);
  console.log(`✅ Admin inserido com sucesso. tenant_id=NULL, cargo=SUPER_ADMIN`);
  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
