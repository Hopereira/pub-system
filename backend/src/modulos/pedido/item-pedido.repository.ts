// Caminho: backend/src/modulos/pedido/item-pedido.repository.ts

import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { ItemPedido } from './entities/item-pedido.entity';

/**
 * ItemPedidoRepository - Repositório tenant-aware para itens de pedido
 * 
 * Garante que todas as queries de itens de pedido sejam filtradas
 * pelo tenant_id do contexto atual.
 */
@Injectable({ scope: Scope.REQUEST })
export class ItemPedidoRepository extends BaseTenantRepository<ItemPedido> {
  constructor(
    @InjectRepository(ItemPedido)
    repository: Repository<ItemPedido>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }
}
