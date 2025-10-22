import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePontoEntregaTable1760060000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela pontos_entrega
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
            name: 'ambiente_preparo_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'mesa_proxima_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
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

    // FK: ambiente_preparo_id -> ambientes
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['ambiente_preparo_id'],
        referencedTableName: 'ambientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ponto_entrega_ambiente_preparo',
      }),
    );

    // FK: mesa_proxima_id -> mesas (opcional)
    await queryRunner.createForeignKey(
      'pontos_entrega',
      new TableForeignKey({
        columnNames: ['mesa_proxima_id'],
        referencedTableName: 'mesas',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ponto_entrega_mesa_proxima',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pontos_entrega', 'FK_ponto_entrega_mesa_proxima');
    await queryRunner.dropForeignKey('pontos_entrega', 'FK_ponto_entrega_ambiente_preparo');
    await queryRunner.dropTable('pontos_entrega');
  }
}
