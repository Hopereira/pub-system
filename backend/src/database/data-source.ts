// Importa o 'dotenv' e o 'path'
import * as dotenv from 'dotenv';
import * as path from 'path';

// Configura o dotenv para procurar o arquivo .env dois níveis de diretório acima
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { DataSource, DataSourceOptions } from 'typeorm';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  // Usa as variáveis separadas, que agora serão carregadas corretamente
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // Garante que a senha seja uma string
  database: process.env.DB_DATABASE,
  extra: {
    extension: 'uuid-ossp',
  },
  entities: [
    path.join(
      process.cwd(),
      'src',
      '**',
      '*.entity.{ts,js}'.replace(isDevelopment ? ',js' : 'ts,', ''),
    ),
  ],
  migrations: [
    path.join(
      process.cwd(),
      'src',
      'database',
      'migrations',
      '*{.ts,.js}'.replace(isDevelopment ? ',js' : 'ts,', ''),
    ),
  ],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;