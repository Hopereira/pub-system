import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { DatabaseConnectionMonitor } from './database/database-connection.subscriber';
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
import { AppCacheModule } from './cache/cache.module';
import { AuditModule } from './modulos/audit/audit.module';
import { TenantModule } from './common/tenant';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { RateLimitMonitorService } from './common/monitoring/rate-limit-monitor.service';
import { PaymentModule } from './modulos/payment/payment.module';
import { PlanModule } from './modulos/plan/plan.module';

@Module({
  imports: [
    AppCacheModule,
    // ✅ CORREÇÃO: Validação de variáveis de ambiente obrigatórias
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // Ambiente (obrigatório — impede boot sem definição explícita)
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .required()
          .messages({
            'any.required': 'NODE_ENV é obrigatório (development|production|test)',
          }),

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
        DB_SSL: Joi.string().valid('true', 'false').default('false'),
        DATABASE_URL: Joi.string().optional(),

        // Redis (obrigatório — usado por cache e rate limiting)
        REDIS_HOST: Joi.string().default('localhost').messages({
          'string.base': 'REDIS_HOST deve ser uma string',
        }),
        REDIS_PORT: Joi.number().default(6379).messages({
          'number.base': 'REDIS_PORT deve ser um número',
        }),

        // Segurança (obrigatório, mínimo 32 caracteres)
        JWT_SECRET: Joi.string().min(32).required().messages({
          'string.min': 'JWT_SECRET deve ter no mínimo 32 caracteres',
          'any.required': 'JWT_SECRET é obrigatório',
        }),

        // CORS (obrigatório)
        FRONTEND_URL: Joi.string().uri().required().messages({
          'string.uri': 'FRONTEND_URL deve ser uma URL válida',
          'any.required': 'FRONTEND_URL é obrigatório',
        }),

        // Setup endpoint (desabilitado por padrão)
        ENABLE_SETUP: Joi.string().valid('true', 'false').default('false'),
        SETUP_TOKEN: Joi.string().optional(),

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
    // Limites aumentados para desenvolvimento
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 30, // 30 requisições por segundo (dev)
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 200, // 200 requisições por 10 segundos (dev)
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 1000, // 1000 requisições por minuto (dev)
      },
      {
        name: 'login',
        ttl: 900000, // 15 minutos
        limit: 5, // 5 tentativas por 15 minutos
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
        autoLoadEntities: true,
        synchronize: false, // NUNCA ativar em produção — usar migrations
        ssl: configService.get<string>('DB_SSL') === 'true' 
          ? { rejectUnauthorized: false } 
          : false,
        extra: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 5000,
          application_name: 'pub-system-backend',
          allowExitOnIdle: false,
        },
        retryAttempts: 5,
        retryDelay: 3000,
        logging: process.env.DB_LOGGING === 'true' ? ['error', 'warn', 'query'] : ['error', 'warn'],
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
    AuditModule,
    LoggerModule,
    JobsModule,
    TenantModule, // 🏢 Multi-tenancy: Contexto, Interceptor, Guard, Resolver
    PaymentModule, // 💳 Pagamentos: Mercado Pago, PagSeguro, PicPay
    PlanModule, // 📋 Gestão de Planos dinâmicos
  ],
  controllers: [],
  providers: [
    // ✅ SEGURANÇA: Ativa CustomThrottlerGuard globalmente (rate limit por IP/usuário)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // TenantRateLimitGuard é registrado como APP_GUARD dentro do TenantModule
    // (onde tem acesso correto a CACHE_MANAGER e TenantContextService via DI)
    RateLimitMonitorService,
    // Monitor de conexão com banco de dados
    DatabaseConnectionMonitor,
  ],
})
export class AppModule {}
