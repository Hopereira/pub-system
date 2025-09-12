// Caminho: backend/src/main.ts

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeederService } from './database/seeder.service';
// A importação do PaginaEventoModule já não é necessária aqui
// import { PaginaEventoModule } from './modulos/pagina-evento/pagina-evento.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  const seeder = app.get(SeederService);
  await seeder.seed();
  logger.log('Verificação de seeding concluída.');

  const config = new DocumentBuilder()
    .setTitle('Pub System API')
    .setDescription('Documentação completa da API para o sistema de gestão de pubs.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // --- ALTERAÇÃO AQUI ---
  // Voltamos à forma padrão. O 'app' já conhece todos os módulos importados no AppModule.
  const document = SwaggerModule.createDocument(app, config);
  // --- FIM DA ALTERAÇÃO ---
  
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log(`Aplicação rodando em: ${await app.getUrl()}`);
}
bootstrap();