import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRetiradaItensTable1731363600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela retiradas_itens
    await queryRunner.createTable(
      new Table({
        name: 'retiradas_itens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'item_pedido_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'garcom_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ambiente_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'retirado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'tempo_reacao_minutos',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo entre PRONTO e RETIRADO em minutos',
          },
          {
            name: 'observacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign Key: item_pedido_id -> itens_pedido(id)
    await queryRunner.createForeignKey(
      'retiradas_itens',
      new TableForeignKey({
        columnNames: ['item_pedido_id'],
        referencedTableName: 'itens_pedido',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_retiradas_itens_item_pedido',
      }),
    );

    // Foreign Key: garcom_id -> funcionarios(id)
    await queryRunner.createForeignKey(
      'retiradas_itens',
      new TableForeignKey({
        columnNames: ['garcom_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_retiradas_itens_garcom',
      }),
    );

    // Foreign Key: ambiente_id -> ambientes(id)
    await queryRunner.createForeignKey(
      'retiradas_itens',
      new TableForeignKey({
        columnNames: ['ambiente_id'],
        referencedTableName: 'ambientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_retiradas_itens_ambiente',
      }),
    );

    // Índices para performance
    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_item_pedido 
      ON retiradas_itens(item_pedido_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_garcom 
      ON retiradas_itens(garcom_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_ambiente 
      ON retiradas_itens(ambiente_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_retirado_em 
      ON retiradas_itens(retirado_em DESC);
    `);

    // Índice composto para consultas de performance por garçom e período
    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_garcom_data 
      ON retiradas_itens(garcom_id, retirado_em DESC);
    `);

    // Índice composto para consultas de performance por ambiente e período
    await queryRunner.query(`
      CREATE INDEX IDX_retiradas_itens_ambiente_data 
      ON retiradas_itens(ambiente_id, retirado_em DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_retiradas_itens_ambiente_data`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_retiradas_itens_garcom_data`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_retiradas_itens_retirado_em`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_retiradas_itens_ambiente`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_retiradas_itens_garcom`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_retiradas_itens_item_pedido`,
    );

    // Remover foreign keys
    await queryRunner.dropForeignKey(
      'retiradas_itens',
      'FK_retiradas_itens_ambiente',
    );
    await queryRunner.dropForeignKey(
      'retiradas_itens',
      'FK_retiradas_itens_garcom',
    );
    await queryRunner.dropForeignKey(
      'retiradas_itens',
      'FK_retiradas_itens_item_pedido',
    );

    // Remover tabela
    await queryRunner.dropTable('retiradas_itens');
  }
}
