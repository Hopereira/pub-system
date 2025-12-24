// Caminho: backend/src/modulos/caixa/repositories/abertura-caixa.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../../common/tenant/tenant-context.service';
import { AberturaCaixa } from '../entities/abertura-caixa.entity';

/**
 * AberturaCaixaRepository - Repositório tenant-aware para aberturas de caixa
 */
@Injectable({ scope: Scope.REQUEST })
export class AberturaCaixaRepository extends BaseTenantRepository<AberturaCaixa> {
  constructor(
    @InjectRepository(AberturaCaixa)
    repository: Repository<AberturaCaixa>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
