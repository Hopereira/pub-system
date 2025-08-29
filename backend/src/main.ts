
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
  origin: 'http://localhost:3001', // Permite explicitamente o seu front-end
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});

  app.useGlobalPipes(new ValidationPipe());

  // INÍCIO DO CÓDIGO DO SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Pub System API')
    .setDescription('Documentação completa da API para o sistema de gestão de pubs.')
    .setVersion('1.0')
    .addBearerAuth()    
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // FIM DO CÓDIGO DO SWAGGER

  await app.listen(3000);
}
bootstrap();