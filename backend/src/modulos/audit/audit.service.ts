import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { AuditLogRepository } from './audit.repository';
import { AUDIT_QUEUE } from '../../queues/queues.module';
import { AuditJobData } from '../../queues/processors/audit.processor';

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
  tenantId?: string;
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
  private readonly useQueue: boolean;

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    @Optional() @InjectQueue(AUDIT_QUEUE) private readonly auditQueue?: Queue<AuditJobData>,
  ) {
    this.useQueue = !!this.auditQueue;
    if (this.useQueue) {
      this.logger.log('📬 AuditService usando fila BullMQ (async)');
    } else {
      this.logger.log('📝 AuditService usando escrita direta (sync fallback)');
    }
  }

  /**
   * Cria um registro de auditoria
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      const tenantId = dto.tenantId || dto.funcionario?.tenantId || null;
      const jobData: AuditJobData = {
        funcionarioEmail: dto.funcionario?.email || dto.funcionarioEmail,
        action: dto.action,
        entityName: dto.entityName,
        entityId: dto.entityId,
        oldData: dto.oldData,
        newData: dto.newData,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        endpoint: dto.endpoint,
        method: dto.method,
        description: dto.description,
        tenantId,
      };

      // ⚡ Tentar despachar para fila (async, não-bloqueante)
      if (this.useQueue) {
        try {
          await this.auditQueue.add('audit-log', jobData, {
            removeOnComplete: 100,
            removeOnFail: 500,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          });
          this.logger.debug(
            `📬 Auditoria enfileirada: ${dto.action} em ${dto.entityName} por ${jobData.funcionarioEmail || 'Sistema'}`,
          );
          return null; // job processado async
        } catch (queueError) {
          this.logger.warn(`⚠️ Fila indisponível, fallback sync: ${queueError.message}`);
          // Fallback para escrita direta
        }
      }

      // Fallback: escrita direta (sync)
      const auditLog = this.auditLogRepository.rawRepository.create(jobData as any);
      const saved = await this.auditLogRepository.rawRepository.save(auditLog) as unknown as AuditLog;

      this.logger.debug(
        `📝 Auditoria: ${dto.action} em ${dto.entityName} por ${jobData.funcionarioEmail || 'Sistema'}`,
      );

      return saved;
    } catch (error) {
      // Auditoria NUNCA deve bloquear operações críticas (login, etc.)
      this.logger.error(`❌ Erro ao registrar auditoria (não-bloqueante): ${error.message}`);
      return null;
    }
  }

  /**
   * Busca registros de auditoria com filtros
   */
  async findAll(filters: AuditLogFilters) {
    const {
      funcionarioId,
      entityName,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.funcionario', 'funcionario');

    if (funcionarioId) {
      query.andWhere('audit.funcionarioId = :funcionarioId', { funcionarioId });
    }

    if (entityName) {
      query.andWhere('audit.entityName = :entityName', { entityName });
    }

    if (entityId) {
      query.andWhere('audit.entityId = :entityId', { entityId });
    }

    if (action) {
      if (Array.isArray(action)) {
        query.andWhere('audit.action IN (:...actions)', { actions: action });
      } else {
        query.andWhere('audit.action = :action', { action });
      }
    }

    if (startDate && endDate) {
      query.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    query
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca histórico de alterações de uma entidade
   */
  async getEntityHistory(entityName: string, entityId: string) {
    return this.auditLogRepository.find({
      where: {
        entityName,
        entityId,
      },
      relations: ['funcionario'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Busca atividades recentes de um usuário
   */
  async getUserActivity(funcionarioId: string, limit: number = 50) {
    return this.auditLogRepository.find({
      where: {
        funcionario: { id: funcionarioId },
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
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
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilderUnsafe('audit')
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
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (startDate && endDate) {
      query.where('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const totalLogs = await query.getCount();

    const actionStats = await query
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .getRawMany();

    const entityStats = await query
      .select('audit.entityName', 'entity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.entityName')
      .getRawMany();

    const userStats = await query
      .select('audit.funcionarioEmail', 'user')
      .addSelect('COUNT(*)', 'count')
      .where('audit.funcionarioEmail IS NOT NULL')
      .groupBy('audit.funcionarioEmail')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalLogs,
      byAction: actionStats,
      byEntity: entityStats,
      topUsers: userStats,
    };
  }

  /**
   * Busca tentativas de login falhadas
   */
  async getFailedLogins(limit: number = 50) {
    return this.auditLogRepository.find({
      where: {
        action: AuditAction.LOGIN_FAILED,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }
}
