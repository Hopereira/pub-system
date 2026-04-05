import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: tornar empresa_id nullable em pontos_entrega
 *
 * Contexto:
 * - A coluna empresa_id é legado — substituída por tenant_id via TenantAwareEntity
 * - A entity PontoEntrega define empresa_id como nullable: true
 * - O banco de produção foi criado com NOT NULL nesta coluna (constraint nunca removida)
 * - Isso causava 500 em POST /pontos-entrega: "null value in column empresa_id violates not-null constraint"
 *
 * Esta migration:
 * 1. Remove a FK constraint existente (empresa_id -> empresas.id ON DELETE CASCADE)
 * 2. Torna empresa_id nullable (DROP NOT NULL)
 * 3. Recria a FK com ON DELETE SET NULL (consistente com a entity)
 */
export class MakeEmpresaIdNullableInPontosEntrega1743868800000
  implements MigrationInterface
{
  name = 'MakeEmpresaIdNullableInPontosEntrega1743868800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover FK constraint atual (ON DELETE CASCADE)
    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" DROP CONSTRAINT IF EXISTS "FK_6ac1ee2694f3d444f34cb5c4f41"`,
    );

    // 2. Tornar empresa_id nullable
    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" ALTER COLUMN "empresa_id" DROP NOT NULL`,
    );

    // 3. Recriar FK com ON DELETE SET NULL (alinhado com a entity)
    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" ADD CONSTRAINT "FK_6ac1ee2694f3d444f34cb5c4f41" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: remover FK, setar NOT NULL (apenas se não houver nulls), recriar FK original
    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" DROP CONSTRAINT IF EXISTS "FK_6ac1ee2694f3d444f34cb5c4f41"`,
    );

    // Backfill nulls antes de recolocar NOT NULL (usa o primeiro empresa_id disponível como fallback)
    await queryRunner.query(`
      UPDATE "pontos_entrega" pe
      SET empresa_id = (SELECT id FROM empresas LIMIT 1)
      WHERE pe.empresa_id IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" ALTER COLUMN "empresa_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "pontos_entrega" ADD CONSTRAINT "FK_6ac1ee2694f3d444f34cb5c4f41" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE`,
    );
  }
}
