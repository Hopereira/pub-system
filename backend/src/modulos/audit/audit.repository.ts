import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable({ scope: Scope.REQUEST })
export class AuditRepository extends BaseTenantRepository<AuditLog> {
  constructor(
    @InjectRepository(AuditLog)
    repository: Repository<AuditLog>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca logs de auditoria com filtros e paginação
   * Filtro de tenant já aplicado automaticamente via createQueryBuilder
   */
  async findWithFilters(filters: {
    funcionarioId?: string;
    entityName?: string;
    entityId?: string;
    action?: AuditAction | AuditAction[];
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
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

    const query = this.createQueryBuilder('audit')
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
    return this.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.funcionario', 'funcionario')
      .andWhere('audit.entityName = :entityName', { entityName })
      .andWhere('audit.entityId = :entityId', { entityId })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Busca atividades de um usuário
   */
  async getUserActivities(funcionarioId: string, limit: number = 50) {
    return this.createQueryBuilder('audit')
      .andWhere('audit.funcionarioId = :funcionarioId', { funcionarioId })
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Conta registros por período para estatísticas
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const query = this.createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action');

    if (startDate && endDate) {
      query.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getRawMany();
  }

  /**
   * Busca tentativas de login falhadas (para segurança)
   */
  async getFailedLogins(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.createQueryBuilder('audit')
      .andWhere('audit.action = :action', { action: AuditAction.LOGIN_FAILED })
      .andWhere('audit.createdAt >= :since', { since })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }
}
