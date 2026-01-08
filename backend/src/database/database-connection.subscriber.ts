import { Logger, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Serviço para monitorar eventos de conexão com o banco de dados.
 * Útil para debugging de problemas de conexão com Neon Cloud.
 */
@Injectable()
export class DatabaseConnectionMonitor implements OnModuleInit {
  private readonly logger = new Logger('DatabaseConnection');
  private reconnectAttempts = 0;
  private lastError: Date | null = null;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    const driver = this.dataSource.driver as any;
    
    if (driver?.pool) {
      driver.pool.on('error', (err: Error) => {
        this.reconnectAttempts++;
        const now = new Date();
        
        // Só loga a cada 30 segundos para evitar spam
        if (!this.lastError || now.getTime() - this.lastError.getTime() > 30000) {
          this.logger.warn(
            `⚠️ Erro no pool de conexões (tentativa ${this.reconnectAttempts}): ${err.message}`,
          );
          this.lastError = now;
        }
      });

      driver.pool.on('connect', () => {
        if (this.reconnectAttempts > 0) {
          this.logger.log('✅ Conexão com banco de dados restabelecida');
          this.reconnectAttempts = 0;
          this.lastError = null;
        }
      });

      this.logger.log('🔌 Monitor de conexão com banco de dados inicializado');
    }
  }
}
