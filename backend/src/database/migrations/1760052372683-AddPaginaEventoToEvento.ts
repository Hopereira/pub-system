import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaginaEventoToEvento1760052372683 implements MigrationInterface {
    name = 'AddPaginaEventoToEvento1760052372683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eventos" ADD "paginaEventoId" uuid`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "dataEvento"`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "dataEvento" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "urlImagem"`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "urlImagem" character varying`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD CONSTRAINT "FK_f0449752922ac3048bf729d8615" FOREIGN KEY ("paginaEventoId") REFERENCES "paginas_evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eventos" DROP CONSTRAINT "FK_f0449752922ac3048bf729d8615"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "urlImagem"`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "urlImagem" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "dataEvento"`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "dataEvento" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "paginaEventoId"`);
    }

}
