// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.repository.ts
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { PontoEntrega } from './entities/ponto-entrega.entity';

@Injectable({ scope: Scope.REQUEST })
export class PontoEntregaRepository extends BaseTenantRepository<PontoEntrega> {
  constructor(
    @InjectRepository(PontoEntrega)
    repository: Repository<PontoEntrega>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca pontos de entrega com relações
   */
  async findComRelacoes() {
    return this.find({
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' } as any,
    });
  }

  /**
   * Busca pontos de entrega ativos
   */
  async findAtivos() {
    return this.find({
      where: { ativo: true } as any,
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' } as any,
    });
  }

  /**
   * Busca pontos de entrega por ambiente
   */
  async findByAmbiente(ambienteId: string) {
    return this.createQueryBuilder('ponto')
      .leftJoinAndSelect('ponto.mesaProxima', 'mesaProxima')
      .leftJoinAndSelect('ponto.ambienteAtendimento', 'ambienteAtendimento')
      .leftJoinAndSelect('ponto.ambientePreparo', 'ambientePreparo')
      .where('ponto.ambienteAtendimentoId = :ambienteId', { ambienteId })
      .orWhere('ponto.ambientePreparoId = :ambienteId', { ambienteId })
      .orderBy('ponto.nome', 'ASC')
      .getMany();
  }

  /**
   * Busca ponto de entrega por ID com relações
   */
  async findByIdComRelacoes(id: string) {
    return this.findOne({
      where: { id } as any,
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo', 'empresa'],
    });
  }

  /**
   * Busca pontos de entrega ativos (sem filtro de tenant)
   * Para uso em rotas públicas
   */
  async findAtivosPublic() {
    return this.rawRepository.find({
      where: { ativo: true },
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' },
    });
  }
}
