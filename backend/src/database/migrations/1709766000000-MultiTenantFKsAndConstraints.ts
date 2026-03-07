import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Multi-Tenant FKs, NOT NULL constraints, and UNIQUE fixes
 * 
 * This migration:
 * 1. Creates a default tenant if none exists (for backfilling)
 * 2. Backfills NULL tenant_id values with the default tenant
 * 3. Adds FK constraints tenant_id -> tenants(id) ON DELETE CASCADE
 * 4. Sets tenant_id to NOT NULL on all operational tables
 * 5. Fixes Cliente.cpf UNIQUE to composite (cpf, tenant_id)
 * 6. Fixes Mesa UNIQUE to composite (numero, ambiente_id, tenant_id)
 * 
 * IMPORTANT: Run backup BEFORE executing this migration!
 * ./scripts/backup.sh
 */
export class MultiTenantFKsAndConstraints1709766000000 implements MigrationInterface {
  name = 'MultiTenantFKsAndConstraints1709766000000';

  // All operational tables that need tenant_id FK + NOT NULL
  private readonly tables = [
    'ambientes',
    'mesas',
    'produtos',
    'comandas',
    'comanda_agregados',
    'pedidos',
    'itens_pedido',
    'retiradas_itens',
    'empresas',
    'funcionarios',
    'clientes',
    'eventos',
    'paginas_evento',
    'pontos_entrega',
    'aberturas_caixa',
    'fechamentos_caixa',
    'sangrias',
    'movimentacoes_caixa',
    'avaliacoes',
    'turnos_funcionario',
    'medalhas',
    'medalhas_garcons',
    'layouts_estabelecimento',
    'audit_logs',
    'refresh_tokens',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Step 1: Ensure default tenant exists ─────────────────────────
    const tenantExists = await queryRunner.query(
      `SELECT id FROM tenants LIMIT 1`,
    );

    let defaultTenantId: string;

    if (tenantExists.length === 0) {
      const result = await queryRunner.query(`
        INSERT INTO tenants (id, nome, slug, status, plano, config)
        VALUES (
          gen_random_uuid(),
          'Tenant Padrão',
          'default',
          'ATIVO',
          'BASICO',
          '{}'::jsonb
        )
        RETURNING id
      `);
      defaultTenantId = result[0].id;
    } else {
      defaultTenantId = tenantExists[0].id;
    }

    // ── Step 2: Backfill NULL tenant_id ──────────────────────────────
    for (const table of this.tables) {
      const hasColumn = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = 'tenant_id'
      `);

      if (hasColumn.length > 0) {
        await queryRunner.query(`
          UPDATE "${table}" SET tenant_id = '${defaultTenantId}'
          WHERE tenant_id IS NULL
        `);
      } else {
        // Add tenant_id column if it doesn't exist yet
        await queryRunner.query(`
          ALTER TABLE "${table}"
          ADD COLUMN tenant_id uuid DEFAULT '${defaultTenantId}'
        `);
        await queryRunner.query(`
          UPDATE "${table}" SET tenant_id = '${defaultTenantId}'
          WHERE tenant_id IS NULL
        `);
      }
    }

    // ── Step 3: Add FK constraints ───────────────────────────────────
    for (const table of this.tables) {
      const fkName = `fk_${table}_tenant_id`;

      // Drop existing FK if any (idempotent)
      await queryRunner.query(`
        ALTER TABLE "${table}"
        DROP CONSTRAINT IF EXISTS "${fkName}"
      `);

      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "${fkName}"
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      `);
    }

    // ── Step 4: Set NOT NULL ─────────────────────────────────────────
    for (const table of this.tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN tenant_id SET NOT NULL
      `);

      // Remove default (was only needed for backfill)
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN tenant_id DROP DEFAULT
      `);
    }

    // ── Step 5: Add tenant_id indexes where missing ──────────────────
    for (const table of this.tables) {
      const idxName = `idx_${table}_tenant_id`;
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "${idxName}" ON "${table}" (tenant_id)
      `);
    }

    // ── Step 6: Fix Cliente.cpf UNIQUE ───────────────────────────────
    // Drop old global unique constraint on cpf
    await queryRunner.query(`
      ALTER TABLE clientes DROP CONSTRAINT IF EXISTS "UQ_clientes_cpf"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_clientes_cpf"
    `);
    await queryRunner.query(`
      ALTER TABLE clientes DROP CONSTRAINT IF EXISTS "clientes_cpf_key"
    `);
    // Create composite unique index (cpf per tenant)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_cliente_cpf_tenant"
      ON clientes (cpf, tenant_id)
    `);

    // ── Step 7: Fix Mesa UNIQUE ──────────────────────────────────────
    // Drop old unique constraint (numero, ambiente)
    await queryRunner.query(`
      ALTER TABLE mesas DROP CONSTRAINT IF EXISTS "UQ_mesas_numero_ambiente"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_mesas_numero_ambiente"
    `);
    await queryRunner.query(`
      ALTER TABLE mesas DROP CONSTRAINT IF EXISTS "mesas_numero_ambiente_id_key"
    `);
    // Create composite unique index (numero per ambiente per tenant)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_mesa_numero_ambiente_tenant"
      ON mesas (numero, ambiente_id, tenant_id)
    `);

    // ── Step 8: Composite indexes for common queries ─────────────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_comanda_status_tenant"
      ON comandas (status, tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_pedido_status_tenant"
      ON pedidos (status, tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_item_pedido_status_tenant"
      ON itens_pedido (status, tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_funcionario_email_tenant"
      ON funcionarios (email, tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_abertura_caixa_status_tenant"
      ON aberturas_caixa (status, tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_turno_ativo_tenant"
      ON turnos_funcionario (funcionario_id, ativo, tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop composite indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_turno_ativo_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_abertura_caixa_status_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_funcionario_email_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_item_pedido_status_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedido_status_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comanda_status_tenant"`);

    // Restore Mesa original constraint
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_mesa_numero_ambiente_tenant"`);

    // Restore Cliente original constraint
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cliente_cpf_tenant"`);

    // Remove NOT NULL and FKs
    for (const table of [...this.tables].reverse()) {
      const fkName = `fk_${table}_tenant_id`;
      await queryRunner.query(`
        ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${fkName}"
      `);
      await queryRunner.query(`
        ALTER TABLE "${table}" ALTER COLUMN tenant_id DROP NOT NULL
      `);
    }
  }
}
