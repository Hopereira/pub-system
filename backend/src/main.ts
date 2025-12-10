import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json } from 'express';
import { SeederService } from './database/seeder.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 🔥 Ativar Interceptor Global de Logs
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 🔥 Ativar Exception Filter Global
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(json({ limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

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

  const seeder = app.get(SeederService);
  await seeder.seed();

  await app.listen(3000);
  logger.log(`Aplicação rodando em: ${await app.getUrl()}`);
}
bootstrap();
