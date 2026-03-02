import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { testDbConfig } from './test-db.config';
import { TenantModule } from '../src/common/tenant';
import { EmpresaModule } from '../src/modulos/empresa/empresa.module';
import { AmbienteModule } from '../src/modulos/ambiente/ambiente.module';
import { FuncionarioModule } from '../src/modulos/funcionario/funcionario.module';
import { AuthModule } from '../src/auth/auth.module';
import { MesaModule } from '../src/modulos/mesa/mesa.module';
import { ComandaModule } from '../src/modulos/comanda/comanda.module';
import { ClienteModule } from '../src/modulos/cliente/cliente.module';
import { PedidoModule } from '../src/modulos/pedido/pedido.module';
import { ProdutoModule } from '../src/modulos/produto/produto.module';
import { PaginaEventoModule } from '../src/modulos/pagina-evento/pagina-evento.module';
import { EventoModule } from '../src/modulos/evento/evento.module';
import { PontoEntregaModule } from '../src/modulos/ponto-entrega/ponto-entrega.module';
import { AvaliacaoModule } from '../src/modulos/avaliacao/avaliacao.module';
import { TurnoModule } from '../src/modulos/turno/turno.module';
import { AnalyticsModule } from '../src/modulos/analytics/analytics.module';
import { MedalhaModule } from '../src/modulos/medalha/medalha.module';
import { CaixaModule } from '../src/modulos/caixa/caixa.module';
import { PaymentModule } from '../src/modulos/payment/payment.module';
import { PlanModule } from '../src/modulos/plan/plan.module';

/**
 * Módulo de teste E2E que sobrescreve configurações do AppModule
 * Usa SQLite em memória ao invés de PostgreSQL
 */
@Module({
  imports: [
    // Config simplificado para testes
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // Ignora .env
      load: [
        () => ({
          NODE_ENV: 'test',
          JWT_SECRET: 'test-secret-key-with-minimum-32-characters-required',
          FRONTEND_URL: 'http://localhost:3001',
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
          DB_HOST: 'localhost',
          DB_PORT: 5432,
          DB_USER: 'test',
          DB_PASSWORD: 'test',
          DB_DATABASE: 'test',
          DB_SSL: 'false',
          ENABLE_SETUP: 'false',
          LOG_LEVEL: 'error',
        }),
      ],
    }),
    // TypeORM com SQLite em memória
    TypeOrmModule.forRoot(testDbConfig),
    // Cache em memória (sem Redis)
    CacheModule.register({
      isGlobal: true,
      ttl: 5000,
    }),
    // Módulos da aplicação
    TenantModule,
    EmpresaModule,
    AmbienteModule,
    FuncionarioModule,
    AuthModule,
    MesaModule,
    ComandaModule,
    ClienteModule,
    PedidoModule,
    ProdutoModule,
    PaginaEventoModule,
    EventoModule,
    PontoEntregaModule,
    AvaliacaoModule,
    TurnoModule,
    AnalyticsModule,
    MedalhaModule,
    CaixaModule,
    PaymentModule,
    PlanModule,
  ],
})
export class TestAppModule {}
