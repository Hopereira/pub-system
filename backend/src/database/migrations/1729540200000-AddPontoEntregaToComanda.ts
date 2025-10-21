import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPontoEntregaToComanda1729540200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna ponto_entrega_id
    await queryRunner.addColumn(
      'comandas',
      new TableColumn({
        name: 'ponto_entrega_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Foreign Key: Ponto de Entrega
    await queryRunner.createForeignKey(
      'comandas',
      new TableForeignKey({
        columnNames: ['ponto_entrega_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pontos_entrega',
        onDelete: 'SET NULL',
        name: 'FK_comanda_ponto_entrega',
      }),
    );

    // NOTA: A constraint XOR (Mesa OU Ponto) não é criada aqui porque:
    // 1. Comandas antigas no banco podem ter ambos NULL (balcão sem ponto definido)
    // 2. Ainda não existem pontos de entrega criados no sistema
    // 3. A validação já existe no ComandaService (create method)
    // A constraint pode ser adicionada manualmente depois via SQL se necessário:
    // ALTER TABLE comandas ADD CONSTRAINT CHK_comanda_local_entrega 
    // CHECK (("mesaId" IS NOT NULL AND ponto_entrega_id IS NULL) OR ("mesaId" IS NULL AND ponto_entrega_id IS NOT NULL));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove constraint
    await queryRunner.query(`
      ALTER TABLE comandas
      DROP CONSTRAINT IF EXISTS CHK_comanda_local_entrega;
    `);

    // Remove foreign key
    const table = await queryRunner.getTable('comandas');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('ponto_entrega_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('comandas', foreignKey);
    }

    // Remove coluna
    await queryRunner.dropColumn('comandas', 'ponto_entrega_id');
  }
}
