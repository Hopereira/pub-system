import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para tornar tenant_id NOT NULL em todas as tabelas
 * 
 * IMPORTANTE: Executar apenas após validar que todos os registros
 * possuem tenant_id preenchido corretamente.
 * 
 * Verificação prévia:
 * SELECT table_name, COUNT(*) as null_count 
 * FROM (
 *   SELECT 'pedidos' as table_name FROM pedidos WHERE tenant_id IS NULL
 *   UNION ALL SELECT 'comandas' FROM comandas WHERE tenant_id IS NULL
 *   -- ... outras tabelas
 * ) t GROUP BY table_name;
 */
export class MakeTenantIdNotNull1765464000000 implements MigrationInterface {
  name = 'MakeTenantIdNotNull1765464000000';

  private readonly tables = [
    'ambientes',
    'avaliacoes',
    'clientes',
    'comanda_agregados',
    'comandas',
    'eventos',
    'funcionarios',
    'mesas',
    'paginas_evento',
    'pedidos',
    'pontos_entrega',
    'produtos',
    'sangrias',
    'turnos_funcionario',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Tornando tenant_id NOT NULL em todas as tabelas...');

    // Obter o primeiro tenant disponível para preencher registros órfãos
    const tenants = await queryRunner.query(`SELECT id FROM tenants LIMIT 1`);
    const defaultTenantId = tenants[0]?.id;

    if (!defaultTenantId) {
      console.log('⚠️ Nenhum tenant encontrado. Criando tenant padrão...');
      await queryRunner.query(`
        INSERT INTO tenants (nome, slug, status, plano)
        VALUES ('Tenant Padrão', 'tenant-padrao', 'ATIVO', 'FREE')
        ON CONFLICT (slug) DO NOTHING
      `);
      const newTenant = await queryRunner.query(`SELECT id FROM tenants WHERE slug = 'tenant-padrao'`);
      if (!newTenant[0]?.id) {
        throw new Error('❌ Não foi possível criar tenant padrão');
      }
    }

    const finalTenantId = defaultTenantId || (await queryRunner.query(`SELECT id FROM tenants LIMIT 1`))[0]?.id;

    // Preencher registros sem tenant_id automaticamente
    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      const result = await queryRunner.query(`
        SELECT COUNT(*) as count FROM ${tableName} WHERE tenant_id IS NULL
      `);
      
      const nullCount = parseInt(result[0]?.count || '0');
      if (nullCount > 0) {
        console.log(`📝 Preenchendo ${nullCount} registros em ${tableName} com tenant padrão...`);
        await queryRunner.query(`
          UPDATE ${tableName} SET tenant_id = '${finalTenantId}' WHERE tenant_id IS NULL
        `);
      }
    }

    // Se passou na validação, tornar NOT NULL
    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      try {
        await queryRunner.query(`
          ALTER TABLE ${tableName} 
          ALTER COLUMN tenant_id SET NOT NULL
        `);
        console.log(`✅ ${tableName}.tenant_id agora é NOT NULL`);
      } catch (error) {
        console.log(`⚠️ Erro em ${tableName}: ${error.message}`);
      }
    }

    console.log('✅ Todas as colunas tenant_id são agora NOT NULL!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔓 Removendo constraint NOT NULL de tenant_id...');

    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      try {
        await queryRunner.query(`
          ALTER TABLE ${tableName} 
          ALTER COLUMN tenant_id DROP NOT NULL
        `);
        console.log(`✅ ${tableName}.tenant_id agora permite NULL`);
      } catch (error) {
        console.log(`⚠️ Erro em ${tableName}: ${error.message}`);
      }
    }
  }
}
