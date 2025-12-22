// Caminho: backend/src/modulos/caixa/repositories/movimentacao-caixa.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../../common/tenant/tenant-context.service';
import { MovimentacaoCaixa } from '../entities/movimentacao-caixa.entity';

/**
 * MovimentacaoCaixaRepository - Repositório tenant-aware para movimentações de caixa
 */
@Injectable({ scope: Scope.REQUEST })
export class MovimentacaoCaixaRepository extends BaseTenantRepository<MovimentacaoCaixa> {
  constructor(
    @InjectRepository(MovimentacaoCaixa)
    repository: Repository<MovimentacaoCaixa>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
