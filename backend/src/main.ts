// Caminho: backend/src/main.ts

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// --- NOVAS IMPORTAÇÕES ---
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// --- FIM DAS NOVAS IMPORTAÇÕES ---


async function bootstrap() {
  // --- ALTERAÇÃO NA CRIAÇÃO DO APP ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // --- FIM DA ALTERAÇÃO ---

  const logger = new Logger('Bootstrap');

  // --- NOVA LINHA PARA SERVIR FICHEIROS ESTÁTICOS ---
  // Isto cria uma pasta 'public' na raiz do backend que é acessível publicamente.
  // É aqui que guardaremos as nossas imagens.
  app.useStaticAssets(join(__dirname, '..', 'public'));
  // --- FIM DA NOVA LINHA ---

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  //const seeder = app.get(SeederService);
  //await seeder.seed();
  //logger.log('Verificação de seeding concluída.');

  const config = new DocumentBuilder()
    .setTitle('Pub System API')
    .setDescription('Documentação completa da API para o sistema de gestão de pubs.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log(`Aplicação rodando em: ${await app.getUrl()}`);
}
bootstrap();