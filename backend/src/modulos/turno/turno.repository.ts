import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository, IsNull } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { TurnoFuncionario } from './entities/turno-funcionario.entity';

@Injectable({ scope: Scope.REQUEST })
export class TurnoRepository extends BaseTenantRepository<TurnoFuncionario> {
  constructor(
    @InjectRepository(TurnoFuncionario)
    repository: Repository<TurnoFuncionario>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca turno ativo de um funcionário
   */
  async findTurnoAtivo(funcionarioId: string) {
    return this.findOne({
      where: {
        funcionarioId,
        ativo: true,
        checkOut: IsNull(),
      } as any,
      relations: ['funcionario', 'evento'],
    });
  }

  /**
   * Busca todos os turnos ativos
   */
  async findTurnosAtivos() {
    return this.find({
      where: {
        ativo: true,
        checkOut: IsNull(),
      } as any,
      relations: ['funcionario', 'evento'],
      order: { checkIn: 'ASC' } as any,
    });
  }

  /**
   * Busca turnos de um funcionário em um período
   */
  async findTurnosFuncionario(funcionarioId: string) {
    return this.find({
      where: { funcionarioId } as any,
      order: { checkIn: 'DESC' } as any,
    });
  }
}
