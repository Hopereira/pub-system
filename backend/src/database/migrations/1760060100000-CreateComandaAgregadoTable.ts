import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateComandaAgregadoTable1760060100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comanda_agregados',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'comanda_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '11',
            isNullable: true,
          },
          {
            name: 'ordem',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // FK: comanda_id -> comandas
    await queryRunner.createForeignKey(
      'comanda_agregados',
      new TableForeignKey({
        columnNames: ['comanda_id'],
        referencedTableName: 'comandas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_agregado_comanda',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('comanda_agregados', 'FK_agregado_comanda');
    await queryRunner.dropTable('comanda_agregados');
  }
}
