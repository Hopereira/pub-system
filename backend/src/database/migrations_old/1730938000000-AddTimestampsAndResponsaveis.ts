import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampsAndResponsaveis1730938000000
  implements MigrationInterface
{
  name = 'AddTimestampsAndResponsaveis1730938000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campos de responsáveis e timestamps na tabela COMANDAS
    await queryRunner.query(`
      ALTER TABLE "comandas" 
      ADD COLUMN IF NOT EXISTS "criado_por_id" uuid,
      ADD COLUMN IF NOT EXISTS "criado_por_tipo" varchar(20) DEFAULT 'CLIENTE'
    `);

    await queryRunner.query(`
      ALTER TABLE "comandas"
      ADD CONSTRAINT "FK_comanda_criado_por_funcionario"
      FOREIGN KEY ("criado_por_id") 
      REFERENCES "funcionarios"("id") 
      ON DELETE SET NULL
    `);

    // Adicionar campos de responsáveis e timestamps na tabela PEDIDOS
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      ADD COLUMN IF NOT EXISTS "criado_por_id" uuid,
      ADD COLUMN IF NOT EXISTS "criado_por_tipo" varchar(20) DEFAULT 'CLIENTE',
      ADD COLUMN IF NOT EXISTS "entregue_por_id" uuid,
      ADD COLUMN IF NOT EXISTS "entregue_em" timestamp,
      ADD COLUMN IF NOT EXISTS "tempo_total_minutos" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "FK_pedido_criado_por_funcionario"
      FOREIGN KEY ("criado_por_id") 
      REFERENCES "funcionarios"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "FK_pedido_entregue_por_funcionario"
      FOREIGN KEY ("entregue_por_id") 
      REFERENCES "funcionarios"("id") 
      ON DELETE SET NULL
    `);

    // Adicionar timestamps detalhados na tabela ITENS_PEDIDO
    await queryRunner.query(`
      ALTER TABLE "itens_pedido" 
      ADD COLUMN IF NOT EXISTS "iniciado_em" timestamp,
      ADD COLUMN IF NOT EXISTS "pronto_em" timestamp,
      ADD COLUMN IF NOT EXISTS "entregue_em" timestamp,
      ADD COLUMN IF NOT EXISTS "tempo_preparo_minutos" integer
    `);

    // Criar índices para melhor performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comanda_criado_por" 
      ON "comandas" ("criado_por_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pedido_criado_por" 
      ON "pedidos" ("criado_por_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pedido_entregue_por" 
      ON "pedidos" ("entregue_por_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pedido_entregue_em" 
      ON "pedidos" ("entregue_em")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pedido_entregue_em"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pedido_entregue_por"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pedido_criado_por"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comanda_criado_por"`);

    // Remover constraints
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP CONSTRAINT IF EXISTS "FK_pedido_entregue_por_funcionario"
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP CONSTRAINT IF EXISTS "FK_pedido_criado_por_funcionario"
    `);

    await queryRunner.query(`
      ALTER TABLE "comandas" 
      DROP CONSTRAINT IF EXISTS "FK_comanda_criado_por_funcionario"
    `);

    // Remover colunas de ITENS_PEDIDO
    await queryRunner.query(`
      ALTER TABLE "itens_pedido" 
      DROP COLUMN IF EXISTS "tempo_preparo_minutos",
      DROP COLUMN IF EXISTS "entregue_em",
      DROP COLUMN IF EXISTS "pronto_em",
      DROP COLUMN IF EXISTS "iniciado_em"
    `);

    // Remover colunas de PEDIDOS
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP COLUMN IF EXISTS "tempo_total_minutos",
      DROP COLUMN IF EXISTS "entregue_em",
      DROP COLUMN IF EXISTS "entregue_por_id",
      DROP COLUMN IF EXISTS "criado_por_tipo",
      DROP COLUMN IF EXISTS "criado_por_id"
    `);

    // Remover colunas de COMANDAS
    await queryRunner.query(`
      ALTER TABLE "comandas" 
      DROP COLUMN IF EXISTS "criado_por_tipo",
      DROP COLUMN IF EXISTS "criado_por_id"
    `);
  }
}
