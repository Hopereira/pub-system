import { Injectable, Logger } from '@nestjs/common';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { AuditRepository } from './audit.repository';

export interface CreateAuditLogDto {
  funcionario?: Funcionario;
  funcionarioEmail?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  description?: string;
  tenantId?: string; // Multi-tenancy: ID do tenant
}

export interface AuditLogFilters {
  funcionarioId?: string;
  entityName?: string;
  entityId?: string;
  action?: AuditAction | AuditAction[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditRepository: AuditRepository,
  ) {}

  /**
   * Cria um registro de auditoria
   * Nota: Usa rawRepository para permitir criação sem contexto de tenant
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      // Obter tenantId do DTO, do funcionário ou usar um valor padrão
      const tenantId = dto.tenantId || dto.funcionario?.tenantId || null;
      
      const auditLog = this.auditRepository.rawRepository.create({
        ...dto,
        funcionarioEmail: dto.funcionario?.email || dto.funcionarioEmail,
        tenantId,
      });

      const saved = await this.auditRepository.rawRepository.save(auditLog);

      this.logger.debug(
        `📝 Auditoria: ${dto.action} em ${dto.entityName} por ${dto.funcionarioEmail || 'Sistema'}`,
      );

      return saved;
    } catch (error) {
      this.logger.error('❌ Erro ao registrar auditoria:', error);
      throw error;
    }
  }

  /**
   * Busca registros de auditoria com filtros
   * Filtro de tenant aplicado automaticamente pelo repository
   */
  async findAll(filters: AuditLogFilters) {
    return this.auditRepository.findWithFilters(filters);
  }

  /**
   * Busca histórico de alterações de uma entidade
   */
  async getEntityHistory(entityName: string, entityId: string) {
    return this.auditRepository.getEntityHistory(entityName, entityId);
  }

  /**
   * Busca atividades recentes de um usuário
   */
  async getUserActivity(funcionarioId: string, limit: number = 50) {
    return this.auditRepository.getUserActivities(funcionarioId, limit);
  }

  /**
   * Gera relatório de auditoria
   */
  async generateReport(filters: AuditLogFilters) {
    const { data } = await this.findAll({ ...filters, limit: 10000 });

    return data.map((log) => ({
      Data: log.createdAt,
      Usuário: log.funcionarioEmail || 'Sistema',
      Ação: log.action,
      Entidade: log.entityName,
      'ID Entidade': log.entityId,
      IP: log.ipAddress,
      Endpoint: log.endpoint,
      Método: log.method,
      Descrição: log.description,
    }));
  }

  /**
   * Remove registros antigos de auditoria (GDPR compliance)
   * Usa rawRepository para não aplicar filtro de tenant
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditRepository.rawRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    const count = result.affected || 0;
    
    if (count > 0) {
      this.logger.log(`🧹 ${count} registros de auditoria antigos removidos (>${daysToKeep} dias)`);
    }

    return count;
  }

  /**
   * Estatísticas de auditoria
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    return this.auditRepository.getStatistics(startDate, endDate);
  }

  /**
   * Busca tentativas de login falhadas
   */
  async getFailedLogins(hours: number = 24) {
    return this.auditRepository.getFailedLogins(hours);
  }
}
