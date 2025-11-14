import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTurnoFuncionarioTable1730760000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'turnos_funcionario',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'funcionario_id',
            type: 'uuid',
          },
          {
            name: 'checkIn',
            type: 'timestamp',
          },
          {
            name: 'checkOut',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'horasTrabalhadas',
            type: 'int',
            isNullable: true,
            comment: 'Tempo trabalhado em minutos',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'evento_id',
            type: 'uuid',
            isNullable: true,
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

    // Foreign key para funcionarios
    await queryRunner.createForeignKey(
      'turnos_funcionario',
      new TableForeignKey({
        columnNames: ['funcionario_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'funcionarios',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key para eventos
    await queryRunner.createForeignKey(
      'turnos_funcionario',
      new TableForeignKey({
        columnNames: ['evento_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'eventos',
        onDelete: 'SET NULL',
      }),
    );

    // Índice para buscar turnos ativos
    await queryRunner.query(`
      CREATE INDEX "idx_turnos_ativo" ON "turnos_funcionario"("ativo", "checkOut");
    `);

    // Índice para buscar por funcionário
    await queryRunner.query(`
      CREATE INDEX "idx_turnos_funcionario_id" ON "turnos_funcionario"("funcionario_id");
    `);

    // Índice para buscar por data
    await queryRunner.query(`
      CREATE INDEX "idx_turnos_check_in" ON "turnos_funcionario"("checkIn");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_turnos_check_in";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_turnos_funcionario_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_turnos_ativo";`);
    await queryRunner.dropTable('turnos_funcionario');
  }
}
