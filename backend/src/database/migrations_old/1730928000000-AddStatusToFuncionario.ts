import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToFuncionario1730928000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipo enum
    await queryRunner.query(`
      CREATE TYPE "funcionarios_status_enum" AS ENUM('ATIVO', 'INATIVO')
    `);

    // Adicionar coluna status
    await queryRunner.addColumn(
      'funcionarios',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['ATIVO', 'INATIVO'],
        enumName: 'funcionarios_status_enum',
        default: "'INATIVO'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna
    await queryRunner.dropColumn('funcionarios', 'status');

    // Remover tipo enum
    await queryRunner.query(`DROP TYPE "funcionarios_status_enum"`);
  }
}
