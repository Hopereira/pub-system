import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: tornar tenant_id nullable em funcionarios, refresh_tokens e audit_logs
 *
 * Contexto:
 * - SUPER_ADMIN é o dono do SaaS — não pertence a nenhum tenant (tenant_id = NULL)
 * - A migration MultiTenantFKsAndConstraints forçou tenant_id NOT NULL em todas
 *   as tabelas operacionais, incluindo funcionarios, refresh_tokens e audit_logs
 * - Ao fazer login como SUPER_ADMIN:
 *   1. funcionarios.tenant_id = NULL → constraint viola NOT NULL
 *   2. refresh_tokens.tenant_id = NULL → idem
 *   3. audit_logs.tenant_id = NULL → idem
 *
 * Esta migration torna tenant_id nullable nessas 3 tabelas,
 * mantendo a FK válida para tenants normais.
 */
export class AllowNullTenantInFuncionarios1744900000000 implements MigrationInterface {
  name = 'AllowNullTenantInFuncionarios1744900000000';

  private readonly tables = ['funcionarios', 'refresh_tokens', 'audit_logs'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      // 1. Remover FK constraint existente
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "fk_${table}_tenant_id"`,
      );

      // 2. Tornar tenant_id nullable
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenant_id" DROP NOT NULL`,
      );

      // 3. Recriar FK com nullable (ON DELETE CASCADE mantido para tenants normais)
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "fk_${table}_tenant_id"
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...this.tables].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "fk_${table}_tenant_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenant_id" SET NOT NULL`,
      );
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "fk_${table}_tenant_id"
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      `);
    }
  }
}
