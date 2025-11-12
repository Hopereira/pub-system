import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumns1730880000000 implements MigrationInterface {
  name = 'AddMissingColumns1730880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas empresa_id e ambiente_id à tabela funcionarios
    await queryRunner.query(`
      ALTER TABLE "funcionarios" 
      ADD COLUMN IF NOT EXISTS "empresa_id" UUID,
      ADD COLUMN IF NOT EXISTS "ambiente_id" UUID
    `);

    // Adicionar coluna empresa_id à tabela pontos_entrega
    await queryRunner.query(`
      ALTER TABLE "pontos_entrega" 
      ADD COLUMN IF NOT EXISTS "empresa_id" UUID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas da tabela funcionarios
    await queryRunner.query(`
      ALTER TABLE "funcionarios" 
      DROP COLUMN IF EXISTS "empresa_id",
      DROP COLUMN IF EXISTS "ambiente_id"
    `);

    // Remover coluna da tabela pontos_entrega
    await queryRunner.query(`
      ALTER TABLE "pontos_entrega" 
      DROP COLUMN IF EXISTS "empresa_id"
    `);
  }
}
