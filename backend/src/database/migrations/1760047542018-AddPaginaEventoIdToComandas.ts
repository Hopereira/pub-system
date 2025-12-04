import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaginaEventoIdToComandas1760047542018
  implements MigrationInterface
{
  name = 'AddPaginaEventoIdToComandas1760047542018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comandas" ADD "dataAbertura" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "comandas" ADD "paginaEventoId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "clientes" ALTER COLUMN "nome" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientes" DROP CONSTRAINT "UQ_3cd5652ab34ca1a0a2c7a255313"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comandas" ADD CONSTRAINT "FK_679e9e0345e54f981b51034b4cf" FOREIGN KEY ("paginaEventoId") REFERENCES "paginas_evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comandas" DROP CONSTRAINT "FK_679e9e0345e54f981b51034b4cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientes" ADD CONSTRAINT "UQ_3cd5652ab34ca1a0a2c7a255313" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientes" ALTER COLUMN "nome" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "comandas" DROP COLUMN "paginaEventoId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comandas" DROP COLUMN "dataAbertura"`,
    );
  }
}
