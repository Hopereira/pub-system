import { Module, Global, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const AUDIT_QUEUE = 'audit';
export const NOTIFICATION_QUEUE = 'notifications';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('QueuesModule');
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);

        if (!redisHost) {
          logger.warn('⚠️ REDIS_HOST não configurado — filas BullMQ desabilitadas (fallback sync)');
        } else {
          logger.log(`📬 BullMQ conectando a Redis (${redisHost}:${redisPort})`);
        }

        return {
          connection: {
            host: redisHost || 'localhost',
            port: redisPort,
            maxRetriesPerRequest: null, // exigido pelo BullMQ
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: AUDIT_QUEUE },
      { name: NOTIFICATION_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
