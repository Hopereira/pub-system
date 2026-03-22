import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheInvalidationService } from './cache-invalidation.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        logger.log('📦 Usando cache em memória (keyv)');
        return { ttl: 3600 * 1000, max: 100 };
      },
    }),
  ],
  providers: [CacheInvalidationService],
  exports: [CacheModule, CacheInvalidationService],
})
export class AppCacheModule {}
