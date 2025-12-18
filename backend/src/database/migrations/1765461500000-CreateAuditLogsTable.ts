import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAuditLogsTable1765461500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'funcionarioId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'funcionarioEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entityName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'oldData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newData',
            type: 'jsonb',
            isNullable: true,
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
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
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
      'audit_logs',
      new TableForeignKey({
        columnNames: ['funcionarioId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'funcionarios',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_funcionario_created ON audit_logs(funcionarioId, createdAt);
      CREATE INDEX idx_audit_logs_entity ON audit_logs(entityName, entityId);
      CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, createdAt);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(createdAt DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_funcionario_created;
      DROP INDEX IF EXISTS idx_audit_logs_entity;
      DROP INDEX IF EXISTS idx_audit_logs_action_created;
      DROP INDEX IF EXISTS idx_audit_logs_created_at;
    `);

    const table = await queryRunner.getTable('audit_logs');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('funcionarioId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('audit_logs', foreignKey);
      }
    }

    await queryRunner.dropTable('audit_logs');
  }
}
