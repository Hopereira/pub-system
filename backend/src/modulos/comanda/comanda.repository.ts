import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Comanda } from './entities/comanda.entity';

@Injectable()
export class ComandaRepository extends BaseTenantRepository<Comanda> {
  constructor(
    @InjectRepository(Comanda)
    repository: Repository<Comanda>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Busca comandas abertas com relações
   */
  async findAbertasComRelacoes() {
    return this.find({
      where: { status: 'ABERTA' } as any,
      relations: ['mesa', 'cliente', 'pedidos'],
      order: { criadoEm: 'DESC' } as any,
    });
  }

  /**
   * Busca comanda por mesa
   */
  async findByMesaId(mesaId: string) {
    return this.findOne({
      where: { mesaId, status: 'ABERTA' } as any,
      relations: ['mesa', 'cliente', 'pedidos', 'pedidos.itens'],
    });
  }
}
