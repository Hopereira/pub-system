import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUrlImagemNullableInPaginaEvento1758904253816 implements MigrationInterface {
    name = 'MakeUrlImagemNullableInPaginaEvento1758904253816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "paginas_evento" ALTER COLUMN "url_imagem" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "paginas_evento" ALTER COLUMN "url_imagem" SET NOT NULL`);
    }

}
