import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFluxoGarcomCompleto1730990000000 implements MigrationInterface {
  name = 'AddFluxoGarcomCompleto1730990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar novos estados ao enum PedidoStatus
    await queryRunner.query(`
      ALTER TYPE "public"."pedido_status_enum" 
      RENAME TO "pedido_status_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."pedido_status_enum" AS ENUM(
        'FEITO',
        'EM_PREPARO',
        'QUASE_PRONTO',
        'PRONTO',
        'RETIRADO',
        'ENTREGUE',
        'CANCELADO',
        'DEIXADO_NO_AMBIENTE'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ALTER COLUMN "status" TYPE "public"."pedido_status_enum"
      USING "status"::text::"public"."pedido_status_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."pedido_status_enum_old"
    `);

    // 2. Adicionar novos campos de timestamps
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN "quase_pronto_em" TIMESTAMP NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN "retirado_em" TIMESTAMP NULL
    `);

    // 3. Adicionar campo de garçom que retirou
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN "retirado_por_garcom_id" UUID NULL
    `);

    // 4. Adicionar FK para garçom que retirou
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD CONSTRAINT "FK_itens_pedido_retirado_por_garcom"
      FOREIGN KEY ("retirado_por_garcom_id")
      REFERENCES "usuarios"("id")
      ON DELETE SET NULL
    `);

    // 5. Adicionar campos de tempo calculados
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN "tempo_reacao_minutos" INTEGER NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN "tempo_entrega_final_minutos" INTEGER NULL
    `);

    // 6. Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_itens_pedido_status_ambiente"
      ON "itens_pedido" ("status", "ambiente_retirada_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_itens_pedido_retirado_garcom"
      ON "itens_pedido" ("retirado_por_garcom_id", "retirado_em")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_itens_pedido_quase_pronto"
      ON "itens_pedido" ("status", "quase_pronto_em")
      WHERE "status" = 'QUASE_PRONTO'
    `);

    // 7. Adicionar comentários nas colunas para documentação
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."quase_pronto_em" IS 'Timestamp quando o item foi marcado como quase pronto (30-60s antes de ficar pronto)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."retirado_em" IS 'Timestamp quando o garçom retirou o item do ambiente de produção'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."retirado_por_garcom_id" IS 'ID do garçom que retirou o item'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."tempo_reacao_minutos" IS 'Tempo entre PRONTO e RETIRADO (rapidez de reação do garçom)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."tempo_entrega_final_minutos" IS 'Tempo entre RETIRADO e ENTREGUE (eficiência na última milha)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover comentários
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."tempo_entrega_final_minutos" IS NULL
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."tempo_reacao_minutos" IS NULL
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."retirado_por_garcom_id" IS NULL
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."retirado_em" IS NULL
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "itens_pedido"."quase_pronto_em" IS NULL
    `);

    // Remover índices
    await queryRunner.query(`DROP INDEX "public"."IDX_itens_pedido_quase_pronto"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_itens_pedido_retirado_garcom"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_itens_pedido_status_ambiente"`);

    // Remover colunas
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "tempo_entrega_final_minutos"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "tempo_reacao_minutos"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT "FK_itens_pedido_retirado_por_garcom"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "retirado_por_garcom_id"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "retirado_em"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN "quase_pronto_em"`);

    // Reverter enum
    await queryRunner.query(`
      CREATE TYPE "public"."pedido_status_enum_old" AS ENUM(
        'FEITO',
        'EM_PREPARO',
        'PRONTO',
        'ENTREGUE',
        'CANCELADO',
        'DEIXADO_NO_AMBIENTE'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ALTER COLUMN "status" TYPE "public"."pedido_status_enum_old"
      USING "status"::text::"public"."pedido_status_enum_old"
    `);

    await queryRunner.query(`DROP TYPE "public"."pedido_status_enum"`);
    await queryRunner.query(`
      ALTER TYPE "public"."pedido_status_enum_old" 
      RENAME TO "pedido_status_enum"
    `);
  }
}
