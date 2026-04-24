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
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);

        // Tentar conectar ao Redis; fallback para in-memory se indisponível
        if (redisHost) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
                connectTimeout: 5000,
                reconnectStrategy: (retries: number) => {
                  if (retries > 5) return false; // para de tentar após 5 falhas
                  return Math.min(retries * 500, 3000);
                },
              },
              ttl: 3600 * 1000, // 1 hora default
            });
            logger.log(`🔴 Redis conectado (${redisHost}:${redisPort}) — cache centralizado`);
            return { store, ttl: 3600 * 1000, max: 500 };
          } catch (err) {
            logger.warn(`⚠️ Redis indisponível (${redisHost}:${redisPort}): ${err.message} — fallback para memória`);
          }
        }

        logger.log('📦 Usando cache em memória (keyv) — REDIS_HOST não configurado');
        return { ttl: 3600 * 1000, max: 100 };
      },
    }),
  ],
  providers: [CacheInvalidationService],
  exports: [CacheModule, CacheInvalidationService],
})
export class AppCacheModule {}
