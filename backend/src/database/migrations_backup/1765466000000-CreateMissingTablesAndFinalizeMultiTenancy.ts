import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migration: Criar tabelas faltantes e finalizar multi-tenancy
 * 
 * 1. Criar tabelas: layouts_estabelecimento, medalhas, medalhas_garcons, retiradas_itens
 * 2. Alterar tenant_id para NOT NULL em todas as tabelas
 * 3. Adicionar índices compostos para performance
 */
export class CreateMissingTablesAndFinalizeMultiTenancy1765466000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // PASSO 1: Criar tabela layouts_estabelecimento
    // ============================================
    const hasLayoutsTable = await queryRunner.hasTable('layouts_estabelecimento');
    if (!hasLayoutsTable) {
      console.log('📝 Criando tabela layouts_estabelecimento...');
      await queryRunner.createTable(
        new Table({
          name: 'layouts_estabelecimento',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'ambiente_id',
              type: 'uuid',
            },
            {
              name: 'width',
              type: 'int',
              default: 1200,
            },
            {
              name: 'height',
              type: 'int',
              default: 800,
            },
            {
              name: 'backgroundImage',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'gridSize',
              type: 'int',
              default: 20,
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
            {
              name: 'tenant_id',
              type: 'uuid',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // FK para ambientes
      await queryRunner.createForeignKey(
        'layouts_estabelecimento',
        new TableForeignKey({
          name: 'fk_layouts_estabelecimento_ambiente',
          columnNames: ['ambiente_id'],
          referencedTableName: 'ambientes',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Índice e FK para tenant
      await queryRunner.createIndex(
        'layouts_estabelecimento',
        new TableIndex({
          name: 'idx_layouts_estabelecimento_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'layouts_estabelecimento',
        new TableForeignKey({
          name: 'fk_layouts_estabelecimento_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      console.log('✅ Tabela layouts_estabelecimento criada');
    }

    // ============================================
    // PASSO 2: Criar tabela medalhas
    // ============================================
    const hasMedalhasTable = await queryRunner.hasTable('medalhas');
    if (!hasMedalhasTable) {
      console.log('📝 Criando tabela medalhas...');

      // Criar enum para tipo_medalha
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE tipo_medalha_enum AS ENUM ('VELOCISTA', 'MARATONISTA', 'PONTUAL', 'MVP', 'CONSISTENTE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Criar enum para nivel_medalha
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE nivel_medalha_enum AS ENUM ('BRONZE', 'PRATA', 'OURO', 'DIAMANTE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

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
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'atualizado_em',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'tenant_id',
              type: 'uuid',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Índice e FK para tenant
      await queryRunner.createIndex(
        'medalhas',
        new TableIndex({
          name: 'idx_medalhas_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'medalhas',
        new TableForeignKey({
          name: 'fk_medalhas_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      console.log('✅ Tabela medalhas criada');
    }

    // ============================================
    // PASSO 3: Criar tabela medalhas_garcons
    // ============================================
    const hasMedalhasGarconsTable = await queryRunner.hasTable('medalhas_garcons');
    if (!hasMedalhasGarconsTable) {
      console.log('📝 Criando tabela medalhas_garcons...');
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
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'tenant_id',
              type: 'uuid',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // FKs
      await queryRunner.createForeignKey(
        'medalhas_garcons',
        new TableForeignKey({
          name: 'fk_medalhas_garcons_funcionario',
          columnNames: ['funcionario_id'],
          referencedTableName: 'funcionarios',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'medalhas_garcons',
        new TableForeignKey({
          name: 'fk_medalhas_garcons_medalha',
          columnNames: ['medalha_id'],
          referencedTableName: 'medalhas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Índice e FK para tenant
      await queryRunner.createIndex(
        'medalhas_garcons',
        new TableIndex({
          name: 'idx_medalhas_garcons_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'medalhas_garcons',
        new TableForeignKey({
          name: 'fk_medalhas_garcons_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      console.log('✅ Tabela medalhas_garcons criada');
    }

    // ============================================
    // PASSO 4: Criar tabela retiradas_itens
    // ============================================
    const hasRetiradasTable = await queryRunner.hasTable('retiradas_itens');
    if (!hasRetiradasTable) {
      console.log('📝 Criando tabela retiradas_itens...');
      await queryRunner.createTable(
        new Table({
          name: 'retiradas_itens',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'item_pedido_id',
              type: 'uuid',
            },
            {
              name: 'garcom_id',
              type: 'uuid',
            },
            {
              name: 'ambiente_id',
              type: 'uuid',
            },
            {
              name: 'retirado_em',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'tempo_reacao_minutos',
              type: 'integer',
              isNullable: true,
            },
            {
              name: 'observacao',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'tenant_id',
              type: 'uuid',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // FKs
      await queryRunner.createForeignKey(
        'retiradas_itens',
        new TableForeignKey({
          name: 'fk_retiradas_itens_item_pedido',
          columnNames: ['item_pedido_id'],
          referencedTableName: 'itens_pedido',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'retiradas_itens',
        new TableForeignKey({
          name: 'fk_retiradas_itens_garcom',
          columnNames: ['garcom_id'],
          referencedTableName: 'funcionarios',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'retiradas_itens',
        new TableForeignKey({
          name: 'fk_retiradas_itens_ambiente',
          columnNames: ['ambiente_id'],
          referencedTableName: 'ambientes',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Índice e FK para tenant
      await queryRunner.createIndex(
        'retiradas_itens',
        new TableIndex({
          name: 'idx_retiradas_itens_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'retiradas_itens',
        new TableForeignKey({
          name: 'fk_retiradas_itens_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      console.log('✅ Tabela retiradas_itens criada');
    }

    // ============================================
    // PASSO 5: Alterar tenant_id para NOT NULL
    // ============================================
    console.log('📝 Alterando tenant_id para NOT NULL...');

    const tablesWithTenantId = [
      'aberturas_caixa',
      'ambientes',
      'audit_logs',
      'avaliacoes',
      'clientes',
      'comanda_agregados',
      'comandas',
      'empresas',
      'eventos',
      'fechamentos_caixa',
      'funcionarios',
      'itens_pedido',
      'layouts_estabelecimento',
      'medalhas',
      'medalhas_garcons',
      'mesas',
      'movimentacoes_caixa',
      'paginas_evento',
      'pedidos',
      'pontos_entrega',
      'produtos',
      'retiradas_itens',
      'sangrias',
      'turnos_funcionario',
    ];

    for (const tableName of tablesWithTenantId) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.log(`⚠️ Tabela ${tableName} não existe, pulando...`);
        continue;
      }

      const table = await queryRunner.getTable(tableName);
      const column = table?.findColumnByName('tenant_id');

      if (!column) {
        console.log(`⚠️ Coluna tenant_id não existe em ${tableName}, pulando...`);
        continue;
      }

      if (!column.isNullable) {
        console.log(`⚠️ Coluna tenant_id já é NOT NULL em ${tableName}, pulando...`);
        continue;
      }

      // Verificar se há registros sem tenant_id
      const nullCount = await queryRunner.query(`
        SELECT COUNT(*) as count FROM ${tableName} WHERE tenant_id IS NULL
      `);

      if (parseInt(nullCount[0].count) > 0) {
        // Preencher com o primeiro tenant
        await queryRunner.query(`
          UPDATE ${tableName}
          SET tenant_id = (SELECT id FROM tenants LIMIT 1)
          WHERE tenant_id IS NULL
        `);
        console.log(`📝 Preenchidos ${nullCount[0].count} registros em ${tableName}`);
      }

      // Alterar para NOT NULL
      await queryRunner.changeColumn(
        tableName,
        'tenant_id',
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        }),
      );
      console.log(`✅ tenant_id agora é NOT NULL em ${tableName}`);
    }

    // ============================================
    // PASSO 6: Criar índices compostos para performance
    // ============================================
    console.log('📝 Criando índices compostos para performance...');

    const compositeIndexes = [
      { table: 'pedidos', columns: ['tenant_id', 'status'], name: 'idx_pedidos_tenant_status' },
      { table: 'pedidos', columns: ['tenant_id', 'data'], name: 'idx_pedidos_tenant_data' },
      { table: 'comandas', columns: ['tenant_id', 'status'], name: 'idx_comandas_tenant_status' },
      { table: 'comandas', columns: ['tenant_id', 'criadoEm'], name: 'idx_comandas_tenant_criado' },
      { table: 'produtos', columns: ['tenant_id', 'ativo'], name: 'idx_produtos_tenant_ativo' },
      { table: 'mesas', columns: ['tenant_id', 'status'], name: 'idx_mesas_tenant_status' },
      { table: 'funcionarios', columns: ['tenant_id', 'status'], name: 'idx_funcionarios_tenant_status' },
      { table: 'itens_pedido', columns: ['tenant_id', 'status'], name: 'idx_itens_pedido_tenant_status' },
      { table: 'clientes', columns: ['tenant_id', 'cpf'], name: 'idx_clientes_tenant_cpf' },
      { table: 'ambientes', columns: ['tenant_id', 'ativo'], name: 'idx_ambientes_tenant_ativo' },
    ];

    for (const idx of compositeIndexes) {
      const tableExists = await queryRunner.hasTable(idx.table);
      if (!tableExists) continue;

      // Verificar se todas as colunas existem
      const table = await queryRunner.getTable(idx.table);
      const allColumnsExist = idx.columns.every(col => table?.findColumnByName(col));

      if (!allColumnsExist) {
        console.log(`⚠️ Colunas ${idx.columns.join(', ')} não existem em ${idx.table}, pulando...`);
        continue;
      }

      try {
        await queryRunner.createIndex(
          idx.table,
          new TableIndex({
            name: idx.name,
            columnNames: idx.columns,
          }),
        );
        console.log(`✅ Índice ${idx.name} criado`);
      } catch (error) {
        console.log(`⚠️ Índice ${idx.name} já existe ou erro: ${error.message}`);
      }
    }

    console.log('✅ Migration CreateMissingTablesAndFinalizeMultiTenancy concluída!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices compostos
    const compositeIndexes = [
      'idx_pedidos_tenant_status',
      'idx_pedidos_tenant_data',
      'idx_comandas_tenant_status',
      'idx_comandas_tenant_criado',
      'idx_produtos_tenant_ativo',
      'idx_mesas_tenant_status',
      'idx_funcionarios_tenant_status',
      'idx_itens_pedido_tenant_status',
      'idx_clientes_tenant_cpf',
      'idx_ambientes_tenant_ativo',
    ];

    for (const indexName of compositeIndexes) {
      try {
        const tableName = indexName.replace('idx_', '').split('_tenant')[0];
        await queryRunner.dropIndex(tableName, indexName);
      } catch (e) {
        // Ignorar se não existir
      }
    }

    // Reverter tenant_id para nullable (não recomendado em produção)
    // Omitido por segurança

    // Remover tabelas criadas
    await queryRunner.dropTable('retiradas_itens', true);
    await queryRunner.dropTable('medalhas_garcons', true);
    await queryRunner.dropTable('medalhas', true);
    await queryRunner.dropTable('layouts_estabelecimento', true);

    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS tipo_medalha_enum');
    await queryRunner.query('DROP TYPE IF EXISTS nivel_medalha_enum');
  }
}
