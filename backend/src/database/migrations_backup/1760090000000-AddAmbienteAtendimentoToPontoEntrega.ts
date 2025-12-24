import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAmbienteAtendimentoToPontoEntrega1760090000000 implements MigrationInterface {
  name = 'AddAmbienteAtendimentoToPontoEntrega1760090000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna ambiente_atendimento_id
    await queryRunner.addColumn(
      'pontos_entrega',
      new TableColumn({
        name: 'ambiente_atendimento_id',
        type: 'uuid',
        isNullable: true, // Inicialmente nullable para não quebrar dados existentes
      }),
    );

    // Adicionar foreign key para ambiente de atendimento
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['ambiente_atendimento_id'],
        referencedTableName: 'ambientes',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'FK_ponto_entrega_ambiente_atendimento',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    await queryRunner.dropForeignKey('pontos_entrega', 'FK_ponto_entrega_ambiente_atendimento');

    // Remover coluna
    await queryRunner.dropColumn('pontos_entrega', 'ambiente_atendimento_id');
  }
}
