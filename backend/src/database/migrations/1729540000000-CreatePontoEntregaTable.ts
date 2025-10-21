import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePontoEntregaTable1729540000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pontos_entrega',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'mesa_proxima_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ambiente_preparo_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Foreign Key: Mesa Próxima
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['mesa_proxima_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mesas',
        onDelete: 'SET NULL',
        name: 'FK_ponto_entrega_mesa_proxima',
      }),
    );

    // Foreign Key: Ambiente de Preparo
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['ambiente_preparo_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ambientes',
        onDelete: 'RESTRICT',
        name: 'FK_ponto_entrega_ambiente_preparo',
      }),
    );

    // Foreign Key: Empresa
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'empresas',
        onDelete: 'CASCADE',
        name: 'FK_ponto_entrega_empresa',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pontos_entrega');
  }
}
