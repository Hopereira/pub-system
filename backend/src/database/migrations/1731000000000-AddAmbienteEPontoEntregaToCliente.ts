import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddAmbienteEPontoEntregaToCliente1731000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna ambiente_id
    await queryRunner.addColumn(
      'clientes',
      new TableColumn({
        name: 'ambiente_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adiciona coluna ponto_entrega_id
    await queryRunner.addColumn(
      'clientes',
      new TableColumn({
        name: 'ponto_entrega_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adiciona FK para ambientes
    await queryRunner.createForeignKey(
      'clientes',
      new TableForeignKey({
        name: 'FK_clientes_ambiente',
        columnNames: ['ambiente_id'],
        referencedTableName: 'ambientes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Adiciona FK para pontos_entrega
    await queryRunner.createForeignKey(
      'clientes',
      new TableForeignKey({
        name: 'FK_clientes_ponto_entrega',
        columnNames: ['ponto_entrega_id'],
        referencedTableName: 'pontos_entrega',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FKs
    await queryRunner.dropForeignKey('clientes', 'FK_clientes_ponto_entrega');
    await queryRunner.dropForeignKey('clientes', 'FK_clientes_ambiente');

    // Remove colunas
    await queryRunner.dropColumn('clientes', 'ponto_entrega_id');
    await queryRunner.dropColumn('clientes', 'ambiente_id');
  }
}
