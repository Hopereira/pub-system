// backend/src/shared/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { GcsStorageService } from './gcs-storage.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Importante para o serviço poder ler o .env
  providers: [GcsStorageService],
  exports: [GcsStorageService], // Exporta o serviço para ser usado em outros módulos
})
export class StorageModule {}
