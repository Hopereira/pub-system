import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Produto } from './entities/produto.entity';

@Injectable({ scope: Scope.REQUEST })
export class ProdutoRepository extends BaseTenantRepository<Produto> {
  constructor(
    @InjectRepository(Produto)
    repository: Repository<Produto>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
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
