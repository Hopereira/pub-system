import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventosTable1758893282462 implements MigrationInterface {
    name = 'CreateEventosTable1758893282462'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "eventos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying NOT NULL, "descricao" text, "dataEvento" TIMESTAMP NOT NULL, "urlImagem" character varying, CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "eventos"`);
    }

}
