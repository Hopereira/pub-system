import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMedalhasTables1731000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipo de medalha
    await queryRunner.query(`
      CREATE TYPE tipo_medalha_enum AS ENUM (
        'VELOCISTA',
        'MARATONISTA',
        'PONTUAL',
        'MVP',
        'CONSISTENTE',
        'ROOKIE'
      );
    `);

    // Criar enum para nível de medalha
    await queryRunner.query(`
      CREATE TYPE nivel_medalha_enum AS ENUM (
        'bronze',
        'prata',
        'ouro'
      );
    `);

    // Criar tabela medalhas
    await queryRunner.createTable(
      new Table({
        name: 'medalhas',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tipo',
            type: 'tipo_medalha_enum',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'descricao',
            type: 'text',
          },
          {
            name: 'icone',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'nivel',
            type: 'nivel_medalha_enum',
          },
          {
            name: 'requisitos',
            type: 'jsonb',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'criado_em',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'atualizado_em',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Criar tabela medalhas_garcons
    await queryRunner.createTable(
      new Table({
        name: 'medalhas_garcons',
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
            name: 'medalha_id',
            type: 'uuid',
          },
          {
            name: 'conquistada_em',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['funcionario_id'],
            referencedTableName: 'funcionarios',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['medalha_id'],
            referencedTableName: 'medalhas',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['funcionario_id'],
          },
          {
            columnNames: ['medalha_id'],
          },
          {
            columnNames: ['funcionario_id', 'medalha_id'],
            isUnique: true, // Um garçom não pode ter a mesma medalha duplicada
          },
        ],
      }),
      true,
    );

    // Inserir medalhas padrão
    await queryRunner.query(`
      INSERT INTO medalhas (tipo, nome, descricao, icone, nivel, requisitos) VALUES
      -- VELOCISTA
      ('VELOCISTA', 'Velocista Bronze', 'Alcance 10 entregas em menos de 2 minutos', '⚡', 'bronze', '{"entregasRapidas": 10}'),
      ('VELOCISTA', 'Velocista Prata', 'Alcance 25 entregas em menos de 2 minutos', '⚡', 'prata', '{"entregasRapidas": 25}'),
      ('VELOCISTA', 'Velocista Ouro', 'Alcance 50 entregas em menos de 2 minutos', '⚡', 'ouro', '{"entregasRapidas": 50}'),
      
      -- MARATONISTA
      ('MARATONISTA', 'Maratonista Bronze', 'Realize 30 entregas em um único dia', '🏃', 'bronze', '{"entregasPorDia": 30}'),
      ('MARATONISTA', 'Maratonista Prata', 'Realize 60 entregas em um único dia', '🏃', 'prata', '{"entregasPorDia": 60}'),
      ('MARATONISTA', 'Maratonista Ouro', 'Realize 100 entregas em um único dia', '🏃', 'ouro', '{"entregasPorDia": 100}'),
      
      -- PONTUAL
      ('PONTUAL', 'Pontual Bronze', 'Mantenha 90% de SLA por 3 dias consecutivos', '🎯', 'bronze', '{"percentualSLA": 90, "diasConsecutivos": 3}'),
      ('PONTUAL', 'Pontual Prata', 'Mantenha 95% de SLA por 7 dias consecutivos', '🎯', 'prata', '{"percentualSLA": 95, "diasConsecutivos": 7}'),
      ('PONTUAL', 'Pontual Ouro', 'Mantenha 98% de SLA por 30 dias consecutivos', '🎯', 'ouro', '{"percentualSLA": 98, "diasConsecutivos": 30}'),
      
      -- MVP
      ('MVP', 'MVP do Dia', 'Fique em 1º lugar no ranking diário', '👑', 'bronze', '{"posicaoRanking": 1, "periodoRanking": "dia"}'),
      ('MVP', 'MVP da Semana', 'Fique em 1º lugar no ranking semanal', '👑', 'prata', '{"posicaoRanking": 1, "periodoRanking": "semana"}'),
      ('MVP', 'MVP do Mês', 'Fique em 1º lugar no ranking mensal', '👑', 'ouro', '{"posicaoRanking": 1, "periodoRanking": "mes"}'),
      
      -- CONSISTENTE
      ('CONSISTENTE', 'Consistente Bronze', 'Fique no top 5 por 7 dias', '📈', 'bronze', '{"posicaoMaxima": 5, "diasNoPeriodo": 7}'),
      ('CONSISTENTE', 'Consistente Prata', 'Fique no top 3 por 15 dias', '📈', 'prata', '{"posicaoMaxima": 3, "diasNoPeriodo": 15}'),
      ('CONSISTENTE', 'Consistente Ouro', 'Fique no top 3 por 30 dias', '📈', 'ouro', '{"posicaoMaxima": 3, "diasNoPeriodo": 30}'),
      
      -- ROOKIE
      ('ROOKIE', 'Primeira Entrega', 'Complete sua primeira entrega', '🌟', 'bronze', '{}');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('medalhas_garcons');
    await queryRunner.dropTable('medalhas');
    await queryRunner.query(`DROP TYPE IF EXISTS nivel_medalha_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tipo_medalha_enum;`);
  }
}
