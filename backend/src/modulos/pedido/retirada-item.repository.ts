// Caminho: backend/src/modulos/pedido/retirada-item.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { RetiradaItem } from './entities/retirada-item.entity';

/**
 * RetiradaItemRepository - Repositório tenant-aware para retiradas de itens
 * 
 * Garante que todas as queries de retiradas sejam filtradas
 * pelo tenant_id do contexto atual.
 */
@Injectable({ scope: Scope.REQUEST })
export class RetiradaItemRepository extends BaseTenantRepository<RetiradaItem> {
  constructor(
    @InjectRepository(RetiradaItem)
    repository: Repository<RetiradaItem>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
