import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_DATABASE,
  extra: {
    extension: 'uuid-ossp',
  },
  // ==================== CORREÇÃO AQUI ====================
  // Este padrão simples e robusto encontra todas as entidades,
  // quer estejam em formato .ts (desenvolvimento) ou .js (produção).
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],

  // ==================== CORREÇÃO AQUI ====================
  // O mesmo padrão robusto para as migrações.
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  // =======================================================
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
