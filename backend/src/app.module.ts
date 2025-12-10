import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EmpresaModule } from './modulos/empresa/empresa.module';
import { AmbienteModule } from './modulos/ambiente/ambiente.module';
import { FuncionarioModule } from './modulos/funcionario/funcionario.module';
import { AuthModule } from './auth/auth.module';
import { MesaModule } from './modulos/mesa/mesa.module';
import { ComandaModule } from './modulos/comanda/comanda.module';
import { ClienteModule } from './modulos/cliente/cliente.module';
import { PedidoModule } from './modulos/pedido/pedido.module';
import { ProdutoModule } from './modulos/produto/produto.module';
import { SeederModule } from './database/seeder.module';
import { PaginaEventoModule } from './modulos/pagina-evento/pagina-evento.module';
import { EventoModule } from './modulos/evento/evento.module';
import { StorageModule } from './shared/storage/storage.module';
import { PontoEntregaModule } from './modulos/ponto-entrega/ponto-entrega.module';
import { HealthModule } from './health/health.module';
import { AvaliacaoModule } from './modulos/avaliacao/avaliacao.module';
import { TurnoModule } from './modulos/turno/turno.module';
import { AnalyticsModule } from './modulos/analytics/analytics.module';
import { MedalhaModule } from './modulos/medalha/medalha.module';
import { CaixaModule } from './modulos/caixa/caixa.module';
import { LoggerModule } from './common/logger/logger.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(), // Habilita jobs agendados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true, // Garante que todas as entidades sejam carregadas
        synchronize: false, // Importante para usar migrations
      }),
    }),
    // Módulos de funcionalidades da aplicação
    EmpresaModule,
    AmbienteModule,
    FuncionarioModule,
    AuthModule,
    MesaModule,
    ComandaModule,
    ClienteModule,
    PedidoModule,
    ProdutoModule,
    PontoEntregaModule,
    SeederModule,
    PaginaEventoModule,
    EventoModule,
    StorageModule,
    HealthModule,
    AvaliacaoModule,
    TurnoModule,
    AnalyticsModule,
    MedalhaModule,
    CaixaModule,
    LoggerModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
