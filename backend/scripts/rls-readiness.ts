/**
 * RLS Readiness Check — npm run rls:readiness
 *
 * Verifica se o sistema está pronto para ativar RLS em produção.
 * Saída: READY | WARNING | BLOCKED
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const TENANT_TABLES = [
  'funcionarios', 'empresas', 'ambientes', 'mesas', 'produtos', 'clientes',
  'comandas', 'comanda_agregados', 'pedidos', 'itens_pedido', 'retirada_itens',
  'eventos', 'paginas_evento', 'pontos_entrega', 'avaliacoes', 'medalhas',
  'medalhas_garcom', 'turnos_funcionario', 'aberturas_caixa',
  'fechamentos_caixa', 'sangrias', 'movimentacoes_caixa', 'audit_logs',
  'refresh_tokens', 'layouts_estabelecimento',
];

interface CheckResult {
  name: string;
  status: 'OK' | 'WARN' | 'FAIL';
  detail: string;
}

async function main() {
  console.log('\n🔒 RLS READINESS CHECK\n' + '='.repeat(60));

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pubsystem',
  });

  try {
    await ds.initialize();
  } catch (err) {
    console.error('❌ BLOCKED: Cannot connect to database:', err.message);
    process.exit(2);
  }

  const results: CheckResult[] = [];

  // 1. Check RLS enabled on tables
  console.log('\n📋 1. RLS Status por Tabela');
  console.log('-'.repeat(60));
  for (const table of TENANT_TABLES) {
    const tableExists = await ds.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) as e`, [table],
    );
    if (!tableExists[0]?.e) {
      results.push({ name: `rls:${table}`, status: 'WARN', detail: 'table does not exist' });
      console.log(`  ⏭️  ${table.padEnd(30)} TABLE_MISSING`);
      continue;
    }

    const rlsStatus = await ds.query(
      `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = $1`, [table],
    );
    const hasRls = rlsStatus[0]?.relrowsecurity === true;
    const forceRls = rlsStatus[0]?.relforcerowsecurity === true;

    const policies = await ds.query(
      `SELECT polname FROM pg_policy WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = $1)`, [table],
    );
    const hasPolicy = policies.length > 0;

    const hasColTenantId = await ds.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='tenant_id') as e`, [table],
    );
    const hasTenantCol = hasColTenantId[0]?.e;

    if (!hasTenantCol) {
      results.push({ name: `rls:${table}`, status: 'WARN', detail: 'no tenant_id column' });
      console.log(`  ⚠️  ${table.padEnd(30)} NO_TENANT_ID`);
    } else if (hasRls && hasPolicy) {
      const status = forceRls ? 'FORCE' : 'ENABLED';
      results.push({ name: `rls:${table}`, status: 'OK', detail: status });
      console.log(`  ✅ ${table.padEnd(30)} ${status} (policies: ${policies.map((p: any) => p.polname).join(', ')})`);
    } else if (hasRls && !hasPolicy) {
      results.push({ name: `rls:${table}`, status: 'FAIL', detail: 'RLS enabled but no policy' });
      console.log(`  ❌ ${table.padEnd(30)} RLS_NO_POLICY`);
    } else {
      results.push({ name: `rls:${table}`, status: 'FAIL', detail: 'RLS not enabled' });
      console.log(`  ❌ ${table.padEnd(30)} DISABLED`);
    }
  }

  // 2. Check migrations
  console.log('\n📋 2. Migrations');
  console.log('-'.repeat(60));
  try {
    const migrations = await ds.query(
      `SELECT name FROM migrations ORDER BY id DESC LIMIT 10`,
    );
    const rlsMigration = migrations.find((m: any) =>
      m.name.toLowerCase().includes('rowlevelsecurity'),
    );
    if (rlsMigration) {
      results.push({ name: 'migration:rls', status: 'OK', detail: rlsMigration.name });
      console.log(`  ✅ RLS migration applied: ${rlsMigration.name}`);
    } else {
      results.push({ name: 'migration:rls', status: 'FAIL', detail: 'RLS migration not found' });
      console.log(`  ❌ RLS migration NOT applied`);
    }
  } catch {
    results.push({ name: 'migration:rls', status: 'WARN', detail: 'migrations table not found' });
    console.log(`  ⚠️  Cannot query migrations table`);
  }

  // 3. Check env vars
  console.log('\n📋 3. Environment Variables');
  console.log('-'.repeat(60));
  const rlsEnabled = process.env.RLS_ENABLED === 'true';
  const rlsDryRun = process.env.RLS_DRY_RUN === 'true';
  console.log(`  RLS_ENABLED:  ${rlsEnabled ? '✅ true' : '⏸️  false'}`);
  console.log(`  RLS_DRY_RUN:  ${rlsDryRun ? '🔍 true (auditing)' : '⏸️  false'}`);
  results.push({ name: 'env:RLS_ENABLED', status: 'OK', detail: String(rlsEnabled) });
  results.push({ name: 'env:RLS_DRY_RUN', status: 'OK', detail: String(rlsDryRun) });

  // 4. Check for rows without tenant_id in critical tables
  console.log('\n📋 4. Dados Órfãos (sem tenant_id)');
  console.log('-'.repeat(60));
  const criticalTables = ['funcionarios', 'produtos', 'comandas', 'pedidos', 'mesas'];
  for (const table of criticalTables) {
    try {
      const orphans = await ds.query(
        `SELECT COUNT(*) as cnt FROM "${table}" WHERE tenant_id IS NULL`,
      );
      const count = parseInt(orphans[0]?.cnt || '0');
      if (count > 0) {
        results.push({ name: `orphans:${table}`, status: 'WARN', detail: `${count} rows without tenant_id` });
        console.log(`  ⚠️  ${table.padEnd(20)} ${count} rows sem tenant_id`);
      } else {
        results.push({ name: `orphans:${table}`, status: 'OK', detail: '0 orphans' });
        console.log(`  ✅ ${table.padEnd(20)} OK`);
      }
    } catch {
      console.log(`  ⏭️  ${table.padEnd(20)} table not found`);
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  const fails = results.filter(r => r.status === 'FAIL');
  const warns = results.filter(r => r.status === 'WARN');
  const oks = results.filter(r => r.status === 'OK');

  let finalStatus: string;
  let exitCode: number;

  if (fails.length > 0) {
    finalStatus = '❌ BLOCKED';
    exitCode = 2;
    console.log(`\n${finalStatus} — ${fails.length} failures, ${warns.length} warnings, ${oks.length} OK`);
    console.log('\nBlocking issues:');
    fails.forEach(f => console.log(`  - ${f.name}: ${f.detail}`));
  } else if (warns.length > 0) {
    finalStatus = '⚠️  WARNING';
    exitCode = 0;
    console.log(`\n${finalStatus} — ${warns.length} warnings, ${oks.length} OK`);
    console.log('\nWarnings (non-blocking):');
    warns.forEach(w => console.log(`  - ${w.name}: ${w.detail}`));
  } else {
    finalStatus = '✅ READY';
    exitCode = 0;
    console.log(`\n${finalStatus} — All ${oks.length} checks passed`);
  }

  // Phase recommendation
  console.log('\n📋 Recommendation:');
  if (!rlsEnabled && !rlsDryRun) {
    console.log('  You are in Fase 0 (off). Next: set RLS_DRY_RUN=true to start auditing.');
  } else if (rlsDryRun && !rlsEnabled) {
    console.log('  You are in Fase 1 (dry-run). Monitor logs for RLS_RISK warnings.');
    console.log('  After 48h without TENANT_CONTEXT_MISSING, proceed to Fase 2 (staging).');
  } else if (rlsEnabled) {
    console.log('  You are in Fase 2/3 (active). Monitor for RLS_SESSION_NOT_SET errors.');
  }

  console.log('\n');
  await ds.destroy();
  process.exit(exitCode);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(2);
});
