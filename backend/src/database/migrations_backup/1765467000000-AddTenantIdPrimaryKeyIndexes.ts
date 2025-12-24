import {
  MigrationInterface,
  QueryRunner,
  TableIndex,
} from 'typeorm';

/**
 * Migration: Adicionar índices compostos (tenant_id, id) para otimizar buscas por PK
 * 
 * Esses índices são essenciais para queries que filtram por tenant e buscam por ID,
 * evitando Full Table Scans em ambientes multi-tenant.
 */
export class AddTenantIdPrimaryKeyIndexes1765467000000
  implements MigrationInterface
{
  private readonly tables = [
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

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 Criando índices compostos (tenant_id, id) para otimização de PK...');

    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.log(`⚠️ Tabela ${tableName} não existe, pulando...`);
        continue;
      }

      const indexName = `idx_${tableName}_tenant_pk`;

      try {
        await queryRunner.createIndex(
          tableName,
          new TableIndex({
            name: indexName,
            columnNames: ['tenant_id', 'id'],
          }),
        );
        console.log(`✅ Índice ${indexName} criado`);
      } catch (error) {
        console.log(`⚠️ Índice ${indexName} já existe ou erro: ${error.message}`);
      }
    }

    console.log('✅ Migration AddTenantIdPrimaryKeyIndexes concluída!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      try {
        await queryRunner.dropIndex(tableName, `idx_${tableName}_tenant_pk`);
      } catch (e) {
        // Ignorar se não existir
      }
    }
  }
}
