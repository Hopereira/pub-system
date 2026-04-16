import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: tornar tenant_id nullable em funcionarios
 *
 * Contexto:
 * - SUPER_ADMIN é o dono do SaaS — não pertence a nenhum tenant
 * - A migration MultiTenantFKsAndConstraints forçou tenant_id NOT NULL
 *   em todas as tabelas, incluindo funcionarios
 * - Isso impede a criação/atualização do SUPER_ADMIN (tenant_id = NULL)
 * - O auth service já busca SUPER_ADMIN com WHERE tenant_id IS NULL
 *
 * Esta migration:
 * 1. Remove a FK constraint tenant_id -> tenants(id) em funcionarios
 * 2. Torna tenant_id nullable em funcionarios
 * 3. Recria a FK com nullable (ON DELETE CASCADE, nullable: true)
 */
export class AllowNullTenantInFuncionarios1744900000000 implements MigrationInterface {
  name = 'AllowNullTenantInFuncionarios1744900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover FK constraint existente
    await queryRunner.query(
      `ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "fk_funcionarios_tenant_id"`,
    );

    // 2. Tornar tenant_id nullable
    await queryRunner.query(
      `ALTER TABLE "funcionarios" ALTER COLUMN "tenant_id" DROP NOT NULL`,
    );

    // 3. Recriar FK com nullable (ON DELETE CASCADE mantido para tenants normais)
    await queryRunner.query(`
      ALTER TABLE "funcionarios"
      ADD CONSTRAINT "fk_funcionarios_tenant_id"
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover FK
    await queryRunner.query(
      `ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "fk_funcionarios_tenant_id"`,
    );

    // Restaurar NOT NULL (backfill necessário antes)
    await queryRunner.query(
      `ALTER TABLE "funcionarios" ALTER COLUMN "tenant_id" SET NOT NULL`,
    );

    // Recriar FK
    await queryRunner.query(`
      ALTER TABLE "funcionarios"
      ADD CONSTRAINT "fk_funcionarios_tenant_id"
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    `);
  }
}
