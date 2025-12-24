import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeysToFuncionarios1760100000000
  implements MigrationInterface
{
  name = 'AddForeignKeysToFuncionarios1760100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona FK para empresa_id em funcionarios
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_funcionarios_empresa'
        ) THEN
          ALTER TABLE "funcionarios" 
          ADD CONSTRAINT "FK_funcionarios_empresa" 
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Adiciona FK para ambiente_id em funcionarios
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_funcionarios_ambiente'
        ) THEN
          ALTER TABLE "funcionarios" 
          ADD CONSTRAINT "FK_funcionarios_ambiente" 
          FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Adiciona FK para empresa_id em pontos_entrega
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_pontos_entrega_empresa'
        ) THEN
          ALTER TABLE "pontos_entrega" 
          ADD CONSTRAINT "FK_pontos_entrega_empresa" 
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Cria índices para melhorar performance de queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_funcionarios_empresa_id" ON "funcionarios" ("empresa_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_funcionarios_ambiente_id" ON "funcionarios" ("ambiente_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pontos_entrega_empresa_id" ON "pontos_entrega" ("empresa_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_funcionarios_empresa_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_funcionarios_ambiente_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pontos_entrega_empresa_id";`);

    // Remove FKs
    await queryRunner.query(`
      ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "FK_funcionarios_empresa";
    `);
    await queryRunner.query(`
      ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "FK_funcionarios_ambiente";
    `);
    await queryRunner.query(`
      ALTER TABLE "pontos_entrega" DROP CONSTRAINT IF EXISTS "FK_pontos_entrega_empresa";
    `);
  }
}
