import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Ambiente } from './entities/ambiente.entity';

@Injectable()
export class AmbienteRepository extends BaseTenantRepository<Ambiente> {
  constructor(
    @InjectRepository(Ambiente)
    repository: Repository<Ambiente>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
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
