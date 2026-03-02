import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migration: Adicionar tenant_id às tabelas restantes
 * 
 * Tabelas que precisam de tenant_id:
 * - aberturas_caixa
 * - audit_logs
 * - empresas
 * - fechamentos_caixa
 * - itens_pedido
 * - movimentacoes_caixa
 * - layouts_estabelecimento (se existir)
 * - medalhas (se existir)
 * - medalhas_garcons (se existir)
 * - retiradas_itens (se existir)
 */
export class AddTenantIdToRemainingTables1765465000000
  implements MigrationInterface
{
  private readonly tables = [
    'aberturas_caixa',
    'audit_logs',
    'empresas',
    'fechamentos_caixa',
    'itens_pedido',
    'movimentacoes_caixa',
    'layouts_estabelecimento',
    'medalhas',
    'medalhas_garcons',
    'retiradas_itens',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.log(`⚠️ Tabela ${tableName} não existe, pulando...`);
        continue;
      }

      const table = await queryRunner.getTable(tableName);
      const hasColumn = table?.findColumnByName('tenant_id');

      if (hasColumn) {
        console.log(`⚠️ Tabela ${tableName} já tem tenant_id, pulando...`);
        continue;
      }

      console.log(`📝 Adicionando tenant_id em ${tableName}...`);

      // Adicionar coluna tenant_id (nullable inicialmente)
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Preencher tenant_id com o primeiro tenant disponível
      await queryRunner.query(`
        UPDATE ${tableName}
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL
      `);

      // Criar índice para performance
      try {
        await queryRunner.createIndex(
          tableName,
          new TableIndex({
            name: `idx_${tableName}_tenant_id`,
            columnNames: ['tenant_id'],
          }),
        );
        console.log(`✅ Índice idx_${tableName}_tenant_id criado`);
      } catch (error) {
        console.log(`⚠️ Índice já existe: ${error.message}`);
      }

      // Criar FK para tenants
      try {
        await queryRunner.createForeignKey(
          tableName,
          new TableForeignKey({
            name: `fk_${tableName}_tenant`,
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
        console.log(`✅ FK fk_${tableName}_tenant criada`);
      } catch (error) {
        console.log(`⚠️ FK já existe: ${error.message}`);
      }
    }

    console.log('✅ Migration AddTenantIdToRemainingTables concluída!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      try {
        await queryRunner.dropForeignKey(tableName, `fk_${tableName}_tenant`);
      } catch (e) {
        console.log(`FK fk_${tableName}_tenant não existe`);
      }

      try {
        await queryRunner.dropIndex(tableName, `idx_${tableName}_tenant_id`);
      } catch (e) {
        console.log(`Index idx_${tableName}_tenant_id não existe`);
      }

      try {
        await queryRunner.dropColumn(tableName, 'tenant_id');
      } catch (e) {
        console.log(`Coluna tenant_id não existe em ${tableName}`);
      }
    }
  }
}
