import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAvaliacaoTable1730739700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'avaliacoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'comandaId',
            type: 'uuid',
          },
          {
            name: 'clienteId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'nota',
            type: 'int',
          },
          {
            name: 'comentario',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tempoEstadia',
            type: 'int',
            isNullable: true,
            comment: 'Tempo de estadia em minutos',
          },
          {
            name: 'valorGasto',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'criadoEm',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign Key para Comanda
    await queryRunner.createForeignKey(
      'avaliacoes',
      new TableForeignKey({
        columnNames: ['comandaId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comandas',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign Key para Cliente
    await queryRunner.createForeignKey(
      'avaliacoes',
      new TableForeignKey({
        columnNames: ['clienteId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clientes',
        onDelete: 'SET NULL',
      }),
    );

    // Índice para buscar avaliações por data
    await queryRunner.query(`
      CREATE INDEX "idx_avaliacoes_criado_em" ON "avaliacoes"("criadoEm");
    `);

    // Índice para buscar avaliações por comanda
    await queryRunner.query(`
      CREATE INDEX "idx_avaliacoes_comanda_id" ON "avaliacoes"("comandaId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_avaliacoes_comanda_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_avaliacoes_criado_em;`);
    await queryRunner.dropTable('avaliacoes');
  }
}
