import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingColumnsToFuncionarios1765461700000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('funcionarios');

    // Adicionar coluna endereco se não existir
    const enderecoColumn = table?.findColumnByName('endereco');
    if (!enderecoColumn) {
      await queryRunner.addColumn(
        'funcionarios',
        new TableColumn({
          name: 'endereco',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    // Adicionar coluna foto_url se não existir
    const fotoUrlColumn = table?.findColumnByName('foto_url');
    if (!fotoUrlColumn) {
      await queryRunner.addColumn(
        'funcionarios',
        new TableColumn({
          name: 'foto_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('funcionarios');

    if (table?.findColumnByName('endereco')) {
      await queryRunner.dropColumn('funcionarios', 'endereco');
    }

    if (table?.findColumnByName('foto_url')) {
      await queryRunner.dropColumn('funcionarios', 'foto_url');
    }
  }
}
