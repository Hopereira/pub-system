import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTempoEntregaMinutosColumn1765461300000 implements MigrationInterface {
  name = 'FixTempoEntregaMinutosColumn1765461300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna tempoentregaminutos se não existir (corrige nome lowercase)
    await queryRunner.query(`
      ALTER TABLE "itens_pedido" 
      ADD COLUMN IF NOT EXISTS "tempoentregaminutos" INTEGER
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "itens_pedido" 
      DROP COLUMN IF EXISTS "tempoentregaminutos"
    `);
  }
}
