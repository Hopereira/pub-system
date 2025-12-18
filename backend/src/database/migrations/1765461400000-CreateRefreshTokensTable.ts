import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRefreshTokensTable1765461400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'funcionarioId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revokedByIp',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'replacedByToken',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['funcionarioId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'funcionarios',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX idx_refresh_tokens_funcionario ON refresh_tokens(funcionarioId);
      CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expiresAt);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_refresh_tokens_funcionario;
      DROP INDEX IF EXISTS idx_refresh_tokens_token;
      DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;
    `);

    const table = await queryRunner.getTable('refresh_tokens');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('funcionarioId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('refresh_tokens', foreignKey);
      }
    }

    await queryRunner.dropTable('refresh_tokens');
  }
}
