// Caminho: backend/src/main.ts

import { ValidationPipe, Logger } from '@nestjs/common'; // <-- Importe o Logger
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeederService } from './database/seeder.service'; // <-- Importe o SeederService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap'); // <-- Crie uma instância do Logger

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // --- NOVO: LÓGICA DO SEEDER ---
  // Pegamos uma instância do SeederService que criamos
  const seeder = app.get(SeederService);
  // Chamamos o método para popular o banco de dados
  await seeder.seed();
  logger.log('Verificação de seeding concluída.');
  // --- FIM DA LÓGICA DO SEEDER ---

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