import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Cliente } from './entities/cliente.entity';

@Injectable({ scope: Scope.REQUEST })
export class ClienteRepository extends BaseTenantRepository<Cliente> {
  constructor(
    @InjectRepository(Cliente)
    repository: Repository<Cliente>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca cliente por CPF (com filtro de tenant)
   */
  async findByCpf(cpf: string) {
    return this.findOne({
      where: { cpf } as any,
    });
  }

  /**
   * Busca cliente por CPF SEM filtro de tenant (para rotas públicas)
   * CPF é único globalmente, então não há risco de conflito
   */
  async findByCpfPublic(cpf: string) {
    return this.rawRepository.findOne({
      where: { cpf },
    });
  }

  /**
   * Busca cliente por telefone
   */
  async findByTelefone(telefone: string) {
    return this.findOne({
      where: { telefone } as any,
    });
  }
}
