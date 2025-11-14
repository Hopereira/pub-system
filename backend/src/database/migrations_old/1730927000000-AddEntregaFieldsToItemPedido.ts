import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddEntregaFieldsToItemPedido1730927000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna garcom_entrega_id
    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'garcom_entrega_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adiciona coluna tempoEntregaMinutos
    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'tempoEntregaMinutos',
        type: 'int',
        isNullable: true,
      }),
    );

    // Adiciona foreign key para garcom_entrega_id
    await queryRunner.createForeignKey(
      'itens_pedido',
      new TableForeignKey({
        name: 'FK_item_pedido_garcom_entrega',
        columnNames: ['garcom_entrega_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    await queryRunner.dropForeignKey('itens_pedido', 'FK_item_pedido_garcom_entrega');

    // Remove colunas
    await queryRunner.dropColumn('itens_pedido', 'tempoEntregaMinutos');
    await queryRunner.dropColumn('itens_pedido', 'garcom_entrega_id');
  }
}
