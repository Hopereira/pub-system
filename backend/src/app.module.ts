import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
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
// import { AppCacheModule } from './cache/cache.module';

@Module({
  imports: [
    // ✅ CORREÇÃO: Validação de variáveis de ambiente obrigatórias
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // Ambiente
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        // Banco de dados (obrigatórios)
        DB_HOST: Joi.string().required().messages({
          'any.required': 'DB_HOST é obrigatório',
        }),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required().messages({
          'any.required': 'DB_USER é obrigatório',
        }),
        DB_PASSWORD: Joi.string().required().messages({
          'any.required': 'DB_PASSWORD é obrigatório',
        }),
        DB_DATABASE: Joi.string().required().messages({
          'any.required': 'DB_DATABASE é obrigatório',
        }),

        // Segurança (obrigatório, mínimo 32 caracteres)
        JWT_SECRET: Joi.string().min(32).required().messages({
          'string.min': 'JWT_SECRET deve ter no mínimo 32 caracteres',
          'any.required': 'JWT_SECRET é obrigatório',
        }),

        // CORS (obrigatório em produção)
        FRONTEND_URL: Joi.string().uri().required().messages({
          'string.uri': 'FRONTEND_URL deve ser uma URL válida',
          'any.required': 'FRONTEND_URL é obrigatório',
        }),

        // Admin inicial (opcional - apenas primeiro deploy)
        ADMIN_EMAIL: Joi.string().email().optional(),
        ADMIN_SENHA: Joi.string().min(8).optional(),

        // Google Cloud Storage (opcional - permite vazio)
        GCS_BUCKET_NAME: Joi.string().allow('').optional(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().allow('').optional(),

        // Logs e alertas (opcional)
        LOG_DIR: Joi.string().optional(),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        ALERT_WEBHOOK_URL: Joi.string().uri().optional(),

        // Backup (opcional)
        BACKUP_DIR: Joi.string().optional(),
        BACKUP_MAX_AGE_HOURS: Joi.number().default(24),
      }),
      validationOptions: {
        abortEarly: false, // Mostra todos os erros de uma vez
        allowUnknown: true, // Permite variáveis não listadas
      },
    }),
    ScheduleModule.forRoot(), // Habilita jobs agendados
    // ✅ SEGURANÇA: Rate Limiting Global para prevenir brute force e DDoS
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 3, // 3 requisições por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 20, // 20 requisições por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições por minuto
      },
    ]),
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
        synchronize: process.env.DB_SYNC === 'true', // Habilitar apenas no primeiro deploy para criar tabelas
        // SSL para Neon e outros provedores cloud
        ssl: configService.get<string>('DB_SSL') === 'true' 
          ? { rejectUnauthorized: false } 
          : false,
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
  providers: [
    // ✅ SEGURANÇA: Ativa ThrottlerGuard globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
