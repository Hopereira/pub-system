import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// ✅ CORREÇÃO: Validação de variáveis obrigatórias para migrations
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} é obrigatória para executar migrations`);
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // SSL para Neon e outros provedores cloud
  ssl: process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false } 
    : false,
  extra: {
    extension: 'uuid-ossp',
  },
  // ==================== CORREÇÃO AQUI ====================
  // Este padrão simples e robusto encontra todas as entidades,
  // quer estejam em formato .ts (desenvolvimento) ou .js (produção).
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],

  // ==================== CORREÇÃO AQUI ====================
  // Migrations: usar padrão que funciona tanto em dev quanto prod
  // __dirname em dev: /usr/src/app/src/database
  // __dirname em prod: /usr/src/app/dist/database
  migrations: [
    path.join(__dirname, 'migrations', '**', '*.{ts,js}'),
  ],
  // =======================================================
  synchronize: false,
  migrationsRun: false, // Migrations rodadas via script antes do NestJS iniciar
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
