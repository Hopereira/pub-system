import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { MedalhaGarcom } from './entities/medalha-garcom.entity';

@Injectable({ scope: Scope.REQUEST })
export class MedalhaGarcomRepository extends BaseTenantRepository<MedalhaGarcom> {
  constructor(
    @InjectRepository(MedalhaGarcom)
    repository: Repository<MedalhaGarcom>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca medalhas conquistadas por um garçom
   */
  async findByGarcom(garcomId: string) {
    return this.find({
      where: { funcionarioId: garcomId } as any,
      relations: ['medalha'],
      order: { conquistadaEm: 'DESC' } as any,
    });
  }

  /**
   * Verifica se garçom já tem determinada medalha
   */
  async existeMedalha(garcomId: string, medalhaId: string): Promise<boolean> {
    const count = await this.count({
      where: { funcionarioId: garcomId, medalhaId } as any,
    });
    return count > 0;
  }

  /**
   * Busca medalhas conquistadas em um período
   */
  async findMedalhasRecentes(dataInicio: Date) {
    const qb = this.createQueryBuilder('mg')
      .leftJoinAndSelect('mg.medalha', 'medalha')
      .leftJoinAndSelect('mg.funcionario', 'funcionario')
      .andWhere('mg.conquistadaEm >= :dataInicio', { dataInicio })
      .orderBy('mg.conquistadaEm', 'DESC');

    return qb.getMany();
  }
}
