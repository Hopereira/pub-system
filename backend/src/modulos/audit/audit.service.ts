import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';

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
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Cria um registro de auditoria
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...dto,
        funcionarioEmail: dto.funcionario?.email || dto.funcionarioEmail,
      });

      const saved = await this.auditLogRepository.save(auditLog);

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
