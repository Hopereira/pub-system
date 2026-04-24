import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

/**
 * RedisIoAdapter — Socket.IO adapter com Redis para multi-node
 *
 * Quando SOCKET_IO_REDIS_ENABLED=true, usa Redis pub/sub para
 * propagar eventos entre múltiplas instâncias do backend.
 *
 * Sem a flag, funciona como single-node (IoAdapter padrão).
 *
 * ROLLBACK: Setar SOCKET_IO_REDIS_ENABLED=false + restart
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || '6379';
    const redisUrl = `redis://${redisHost}:${redisPort}`;

    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(`🔌 Socket.IO Redis adapter connected (${redisUrl})`);
    } catch (error) {
      this.logger.warn(
        `⚠️ Socket.IO Redis adapter failed — falling back to single-node: ${error.message}`,
      );
      this.adapterConstructor = null;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('✅ Socket.IO using Redis adapter (multi-node ready)');
    } else {
      this.logger.log('📡 Socket.IO using default adapter (single-node)');
    }

    return server;
  }
}
