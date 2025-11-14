import dataSource from './database/data-source';

async function runMigrations() {
  try {
    console.log('🔄 Inicializando conexão com banco de dados...');
    await dataSource.initialize();
    
    console.log('🔄 Executando migrations...');
    const migrations = await dataSource.runMigrations({ transaction: 'all' });
    
    if (migrations.length === 0) {
      console.log('ℹ️  Nenhuma migration pendente');
    } else {
      console.log(`✅ ${migrations.length} migration(s) executada(s):`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }
    
    await dataSource.destroy();
    console.log('✅ Migrations concluídas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();
