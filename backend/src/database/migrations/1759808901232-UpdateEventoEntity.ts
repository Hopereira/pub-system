import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEventoEntity1759808901232 implements MigrationInterface {
  name = 'UpdateEventoEntity1759808901232';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "dataEvento"`);
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "dataEvento" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "urlImagem"`);
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "urlImagem" character varying(512)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "urlImagem"`);
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "urlImagem" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "dataEvento"`);
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "dataEvento" TIMESTAMP NOT NULL`,
    );
  }
}
