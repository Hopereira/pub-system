import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Comanda } from './entities/comanda.entity';

@Injectable({ scope: Scope.REQUEST })
export class ComandaRepository extends BaseTenantRepository<Comanda> {
  constructor(
    @InjectRepository(Comanda)
    repository: Repository<Comanda>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca comandas abertas com relações
   */
  async findAbertasComRelacoes() {
    return this.find({
      where: { status: 'ABERTA' } as any,
      relations: ['mesa', 'cliente', 'pedidos'],
      order: { criadoEm: 'DESC' } as any,
    });
  }

  /**
   * Busca comanda por mesa
   */
  async findByMesaId(mesaId: string) {
    return this.findOne({
      where: { mesaId, status: 'ABERTA' } as any,
      relations: ['mesa', 'cliente', 'pedidos', 'pedidos.itens'],
    });
  }

  /**
   * Busca comanda por ID sem filtro de tenant (para rotas públicas)
   * ⚠️ CUIDADO: Usado apenas para avaliação de clientes via página pública
   * @param comandaId - ID da comanda
   * @param relations - Relações a carregar
   */
  async findByIdPublic(comandaId: string, relations: string[] = []) {
    return this.rawRepository.findOne({
      where: { id: comandaId },
      relations,
    });
  }

  /**
   * Retorna o EntityManager do rawRepository (sem exigir tenant)
   * Para uso em transações de rotas públicas
   */
  get publicManager() {
    return this.rawRepository.manager;
  }
}
