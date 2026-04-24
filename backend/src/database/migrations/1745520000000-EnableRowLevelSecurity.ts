import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Enable Row Level Security (RLS) no PostgreSQL
 *
 * ESTRATÉGIA:
 * - Habilita RLS em todas as tabelas com tenant_id
 * - Cria políticas PERMISSIVE que filtram por current_setting('app.current_tenant_id')
 * - Se app.current_tenant_id NÃO está definido, permite acesso total (compatibilidade)
 * - SUPER_ADMIN (tenant_id IS NULL) sempre tem acesso via policy separada
 * - Não-destrutiva: pode ser revertida com DROP POLICY + ALTER TABLE DISABLE RLS
 *
 * ATIVAÇÃO GRADUAL:
 * - O TypeORM subscriber (TenantRlsSubscriber) deve setar SET LOCAL app.current_tenant_id
 *   em cada transação para ativar o filtro.
 * - Sem o subscriber, RLS não filtra nada (seguro para rollback).
 */
export class EnableRowLevelSecurity1745520000000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1745520000000';

  // Todas as tabelas que possuem coluna tenant_id
  private readonly tenantTables = [
    'funcionarios',
    'empresas',
    'ambientes',
    'mesas',
    'produtos',
    'clientes',
    'comandas',
    'comanda_agregados',
    'pedidos',
    'itens_pedido',
    'retirada_itens',
    'eventos',
    'paginas_evento',
    'pontos_entrega',
    'avaliacoes',
    'medalhas',
    'medalhas_garcom',
    'turnos_funcionario',
    'aberturas_caixa',
    'fechamentos_caixa',
    'sangrias',
    'movimentacoes_caixa',
    'audit_logs',
    'refresh_tokens',
    'layouts_estabelecimento',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Garantir que a variável de sessão tenha um default seguro
    await queryRunner.query(`
      -- Definir valor padrão para a variável de sessão (vazio = sem filtro)
      DO $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', '', false);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignorar se já existir
      END $$;
    `);

    for (const table of this.tenantTables) {
      // Verificar se a tabela existe antes de aplicar RLS
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [table]);

      if (!tableExists[0]?.exists) {
        console.log(`⏭️  Tabela ${table} não existe, pulando RLS`);
        continue;
      }

      // Verificar se a coluna tenant_id existe
      const columnExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'tenant_id'
        ) as exists
      `, [table]);

      if (!columnExists[0]?.exists) {
        console.log(`⏭️  Tabela ${table} não tem tenant_id, pulando RLS`);
        continue;
      }

      console.log(`🔒 Habilitando RLS em ${table}...`);

      // 2. Habilitar RLS na tabela
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);

      // 3. FORCE RLS para o owner (sem isso, o owner bypassa RLS)
      // NOTA: Comentado por segurança — ativar gradualmente
      // await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);

      // 4. Policy: Permitir acesso quando tenant_id = current_tenant_id
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_policy ON "${table}"
          AS PERMISSIVE
          FOR ALL
          USING (
            -- Se app.current_tenant_id não está definido ou está vazio, permitir tudo
            -- (compatibilidade com operações sem contexto de tenant)
            current_setting('app.current_tenant_id', true) IS NULL
            OR current_setting('app.current_tenant_id', true) = ''
            -- Se está definido, filtrar pelo tenant_id
            OR tenant_id::text = current_setting('app.current_tenant_id', true)
            -- Permitir registros sem tenant (SUPER_ADMIN, dados globais)
            OR tenant_id IS NULL
          )
          WITH CHECK (
            current_setting('app.current_tenant_id', true) IS NULL
            OR current_setting('app.current_tenant_id', true) = ''
            OR tenant_id::text = current_setting('app.current_tenant_id', true)
            OR tenant_id IS NULL
          )
      `);

      console.log(`✅ RLS habilitado em ${table}`);
    }

    console.log('🔒 Row Level Security habilitado em todas as tabelas tenant-aware');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tenantTables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [table]);

      if (!tableExists[0]?.exists) continue;

      // Remover policy
      await queryRunner.query(`
        DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}"
      `);

      // Desabilitar RLS
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);

      console.log(`🔓 RLS desabilitado em ${table}`);
    }

    console.log('🔓 Row Level Security removido de todas as tabelas');
  }
}
