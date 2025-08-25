
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // INÍCIO DO CÓDIGO DO SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Pub System API')
    .setDescription('Documentação completa da API para o sistema de gestão de pubs.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // FIM DO CÓDIGO DO SWAGGER

  await app.listen(3000);
}
bootstrap();