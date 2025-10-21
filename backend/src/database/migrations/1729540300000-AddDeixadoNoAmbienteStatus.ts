import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddDeixadoNoAmbienteStatus1729540300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar novo status no enum
    // IMPORTANTE: O nome do enum é baseado na tabela 'itens_pedido', não 'pedido'
    await queryRunner.query(`
      ALTER TYPE itens_pedido_status_enum 
      ADD VALUE IF NOT EXISTS 'DEIXADO_NO_AMBIENTE';
    `);

    // 2. Adicionar coluna ambiente_retirada_id em itens_pedido
    // IMPORTANTE: A tabela se chama 'itens_pedido' (plural), não 'item_pedido'
    await queryRunner.addColumn(
      'itens_pedido',
      new TableColumn({
        name: 'ambiente_retirada_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Ambiente onde o item foi deixado quando cliente não foi encontrado',
      }),
    );

    // 3. Foreign Key: Ambiente de Retirada
    await queryRunner.createForeignKey(
      'itens_pedido',
      new TableForeignKey({
        columnNames: ['ambiente_retirada_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ambientes',
        onDelete: 'SET NULL',
        name: 'FK_item_pedido_ambiente_retirada',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    const table = await queryRunner.getTable('itens_pedido');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('ambiente_retirada_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('itens_pedido', foreignKey);
    }

    // Remove coluna
    await queryRunner.dropColumn('itens_pedido', 'ambiente_retirada_id');

    // Nota: Não é possível remover um valor do enum no PostgreSQL
    // O status DEIXADO_NO_AMBIENTE permanecerá no banco
  }
}
