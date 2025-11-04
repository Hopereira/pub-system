import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMapaVisualFields1730770000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campos de posição em mesas
    await queryRunner.addColumn(
      'mesas',
      new TableColumn({
        name: 'posicao',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'mesas',
      new TableColumn({
        name: 'tamanho',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'mesas',
      new TableColumn({
        name: 'rotacao',
        type: 'int',
        isNullable: true,
        default: 0,
      }),
    );

    // Adicionar campos de posição em pontos_entrega
    await queryRunner.addColumn(
      'pontos_entrega',
      new TableColumn({
        name: 'posicao',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'pontos_entrega',
      new TableColumn({
        name: 'tamanho',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover campos de mesas
    await queryRunner.dropColumn('mesas', 'rotacao');
    await queryRunner.dropColumn('mesas', 'tamanho');
    await queryRunner.dropColumn('mesas', 'posicao');

    // Remover campos de pontos_entrega
    await queryRunner.dropColumn('pontos_entrega', 'tamanho');
    await queryRunner.dropColumn('pontos_entrega', 'posicao');
  }
}
