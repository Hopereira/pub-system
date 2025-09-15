import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemStatus1757957694500 implements MigrationInterface {
    name = 'AddItemStatus1757957694500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."itens_pedido_status_enum" AS ENUM('FEITO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')`);
        await queryRunner.query(`ALTER TABLE "itens_pedido" ADD "status" "public"."itens_pedido_status_enum" NOT NULL DEFAULT 'FEITO'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."itens_pedido_status_enum"`);
    }

}
