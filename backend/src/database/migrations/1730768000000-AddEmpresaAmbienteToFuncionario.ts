import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmpresaAmbienteToFuncionario1730768000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Buscar empresa_id e ambiente_id da primeira empresa/ambiente (para usar como default)
    const empresa = await queryRunner.query(`SELECT id FROM empresas LIMIT 1`);
    const empresaId = empresa[0]?.id;

    const ambiente = await queryRunner.query(
      `SELECT id FROM ambientes LIMIT 1`,
    );
    const ambienteId = ambiente[0]?.id;

    if (!empresaId) {
      throw new Error('Nenhuma empresa encontrada no banco de dados');
    }

    if (!ambienteId) {
      throw new Error('Nenhum ambiente encontrado no banco de dados');
    }

    // Adicionar coluna empresa_id
    await queryRunner.addColumn(
      'funcionarios',
      new TableColumn({
        name: 'empresa_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adicionar coluna ambiente_id
    await queryRunner.addColumn(
      'funcionarios',
      new TableColumn({
        name: 'ambiente_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Atualizar funcionários existentes com os IDs padrão
    await queryRunner.query(
      `UPDATE funcionarios SET empresa_id = '${empresaId}', ambiente_id = '${ambienteId}' WHERE empresa_id IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('funcionarios', 'ambiente_id');
    await queryRunner.dropColumn('funcionarios', 'empresa_id');
  }
}
