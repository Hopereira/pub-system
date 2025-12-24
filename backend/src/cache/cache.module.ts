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
        const redisEnabled = configService.get('REDIS_ENABLED', 'false') === 'true';
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);

        if (redisEnabled) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
              },
              ttl: 3600,
            });
            logger.log(`✅ Redis cache habilitado (${redisHost}:${redisPort})`);
            return { store, max: 100 };
          } catch (error) {
            logger.warn(`⚠️ Falha ao conectar Redis, usando cache em memória: ${error.message}`);
          }
        }

        logger.log('📦 Usando cache em memória (Redis desabilitado)');
        return { ttl: 3600, max: 100 };
      },
    }),
  ],
  providers: [CacheInvalidationService],
  exports: [CacheModule, CacheInvalidationService],
})
export class AppCacheModule {}
