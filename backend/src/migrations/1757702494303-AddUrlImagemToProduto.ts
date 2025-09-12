import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUrlImagemToProduto1757702494303 implements MigrationInterface {
    name = 'AddUrlImagemToProduto1757702494303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produtos" ADD "urlImagem" character varying(512)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produtos" DROP COLUMN "urlImagem"`);
    }

}
