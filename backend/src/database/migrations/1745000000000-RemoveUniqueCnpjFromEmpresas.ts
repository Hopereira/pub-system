import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueCnpjFromEmpresas1745000000000 implements MigrationInterface {
  name = 'RemoveUniqueCnpjFromEmpresas1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresas" DROP CONSTRAINT IF EXISTS "UQ_f5ed71aeb4ef47f95df5f8830b8"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD CONSTRAINT "UQ_f5ed71aeb4ef47f95df5f8830b8" UNIQUE ("cnpj")`,
    );
  }
}
