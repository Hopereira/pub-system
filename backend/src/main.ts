import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json } from 'express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { SeederService } from './database/seeder.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
// TenantInterceptor e TenantGuard são registrados via APP_INTERCEPTOR/APP_GUARD no TenantModule

// Configura timezone para São Paulo (UTC-3)
process.env.TZ = 'America/Sao_Paulo';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // ✅ SEGURANÇA: Helmet para headers HTTP seguros
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"], // Necessário para alguns frameworks
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
              connectSrc: ["'self'", 'https://api.pubsystem.com.br', 'wss://api.pubsystem.com.br'],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false, // Desabilita CSP em dev para Swagger
      crossOriginEmbedderPolicy: false, // Necessário para algumas integrações
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // ✅ SEGURANÇA: Cookie parser para httpOnly refresh tokens
  app.use(cookieParser());

  // 🔥 Ativar Interceptor Global de Logs
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 🏢 Multi-tenancy: TenantInterceptor e TenantGuard agora são registrados
  // via APP_INTERCEPTOR e APP_GUARD no TenantModule (solução correta para DI)
  logger.log('🏢 TenantInterceptor e TenantGuard ativados via TenantModule');

  // 🔥 Ativar Exception Filter Global
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  // CORS: Permitir múltiplas origens (Vercel, localhost, domínio próprio, etc)
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3001',
    'https://pub-system.vercel.app',
    'https://pub-system-git-main-hopereiras-projects.vercel.app',
    'https://pubsystem.com.br',
    'https://www.pubsystem.com.br',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Verificar se a origem está na lista ou é um subdomínio permitido
      if (
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.pubsystem.com.br') ||
        origin.endsWith('.pubsystem.test') ||  // Multi-tenancy local
        origin.includes('pubsystem.test')      // pubsystem.test:3001
      ) {
        return callback(null, true);
      }
      
      callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ✅ SEGURANÇA: Limite de JSON reduzido (era 50mb)
  app.use(json({ limit: '10mb' }));

  // ✅ SEGURANÇA: ValidationPipe completo com proteções adicionais
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // ✅ Rejeita campos extras com erro 400
      forbidUnknownValues: true, // ✅ Rejeita valores desconhecidos
      disableErrorMessages: isProduction, // ✅ Esconde detalhes de erro em produção
    }),
  );

  // ✅ SEGURANÇA: Swagger apenas em desenvolvimento
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('PUB System API')
      .setDescription(`
## Sistema de Gestão para Bares e Restaurantes

### Módulos Principais:
- **Caixa**: Abertura, fechamento, sangrias e vendas
- **Pedidos**: Criação e gestão de pedidos
- **Comandas**: Controle de comandas por mesa
- **Funcionários**: Gestão de equipe e turnos
- **Produtos**: Catálogo de produtos

### Autenticação:
Todas as rotas protegidas requerem token JWT no header:
\`Authorization: Bearer <token>\`

### Códigos de Resposta:
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autenticado
- **403**: Sem permissão
- **404**: Não encontrado
- **500**: Erro interno
      `)
      .setVersion('1.0.0')
      .setContact('Suporte', 'https://pubsystem.com.br', 'suporte@pubsystem.com.br')
      .setLicense('Proprietário', 'https://pubsystem.com.br/licenca')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT obtido no login',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Autenticação e login')
      .addTag('Caixa', 'Gestão de caixa e movimentações financeiras')
      .addTag('Pedidos', 'Criação e gestão de pedidos')
      .addTag('Comandas', 'Controle de comandas')
      .addTag('Funcionários', 'Gestão de funcionários e turnos')
      .addTag('Produtos', 'Catálogo de produtos')
      .addTag('Mesas', 'Gestão de mesas e ambientes')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    logger.log('📚 Swagger disponível em /api');
  }

  // 🔌 Multi-node WebSocket: Redis adapter para Socket.IO
  if (process.env.SOCKET_IO_REDIS_ENABLED === 'true') {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    logger.log('🔌 Socket.IO Redis adapter habilitado (multi-node)');
  }

  const seeder = app.get(SeederService);
  await seeder.seed();

  await app.listen(3000);
  logger.log(`🚀 Aplicação rodando em: ${await app.getUrl()}`);
  logger.log(`🔒 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
}
bootstrap();
