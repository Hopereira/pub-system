import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddEmpresaToPontoEntrega1760060400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Buscar empresa_id da primeira empresa (para usar como default)
    const empresa = await queryRunner.query(`SELECT id FROM empresas LIMIT 1`);
    const empresaId = empresa[0]?.id;

    if (!empresaId) {
      throw new Error('Nenhuma empresa encontrada no banco de dados');
    }

    // Adicionar coluna empresa_id à tabela pontos_entrega
    await queryRunner.addColumn(
      'pontos_entrega',
      new TableColumn({
        name: 'empresa_id',
        type: 'uuid',
        isNullable: false,
        default: `'${empresaId}'`,
      }),
    );

    // Remover default depois de popular
    await queryRunner.changeColumn(
      'pontos_entrega',
      'empresa_id',
      new TableColumn({
        name: 'empresa_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Criar FK empresa_id -> empresas
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedTableName: 'empresas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ponto_entrega_empresa',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pontos_entrega', 'FK_ponto_entrega_empresa');
    await queryRunner.dropColumn('pontos_entrega', 'empresa_id');
  }
}
