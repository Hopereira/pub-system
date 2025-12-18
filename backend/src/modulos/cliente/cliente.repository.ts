import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClienteRepository extends BaseTenantRepository<Cliente> {
  constructor(
    @InjectRepository(Cliente)
    repository: Repository<Cliente>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Busca cliente por CPF
   */
  async findByCpf(cpf: string) {
    return this.findOne({
      where: { cpf } as any,
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
