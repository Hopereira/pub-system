import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimestampsToItemPedido1730739600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'iniciadoEm',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'prontoEm',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'entregueEm',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('itens_pedido', 'entregueEm');
    await queryRunner.dropColumn('itens_pedido', 'prontoEm');
    await queryRunner.dropColumn('itens_pedido', 'iniciadoEm');
  }
}
