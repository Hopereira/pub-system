import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddDeixadoNoAmbienteStatus1760060300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novo enum value 'DEIXADO_NO_AMBIENTE' ao tipo itens_pedido_status_enum
    await queryRunner.query(`
      ALTER TYPE "itens_pedido_status_enum" ADD VALUE IF NOT EXISTS 'DEIXADO_NO_AMBIENTE';
    `);

    // Adicionar coluna ambiente_retirada_id à tabela itens_pedido
    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'ambiente_retirada_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Criar FK ambiente_retirada_id -> ambientes
    await queryRunner.createForeignKey(
      'itens_pedido',
      new TableForeignKey({
        columnNames: ['ambiente_retirada_id'],
        referencedTableName: 'ambientes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_item_pedido_ambiente_retirada',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'itens_pedido',
      'FK_item_pedido_ambiente_retirada',
    );
    await queryRunner.dropColumn('itens_pedido', 'ambiente_retirada_id');

    // Nota: Não podemos remover um valor de enum no PostgreSQL facilmente
    // Seria necessário recriar o tipo, o que é complexo e arriscado
    // Por isso, deixamos o valor no enum mesmo no rollback
  }
}
