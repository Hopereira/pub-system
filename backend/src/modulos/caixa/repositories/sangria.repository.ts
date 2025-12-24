// Caminho: backend/src/modulos/caixa/repositories/sangria.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../../common/tenant/tenant-context.service';
import { Sangria } from '../entities/sangria.entity';

/**
 * SangriaRepository - Repositório tenant-aware para sangrias
 */
@Injectable({ scope: Scope.REQUEST })
export class SangriaRepository extends BaseTenantRepository<Sangria> {
  constructor(
    @InjectRepository(Sangria)
    repository: Repository<Sangria>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
