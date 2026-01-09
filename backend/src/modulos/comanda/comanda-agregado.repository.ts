// Caminho: backend/src/modulos/comanda/comanda-agregado.repository.ts
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

@Injectable({ scope: Scope.REQUEST })
export class ComandaAgregadoRepository extends BaseTenantRepository<ComandaAgregado> {
  constructor(
    @InjectRepository(ComandaAgregado)
    repository: Repository<ComandaAgregado>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca agregados por comanda
   */
  async findByComanda(comandaId: string) {
    return this.find({
      where: { comandaId } as any,
      order: { ordem: 'ASC' } as any,
    });
  }

  /**
   * Busca agregado por CPF na comanda
   */
  async findByCpfInComanda(comandaId: string, cpf: string) {
    return this.findOne({
      where: { comandaId, cpf } as any,
    });
  }
}
