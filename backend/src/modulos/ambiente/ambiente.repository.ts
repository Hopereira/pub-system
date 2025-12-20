import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Ambiente } from './entities/ambiente.entity';

@Injectable({ scope: Scope.REQUEST })
export class AmbienteRepository extends BaseTenantRepository<Ambiente> {
  constructor(
    @InjectRepository(Ambiente)
    repository: Repository<Ambiente>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca ambientes com mesas e produtos
   */
  async findComMesasEProdutos() {
    return this.find({
      relations: ['mesas', 'produtos'],
      order: { nome: 'ASC' } as any,
    });
  }
}
