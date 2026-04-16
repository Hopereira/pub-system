import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Configuração de banco de dados para testes E2E
 * Usa PostgreSQL — tabelas criadas pelo schema:sync do CI antes dos testes
 */
export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'pub_system_test',
  synchronize: false,
  logging: false,
  ssl: false,
};
