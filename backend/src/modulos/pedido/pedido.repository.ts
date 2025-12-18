import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Pedido } from './entities/pedido.entity';

@Injectable()
export class PedidoRepository extends BaseTenantRepository<Pedido> {
  constructor(
    @InjectRepository(Pedido)
    repository: Repository<Pedido>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Busca pedidos por status com itens
   */
  async findByStatusComItens(status: string) {
    return this.find({
      where: { status } as any,
      relations: ['itens', 'itens.produto', 'comanda'],
      order: { data: 'DESC' } as any,
    });
  }

  /**
   * Busca pedidos de uma comanda
   */
  async findByComandaId(comandaId: string) {
    return this.find({
      where: { comandaId } as any,
      relations: ['itens', 'itens.produto'],
      order: { data: 'ASC' } as any,
    });
  }
}
