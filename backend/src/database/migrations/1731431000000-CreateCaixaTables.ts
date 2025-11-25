import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCaixaTables1731431000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de aberturas_caixa
    await queryRunner.createTable(
      new Table({
        name: 'aberturas_caixa',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'turno_funcionario_id',
            type: 'uuid',
          },
          {
            name: 'funcionario_id',
            type: 'uuid',
          },
          {
            name: 'dataAbertura',
            type: 'date',
          },
          {
            name: 'horaAbertura',
            type: 'time',
          },
          {
            name: 'valorInicial',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'observacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'ABERTO'",
          },
          {
            name: 'criadoEm',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'atualizadoEm',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys de aberturas_caixa
    await queryRunner.createForeignKey(
      'aberturas_caixa',
      new TableForeignKey({
        columnNames: ['turno_funcionario_id'],
        referencedTableName: 'turnos_funcionario',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'aberturas_caixa',
      new TableForeignKey({
        columnNames: ['funcionario_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Tabela de sangrias
    await queryRunner.createTable(
      new Table({
        name: 'sangrias',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'abertura_caixa_id',
            type: 'uuid',
          },
          {
            name: 'turno_funcionario_id',
            type: 'uuid',
          },
          {
            name: 'funcionario_id',
            type: 'uuid',
          },
          {
            name: 'dataSangria',
            type: 'date',
          },
          {
            name: 'horaSangria',
            type: 'time',
          },
          {
            name: 'valor',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'motivo',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'observacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'autorizadoPor',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'autorizadoCargo',
            type: 'varchar',
            length: '50',
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

    // Foreign keys de sangrias
    await queryRunner.createForeignKey(
      'sangrias',
      new TableForeignKey({
        columnNames: ['abertura_caixa_id'],
        referencedTableName: 'aberturas_caixa',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sangrias',
      new TableForeignKey({
        columnNames: ['turno_funcionario_id'],
        referencedTableName: 'turnos_funcionario',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sangrias',
      new TableForeignKey({
        columnNames: ['funcionario_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Tabela de movimentacoes_caixa
    await queryRunner.createTable(
      new Table({
        name: 'movimentacoes_caixa',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'abertura_caixa_id',
            type: 'uuid',
          },
          {
            name: 'tipo',
            type: 'varchar',
          },
          {
            name: 'data',
            type: 'date',
          },
          {
            name: 'hora',
            type: 'time',
          },
          {
            name: 'valor',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'formaPagamento',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'descricao',
            type: 'text',
          },
          {
            name: 'funcionario_id',
            type: 'uuid',
          },
          {
            name: 'comanda_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'comanda_numero',
            type: 'varchar',
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

    // Foreign keys de movimentacoes_caixa
    await queryRunner.createForeignKey(
      'movimentacoes_caixa',
      new TableForeignKey({
        columnNames: ['abertura_caixa_id'],
        referencedTableName: 'aberturas_caixa',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'movimentacoes_caixa',
      new TableForeignKey({
        columnNames: ['funcionario_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Tabela de fechamentos_caixa
    await queryRunner.createTable(
      new Table({
        name: 'fechamentos_caixa',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'abertura_caixa_id',
            type: 'uuid',
          },
          {
            name: 'turno_funcionario_id',
            type: 'uuid',
          },
          {
            name: 'funcionario_id',
            type: 'uuid',
          },
          {
            name: 'dataFechamento',
            type: 'date',
          },
          {
            name: 'horaFechamento',
            type: 'time',
          },
          // Valores esperados
          {
            name: 'valorEsperadoDinheiro',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoPix',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoDebito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoCredito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoValeRefeicao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoValeAlimentacao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorEsperadoTotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          // Valores informados
          {
            name: 'valorInformadoDinheiro',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoPix',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoDebito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoCredito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoValeRefeicao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoValeAlimentacao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'valorInformadoTotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          // Diferenças
          {
            name: 'diferencaDinheiro',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaPix',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaDebito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaCredito',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaValeRefeicao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaValeAlimentacao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'diferencaTotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          // Estatísticas
          {
            name: 'totalSangrias',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'quantidadeSangrias',
            type: 'int',
            default: 0,
          },
          {
            name: 'quantidadeVendas',
            type: 'int',
            default: 0,
          },
          {
            name: 'quantidadeComandasFechadas',
            type: 'int',
            default: 0,
          },
          {
            name: 'ticketMedio',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'observacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'FECHADO'",
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

    // Foreign keys de fechamentos_caixa
    await queryRunner.createForeignKey(
      'fechamentos_caixa',
      new TableForeignKey({
        columnNames: ['abertura_caixa_id'],
        referencedTableName: 'aberturas_caixa',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'fechamentos_caixa',
      new TableForeignKey({
        columnNames: ['turno_funcionario_id'],
        referencedTableName: 'turnos_funcionario',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'fechamentos_caixa',
      new TableForeignKey({
        columnNames: ['funcionario_id'],
        referencedTableName: 'funcionarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fechamentos_caixa');
    await queryRunner.dropTable('movimentacoes_caixa');
    await queryRunner.dropTable('sangrias');
    await queryRunner.dropTable('aberturas_caixa');
  }
}
