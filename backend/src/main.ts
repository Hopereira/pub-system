import 'reflect-metadata';

// ---- INÍCIO DA CORREÇÃO PARA O BUG DO 'CRYPTO' ----
import { webcrypto } from 'crypto';

if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
// ---- FIM DA CORREÇÃO ----

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();