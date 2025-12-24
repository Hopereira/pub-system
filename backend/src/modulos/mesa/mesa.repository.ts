import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Mesa } from './entities/mesa.entity';

@Injectable({ scope: Scope.REQUEST })
export class MesaRepository extends BaseTenantRepository<Mesa> {
  constructor(
    @InjectRepository(Mesa)
    repository: Repository<Mesa>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca mesas com ambiente
   */
  async findComAmbiente() {
    return this.find({
      relations: ['ambiente'],
      order: { numero: 'ASC' } as any,
    });
  }

  /**
   * Busca mesas por ambiente
   */
  async findByAmbienteId(ambienteId: string) {
    return this.find({
      where: { ambienteId } as any,
      relations: ['ambiente'],
      order: { numero: 'ASC' } as any,
    });
  }

  /**
   * Busca mesa por número
   */
  async findByNumero(numero: number) {
    return this.findOne({
      where: { numero } as any,
      relations: ['ambiente'],
    });
  }
}
