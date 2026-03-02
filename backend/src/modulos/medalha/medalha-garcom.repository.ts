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

  async findByFuncionarioId(funcionarioId: string): Promise<MedalhaGarcom[]> {
    return this.find({
      where: { funcionarioId } as any,
      relations: ['medalha'],
      order: { conquistadaEm: 'DESC' } as any,
    });
  }
}
