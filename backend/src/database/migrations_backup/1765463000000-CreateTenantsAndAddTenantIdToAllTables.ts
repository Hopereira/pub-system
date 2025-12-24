import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migration Master: Multi-tenancy
 * 
 * Esta migration:
 * 1. Cria a tabela `tenants` com campos de controle
 * 2. Migra dados da tabela `empresas` para `tenants`
 * 3. Adiciona `tenant_id` em todas as tabelas operacionais
 * 4. Cria índices compostos para performance
 * 5. Configura FKs para integridade referencial
 * 
 * IMPORTANTE: Fazer backup antes de executar em produção!
 */
export class CreateTenantsAndAddTenantIdToAllTables1765463000000
  implements MigrationInterface
{
  // Tabelas que receberão tenant_id
  private readonly tables = [
    'ambientes',
    'audit_logs',
    'avaliacoes',
    'aberturas_caixa',
    'fechamentos_caixa',
    'movimentacoes_caixa',
    'sangrias',
    'clientes',
    'comanda_agregados',
    'comandas',
    'empresas',
    'layouts_estabelecimento',
    'eventos',
    'funcionarios',
    'medalhas_garcons',
    'medalhas',
    'mesas',
    'paginas_evento',
    'itens_pedido',
    'pedidos',
    'retiradas_itens',
    'pontos_entrega',
    'produtos',
    'turnos_funcionario',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // PASSO 1: Criar tabela tenants
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'cnpj',
            type: 'varchar',
            length: '18',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ATIVO', 'INATIVO', 'SUSPENSO', 'TRIAL'],
            default: "'ATIVO'",
          },
          {
            name: 'plano',
            type: 'enum',
            enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
            default: "'FREE'",
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configurações específicas do tenant',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índice para busca por slug
    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'idx_tenants_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    // Índice para busca por status
    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'idx_tenants_status',
        columnNames: ['status'],
      }),
    );

    // ============================================
    // PASSO 2: Migrar dados de empresas para tenants
    // ============================================
    await queryRunner.query(`
      INSERT INTO tenants (id, nome, slug, cnpj, status, plano)
      SELECT 
        id,
        "nomeFantasia" as nome,
        COALESCE(slug, LOWER(REGEXP_REPLACE(REGEXP_REPLACE(
          TRANSLATE("nomeFantasia", 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
          '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))) as slug,
        cnpj,
        (CASE WHEN ativo = true THEN 'ATIVO' ELSE 'INATIVO' END)::tenants_status_enum as status,
        'FREE'::tenants_plano_enum as plano
      FROM empresas
      ON CONFLICT (slug) DO NOTHING
    `);

    // ============================================
    // PASSO 3: Adicionar tenant_id em todas as tabelas
    // ============================================
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
          isNullable: true, // Temporariamente nullable
        }),
      );

      // Tentar preencher tenant_id com base em empresa_id existente
      const hasEmpresaId = table?.findColumnByName('empresa_id') || 
                          table?.findColumnByName('empresaId');
      
      if (hasEmpresaId) {
        const columnName = table?.findColumnByName('empresa_id') ? 'empresa_id' : '"empresaId"';
        await queryRunner.query(`
          UPDATE ${tableName} 
          SET tenant_id = ${columnName}
          WHERE tenant_id IS NULL AND ${columnName} IS NOT NULL
        `);
      }

      // Se ainda houver registros sem tenant_id, usar o primeiro tenant
      await queryRunner.query(`
        UPDATE ${tableName}
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL
      `);

      // Criar índice composto para performance
      await queryRunner.createIndex(
        tableName,
        new TableIndex({
          name: `idx_${tableName}_tenant_id`,
          columnNames: ['tenant_id'],
        }),
      );

      // Criar FK para tenants
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
    }

    // ============================================
    // PASSO 4: Criar índices compostos para queries frequentes
    // ============================================
    const compositeIndexes = [
      { table: 'pedidos', columns: ['tenant_id', 'status'] },
      { table: 'pedidos', columns: ['tenant_id', 'data'] }, // pedidos usa 'data' não 'created_at'
      { table: 'comandas', columns: ['tenant_id', 'status'] },
      { table: 'produtos', columns: ['tenant_id', 'ativo'] },
      { table: 'mesas', columns: ['tenant_id', 'status'] },
      { table: 'funcionarios', columns: ['tenant_id', 'status'] },
    ];

    for (const idx of compositeIndexes) {
      const tableExists = await queryRunner.hasTable(idx.table);
      if (!tableExists) continue;

      try {
        const indexName = `idx_${idx.table}_${idx.columns.join('_')}`;
        await queryRunner.createIndex(
          idx.table,
          new TableIndex({
            name: indexName,
            columnNames: idx.columns,
          }),
        );
        console.log(`✅ Índice ${indexName} criado`);
      } catch (error) {
        console.log(`⚠️ Índice já existe ou erro: ${error.message}`);
      }
    }

    console.log('✅ Migration Master concluída com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover FKs e índices de todas as tabelas
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

    // Remover índices compostos
    const compositeIndexes = [
      { table: 'pedidos', columns: ['tenant_id', 'status'] },
      { table: 'pedidos', columns: ['tenant_id', 'data'] },
      { table: 'comandas', columns: ['tenant_id', 'status'] },
      { table: 'produtos', columns: ['tenant_id', 'ativo'] },
      { table: 'mesas', columns: ['tenant_id', 'status'] },
      { table: 'funcionarios', columns: ['tenant_id', 'status'] },
    ];

    for (const idx of compositeIndexes) {
      try {
        const indexName = `idx_${idx.table}_${idx.columns.join('_')}`;
        await queryRunner.dropIndex(idx.table, indexName);
      } catch (e) {
        // Ignorar se não existir
      }
    }

    // Remover tabela tenants
    await queryRunner.dropTable('tenants', true);
  }
}
