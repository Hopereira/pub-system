import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddPontoEntregaToComanda1760060200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna ponto_entrega_id à tabela comandas
    await queryRunner.addColumn(
      'comandas',
      new TableColumn({
        name: 'ponto_entrega_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Criar FK ponto_entrega_id -> pontos_entrega
    await queryRunner.createForeignKey(
      'comandas',
      new TableForeignKey({
        columnNames: ['ponto_entrega_id'],
        referencedTableName: 'pontos_entrega',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_comanda_ponto_entrega',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('comandas', 'FK_comanda_ponto_entrega');
    await queryRunner.dropColumn('comandas', 'ponto_entrega_id');
  }
}
