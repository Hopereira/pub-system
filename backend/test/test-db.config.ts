import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

/**
 * Configuração de banco de dados para testes E2E
 * Usa PostgreSQL com configuração simplificada
 */
export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'pub_system_test',
  entities: [path.join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
  synchronize: true, // Auto-cria tabelas para testes
  logging: false,
  ssl: false,
};
