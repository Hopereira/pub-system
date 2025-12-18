import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Produto } from './entities/produto.entity';

@Injectable()
export class ProdutoRepository extends BaseTenantRepository<Produto> {
  constructor(
    @InjectRepository(Produto)
    repository: Repository<Produto>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Busca produtos ativos com ambiente
   */
  async findAtivosComAmbiente() {
    return this.find({
      where: { ativo: true } as any,
      relations: ['ambiente'],
      order: { nome: 'ASC' } as any,
    });
  }

  /**
   * Busca produto por ID com ambiente
   */
  async findByIdComAmbiente(id: string) {
    return this.findOne({
      where: { id } as any,
      relations: ['ambiente'],
    });
  }
}
