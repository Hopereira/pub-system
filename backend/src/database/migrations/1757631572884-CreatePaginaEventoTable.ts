import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaginaEventoTable1757631572884 implements MigrationInterface {
    name = 'CreatePaginaEventoTable1757631572884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "paginas_evento" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying(100) NOT NULL, "url_imagem" text NOT NULL, "ativa" boolean NOT NULL DEFAULT true, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9cd8a83a55186b10f83ffea76bc" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "paginas_evento"`);
    }

}
