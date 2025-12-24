import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Funcionario } from './entities/funcionario.entity';

@Injectable({ scope: Scope.REQUEST })
export class FuncionarioRepository extends BaseTenantRepository<Funcionario> {
  constructor(
    @InjectRepository(Funcionario)
    repository: Repository<Funcionario>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
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

  /**
   * Busca funcionário por email SEM filtro de tenant
   * ⚠️ USO EXCLUSIVO PARA AUTENTICAÇÃO - Não usar em outros contextos!
   * 
   * Este método é necessário porque o login acontece ANTES do tenant
   * ser identificado (o tenant é identificado PELO funcionário logado).
   */
  async findByEmailForAuth(email: string): Promise<Funcionario | null> {
    return this.rawRepository
      .createQueryBuilder('funcionario')
      .where('funcionario.email = :email', { email })
      .addSelect('funcionario.senha') // Inclui senha para validação
      .getOne();
  }
}
