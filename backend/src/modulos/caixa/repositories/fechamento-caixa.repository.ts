// Caminho: backend/src/modulos/caixa/repositories/fechamento-caixa.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../../common/tenant/tenant-context.service';
import { FechamentoCaixa } from '../entities/fechamento-caixa.entity';

/**
 * FechamentoCaixaRepository - Repositório tenant-aware para fechamentos de caixa
 */
@Injectable({ scope: Scope.REQUEST })
export class FechamentoCaixaRepository extends BaseTenantRepository<FechamentoCaixa> {
  constructor(
    @InjectRepository(FechamentoCaixa)
    repository: Repository<FechamentoCaixa>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
