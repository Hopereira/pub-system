import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateComandaAgregadoTable1729540100000 implements MigrationInterface {
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
            isNullable: false,
            comment: 'Ordem de cadastro do agregado (1, 2, 3...)',
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

    // Foreign Key: Comanda
    await queryRunner.createForeignKey(
      'comanda_agregados',
      new TableForeignKey({
        columnNames: ['comanda_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comandas',
        onDelete: 'CASCADE',
        name: 'FK_comanda_agregado_comanda',
      }),
    );

    // Índice para melhorar performance em consultas
    await queryRunner.query(`
      CREATE INDEX IDX_comanda_agregados_comanda 
      ON comanda_agregados(comanda_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('comanda_agregados');
  }
}
