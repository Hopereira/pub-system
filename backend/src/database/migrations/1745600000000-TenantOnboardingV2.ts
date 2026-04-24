import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class TenantOnboardingV21745600000000 implements MigrationInterface {
  name = 'TenantOnboardingV21745600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar campos de onboarding no tenant (todos nullable — retrocompatível)
    await queryRunner.addColumns('tenants', [
      new TableColumn({
        name: 'onboarding_step',
        type: 'varchar',
        length: '30',
        isNullable: true,
        comment: 'Etapa atual do onboarding: EMPRESA, ENDERECO, PLANO, PAGAMENTO, CONFIRMACAO, COMPLETO',
      }),
      new TableColumn({
        name: 'email_status',
        type: 'varchar',
        length: '30',
        isNullable: true,
        default: "'PENDING'",
        comment: 'Status do email de boas-vindas: PENDING, SENT, SKIPPED, FAILED',
      }),
      new TableColumn({
        name: 'email_sent_at',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // 2. Adicionar email na tabela empresas (nullable — retrocompatível)
    await queryRunner.addColumn(
      'empresas',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // 3. Criar tabela password_resets para fluxo de definição/recuperação de senha
    await queryRunner.createTable(
      new Table({
        name: 'password_resets',
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
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '30',
            default: "'RESET'",
            comment: 'Tipo: RESET (recuperação) ou SETUP (primeiro acesso)',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'used_at',
            type: 'timestamp',
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

    // 4. Índice no token para busca rápida
    await queryRunner.query(
      `CREATE INDEX "idx_password_resets_token" ON "password_resets" ("token")`,
    );

    // 5. Índice no funcionario_id
    await queryRunner.query(
      `CREATE INDEX "idx_password_resets_funcionario" ON "password_resets" ("funcionario_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_resets', true);
    await queryRunner.dropColumn('empresas', 'email');
    await queryRunner.dropColumns('tenants', [
      'onboarding_step',
      'email_status',
      'email_sent_at',
    ]);
  }
}
