import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { PaginaEvento } from './entities/pagina-evento.entity';

@Injectable({ scope: Scope.REQUEST })
export class PaginaEventoRepository extends BaseTenantRepository<PaginaEvento> {
  constructor(
    @InjectRepository(PaginaEvento)
    repository: Repository<PaginaEvento>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  async findAtiva(): Promise<PaginaEvento | null> {
    return this.findOne({ where: { ativa: true } as any });
  }
}
