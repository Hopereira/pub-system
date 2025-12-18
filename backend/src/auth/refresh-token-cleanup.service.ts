import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('🧹 Iniciando limpeza de refresh tokens expirados...');

    try {
      const count = await this.refreshTokenService.cleanupExpiredTokens();

      if (count > 0) {
        this.logger.log(`✅ Limpeza concluída. ${count} tokens removidos.`);
      } else {
        this.logger.debug('✅ Limpeza concluída. Nenhum token expirado encontrado.');
      }
    } catch (error) {
      this.logger.error('❌ Erro durante limpeza de tokens:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCleanup() {
    try {
      const count = await this.refreshTokenService.cleanupExpiredTokens();
      if (count > 0) {
        this.logger.debug(`🧹 Limpeza horária: ${count} tokens expirados removidos.`);
      }
    } catch (error) {
      this.logger.error('❌ Erro durante limpeza horária:', error);
    }
  }
}
