import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Avaliacao } from './entities/avaliacao.entity';

@Injectable({ scope: Scope.REQUEST })
export class AvaliacaoRepository extends BaseTenantRepository<Avaliacao> {
  constructor(
    @InjectRepository(Avaliacao)
    repository: Repository<Avaliacao>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca avaliações com comanda e cliente
   */
  async findWithComandaAndCliente() {
    return this.createQueryBuilder('avaliacao')
      .leftJoinAndSelect('avaliacao.comanda', 'comanda')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'ambiente')
      .orderBy('avaliacao.criadoEm', 'DESC')
      .getMany();
  }

  /**
   * Busca avaliação por comanda
   */
  async findByComandaId(comandaId: string) {
    return this.findOne({
      where: { comandaId } as any,
    });
  }

  /**
   * Busca avaliação por comanda SEM filtro de tenant (para rota pública)
   * ⚠️ CUIDADO: Usado apenas para verificar duplicidade em avaliação pública
   */
  async findByComandaIdPublic(comandaId: string) {
    return this.rawRepository.findOne({
      where: { comandaId },
    });
  }

  /**
   * Cria e salva avaliação usando o tenantId da comanda
   * ⚠️ CUIDADO: Usado apenas para avaliação via rota pública
   */
  async createPublic(data: Partial<Avaliacao>, tenantId: string): Promise<Avaliacao> {
    const avaliacao = this.rawRepository.create({
      ...data,
      tenantId,
    });
    return this.rawRepository.save(avaliacao);
  }
}
