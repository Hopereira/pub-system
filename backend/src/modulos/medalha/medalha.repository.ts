import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Medalha } from './entities/medalha.entity';

@Injectable({ scope: Scope.REQUEST })
export class MedalhaRepository extends BaseTenantRepository<Medalha> {
  constructor(
    @InjectRepository(Medalha)
    repository: Repository<Medalha>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  async findAtivas(): Promise<Medalha[]> {
    return this.find({ where: { ativo: true } as any, order: { tipo: 'ASC', nivel: 'ASC' } as any });
  }
}
