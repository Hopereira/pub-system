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

  /**
   * Busca páginas de evento ativas
   */
  async findAtivas() {
    return this.find({
      where: { ativa: true } as any,
      order: { titulo: 'ASC' } as any,
    });
  }

  /**
   * Busca página de evento por ID
   */
  async findById(id: string) {
    return this.findOne({
      where: { id } as any,
    });
  }
}
