import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTelefoneToFuncionarios1765461600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('funcionarios');
    const telefoneColumn = table?.findColumnByName('telefone');

    if (!telefoneColumn) {
      await queryRunner.addColumn(
        'funcionarios',
        new TableColumn({
          name: 'telefone',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('funcionarios', 'telefone');
  }
}
