import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Adiciona tenant_id à tabela refresh_tokens
 * 
 * Objetivo: Isolar refresh tokens por tenant para impedir uso cross-tenant
 */
export class AddTenantIdToRefreshTokens1734550000000 implements MigrationInterface {
  name = 'AddTenantIdToRefreshTokens1734550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna tenant_id (nullable inicialmente)
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      ADD COLUMN IF NOT EXISTS "tenantId" uuid
    `);

    // 2. Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_token_tenant" 
      ON "refresh_tokens" ("tenantId")
    `);

    // 3. Criar índice composto para queries por tenant + funcionário
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_token_tenant_funcionario" 
      ON "refresh_tokens" ("tenantId", "funcionarioId")
    `);

    // 4. Adicionar FK para tabela tenants (se existir)
    // Nota: FK é opcional pois o tenant pode não existir ainda
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
          ALTER TABLE "refresh_tokens" 
          ADD CONSTRAINT "fk_refresh_token_tenant" 
          FOREIGN KEY ("tenantId") 
          REFERENCES "tenants"("id") 
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        END IF;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log('✅ Migration: tenant_id adicionado à tabela refresh_tokens');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover FK se existir
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      DROP CONSTRAINT IF EXISTS "fk_refresh_token_tenant"
    `);

    // Remover índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_refresh_token_tenant_funcionario"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_refresh_token_tenant"
    `);

    // Remover coluna
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      DROP COLUMN IF EXISTS "tenantId"
    `);

    console.log('✅ Migration revertida: tenant_id removido da tabela refresh_tokens');
  }
}
