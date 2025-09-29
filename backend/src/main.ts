// backend/src/main.ts
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json } from 'express';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // --- NOVO BLOCO DE CÓDIGO PARA AUTOMATIZAR MIGRAÇÕES ---
  try {
    const dataSource = app.get(DataSource);
    logger.log('Executando migrações do banco de dados...');
    await dataSource.runMigrations();
    logger.log('Migrações executadas com sucesso!');
  } catch (error) {
    logger.error('Erro ao executar migrações:', error);
    await app.close();
    process.exit(1);
  }
  // --- FIM DO NOVO BLOCO ---

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.enableCors({
    origin: 'http://localhost:3001',
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
    .setTitle('Pub System API')
    .setDescription('Documentação completa da API.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log(`Aplicação rodando em: ${await app.getUrl()}`);
}
bootstrap();