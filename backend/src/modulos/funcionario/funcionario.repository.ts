import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Funcionario } from './entities/funcionario.entity';

@Injectable()
export class FuncionarioRepository extends BaseTenantRepository<Funcionario> {
  constructor(
    @InjectRepository(Funcionario)
    repository: Repository<Funcionario>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Busca funcionários ativos
   */
  async findAtivos() {
    return this.find({
      where: { status: 'ATIVO' } as any,
      order: { nome: 'ASC' } as any,
    });
  }

  /**
   * Busca funcionário por email
   */
  async findByEmail(email: string) {
    return this.findOne({
      where: { email } as any,
    });
  }

  /**
   * Busca funcionários por cargo
   */
  async findByCargo(cargo: string) {
    return this.find({
      where: { cargo, status: 'ATIVO' } as any,
      order: { nome: 'ASC' } as any,
    });
  }
}
