import dataSource from './database/data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  try {
    // Verificar se há migrations para executar
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const files = fs.existsSync(migrationsDir) 
      ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      : [];
    
    if (files.length === 0) {
      console.log('ℹ️  Nenhum arquivo de migration encontrado. Pulando migrations...');
      console.log('💡 O TypeORM synchronize criará as tabelas automaticamente se DB_SYNC=true');
      process.exit(0);
    }

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
