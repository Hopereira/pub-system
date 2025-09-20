import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMotivoCancelamentoToItemPedido1758243398792 implements MigrationInterface {
    name = 'AddMotivoCancelamentoToItemPedido1758243398792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."item_pedido_status_enum" AS ENUM('FEITO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')`);
        await queryRunner.query(`CREATE TABLE "item_pedido" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantidade" integer NOT NULL, "precoUnitario" numeric(10,2) NOT NULL DEFAULT '0', "observacao" character varying, "status" "public"."item_pedido_status_enum" NOT NULL DEFAULT 'FEITO', "motivoCancelamento" character varying, "dataCriacao" TIMESTAMP NOT NULL DEFAULT now(), "pedidoId" uuid, "produtoId" uuid, CONSTRAINT "PK_87738b80eb58b6e6ffd234dd4af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "item_pedido" ADD CONSTRAINT "FK_dd1fc6faef3559845d57da2828e" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_pedido" ADD CONSTRAINT "FK_099311cd18493b5ef895627ec99" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_pedido" DROP CONSTRAINT "FK_099311cd18493b5ef895627ec99"`);
        await queryRunner.query(`ALTER TABLE "item_pedido" DROP CONSTRAINT "FK_dd1fc6faef3559845d57da2828e"`);
        await queryRunner.query(`DROP TABLE "item_pedido"`);
        await queryRunner.query(`DROP TYPE "public"."item_pedido_status_enum"`);
    }

}
