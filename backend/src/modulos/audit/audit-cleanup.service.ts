import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from './audit.service';

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);

  constructor(private readonly auditService: AuditService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('🧹 Iniciando limpeza de registros de auditoria antigos...');

    try {
      const count = await this.auditService.cleanupOldLogs(365);

      if (count > 0) {
        this.logger.log(`✅ Limpeza concluída. ${count} registros removidos (>365 dias).`);
      } else {
        this.logger.debug('✅ Limpeza concluída. Nenhum registro antigo encontrado.');
      }
    } catch (error) {
      this.logger.error('❌ Erro durante limpeza de auditoria:', error);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyCleanup() {
    this.logger.log('📊 Gerando estatísticas mensais de auditoria...');

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const stats = await this.auditService.getStatistics(startDate, endDate);

      this.logger.log(`📊 Estatísticas do último mês:`);
      this.logger.log(`   Total de registros: ${stats.totalLogs}`);
      this.logger.log(`   Ações: ${JSON.stringify(stats.byAction)}`);
      this.logger.log(`   Entidades: ${JSON.stringify(stats.byEntity)}`);
    } catch (error) {
      this.logger.error('❌ Erro ao gerar estatísticas:', error);
    }
  }
}
