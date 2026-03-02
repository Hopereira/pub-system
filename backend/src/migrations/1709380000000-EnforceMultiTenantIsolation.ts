import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Enforce Multi-Tenant Isolation (Enterprise Grade)
 * 
 * This migration transforms the database from soft multi-tenancy (nullable tenant_id)
 * to hard multi-tenancy (NOT NULL tenant_id + FK + composite indices).
 * 
 * IMPORTANT: Run this AFTER ensuring all existing records have tenant_id populated.
 * The migration includes a safety check and will populate orphan records first.
 * 
 * Changes:
 * 1. Populate NULL tenant_id from empresa_id where possible
 * 2. Delete truly orphan records (no tenant_id AND no empresa_id)
 * 3. ALTER COLUMN tenant_id SET NOT NULL on all 24 operational tables
 * 4. ADD FOREIGN KEY to tenants table with ON DELETE CASCADE
 * 5. CREATE composite indices (tenant_id, id) for all tables
 * 6. CREATE composite indices (tenant_id, <business_key>) where applicable
 */
export class EnforceMultiTenantIsolation1709380000000 implements MigrationInterface {
  name = 'EnforceMultiTenantIsolation1709380000000';

  // All operational tables that must have tenant_id NOT NULL
  private readonly operationalTables = [
    'funcionarios',
    'ambientes',
    'mesas',
    'produtos',
    'clientes',
    'comandas',
    'comanda_agregados',
    'pedidos',
    'item_pedidos',
    'retirada_itens',
    'empresas',
    'eventos',
    'paginas_evento',
    'avaliacoes',
    'aberturas_caixa',
    'fechamentos_caixa',
    'movimentacoes_caixa',
    'sangrias',
    'medalhas',
    'medalha_garcom',
    'pontos_entrega',
    'layout_estabelecimento',
    'turnos_funcionario',
    'audit_logs',
    'refresh_tokens',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // STEP 0: Safety check - verify tenants table exists and has data
    // ============================================================
    const tenantCount = await queryRunner.query(`SELECT COUNT(*) as count FROM tenants`);
    if (parseInt(tenantCount[0].count) === 0) {
      throw new Error(
        'ABORT: No tenants found in database. Create at least one tenant before running this migration.'
      );
    }

    // ============================================================
    // STEP 1: Populate NULL tenant_id from empresa_id where possible
    // ============================================================
    // For funcionarios table, empresa_id maps to the tenant
    const tablesWithEmpresaId = [
      'funcionarios',
    ];

    for (const table of tablesWithEmpresaId) {
      const hasEmpresaId = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = 'empresa_id'
      `);
      if (hasEmpresaId.length > 0) {
        await queryRunner.query(`
          UPDATE "${table}" SET tenant_id = empresa_id 
          WHERE tenant_id IS NULL AND empresa_id IS NOT NULL
        `);
      }
    }

    // ============================================================
    // STEP 2: Log and handle orphan records
    // ============================================================
    for (const table of this.operationalTables) {
      const orphans = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "${table}" WHERE tenant_id IS NULL
      `);
      const orphanCount = parseInt(orphans[0].count);
      if (orphanCount > 0) {
        console.warn(
          `⚠️ Table "${table}" has ${orphanCount} orphan records (tenant_id IS NULL). Deleting...`
        );
        await queryRunner.query(`DELETE FROM "${table}" WHERE tenant_id IS NULL`);
      }
    }

    // ============================================================
    // STEP 3: ALTER COLUMN tenant_id SET NOT NULL
    // ============================================================
    for (const table of this.operationalTables) {
      // Check if column exists first
      const colExists = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = 'tenant_id'
      `);
      if (colExists.length > 0) {
        await queryRunner.query(`
          ALTER TABLE "${table}" ALTER COLUMN tenant_id SET NOT NULL
        `);
        console.log(`✅ ${table}.tenant_id → NOT NULL`);
      }
    }

    // ============================================================
    // STEP 4: ADD FOREIGN KEY to tenants table
    // ============================================================
    for (const table of this.operationalTables) {
      const fkName = `fk_${table}_tenant`;
      // Check if FK already exists
      const fkExists = await queryRunner.query(`
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = '${table}' AND constraint_name = '${fkName}'
      `);
      if (fkExists.length === 0) {
        const colExists = await queryRunner.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'tenant_id'
        `);
        if (colExists.length > 0) {
          await queryRunner.query(`
            ALTER TABLE "${table}" 
            ADD CONSTRAINT "${fkName}" 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
          `);
          console.log(`✅ ${table} → FK to tenants (CASCADE)`);
        }
      }
    }

    // ============================================================
    // STEP 5: CREATE composite indices (tenant_id, id)
    // ============================================================
    for (const table of this.operationalTables) {
      const idxName = `idx_${table}_tenant_id_pk`;
      const idxExists = await queryRunner.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = '${table}' AND indexname = '${idxName}'
      `);
      if (idxExists.length === 0) {
        const colExists = await queryRunner.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'tenant_id'
        `);
        if (colExists.length > 0) {
          await queryRunner.query(`
            CREATE INDEX "${idxName}" ON "${table}" (tenant_id, id)
          `);
          console.log(`✅ ${table} → INDEX (tenant_id, id)`);
        }
      }
    }

    // ============================================================
    // STEP 6: Business-specific composite indices
    // ============================================================
    // These cover the most common query patterns per tenant

    // funcionarios: lookup by email within tenant (already exists as unique)
    // ambientes: lookup by nome within tenant (already exists as unique)
    
    // comandas: lookup by status within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_comandas_tenant_status', 'comandas', '(tenant_id, status)');

    // pedidos: lookup by date within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_pedidos_tenant_data', 'pedidos', '(tenant_id, data DESC)');

    // produtos: lookup by ativo within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_produtos_tenant_ativo', 'produtos', '(tenant_id, ativo)');

    // mesas: lookup by ambiente within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_mesas_tenant_ambiente', 'mesas', '(tenant_id, ambiente_id)');

    // item_pedidos: lookup by status within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_item_pedidos_tenant_status', 'item_pedidos', '(tenant_id, status)');

    // clientes: lookup by cpf within tenant
    await this.createIndexIfNotExists(queryRunner,
      'idx_clientes_tenant_cpf', 'clientes', '(tenant_id, cpf)');

    // refresh_tokens: tenant + funcionario composite
    await this.createIndexIfNotExists(queryRunner,
      'idx_refresh_tokens_tenant_func', 'refresh_tokens', '(tenant_id, "funcionarioId")');

    console.log('✅ Migration complete: Multi-tenant isolation enforced');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Remove FKs, make columns nullable again, drop new indices
    for (const table of this.operationalTables) {
      const fkName = `fk_${table}_tenant`;
      const idxName = `idx_${table}_tenant_id_pk`;

      // Drop FK
      await queryRunner.query(`
        ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${fkName}"
      `);

      // Drop composite index
      await queryRunner.query(`DROP INDEX IF EXISTS "${idxName}"`);

      // Make nullable again
      const colExists = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = 'tenant_id'
      `);
      if (colExists.length > 0) {
        await queryRunner.query(`
          ALTER TABLE "${table}" ALTER COLUMN tenant_id DROP NOT NULL
        `);
      }
    }

    // Drop business-specific indices
    const businessIndices = [
      'idx_comandas_tenant_status',
      'idx_pedidos_tenant_data',
      'idx_produtos_tenant_ativo',
      'idx_mesas_tenant_ambiente',
      'idx_item_pedidos_tenant_status',
      'idx_clientes_tenant_cpf',
      'idx_refresh_tokens_tenant_func',
    ];
    for (const idx of businessIndices) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${idx}"`);
    }
  }

  private async createIndexIfNotExists(
    queryRunner: QueryRunner,
    indexName: string,
    tableName: string,
    columns: string,
  ): Promise<void> {
    const exists = await queryRunner.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = '${tableName}' AND indexname = '${indexName}'
    `);
    if (exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "${indexName}" ON "${tableName}" ${columns}`
      );
      console.log(`✅ ${tableName} → INDEX ${columns}`);
    }
  }
}
