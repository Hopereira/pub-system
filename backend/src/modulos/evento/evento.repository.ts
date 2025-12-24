import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BaseTenantRepository } from '../../common/tenant/repositories/base-tenant.repository';
import { TenantContextService } from '../../common/tenant';
import { Evento } from './entities/evento.entity';

@Injectable({ scope: Scope.REQUEST })
export class EventoRepository extends BaseTenantRepository<Evento> {
  constructor(
    @InjectRepository(Evento)
    repository: Repository<Evento>,
    @Optional() tenantContext: TenantContextService,
    @Optional() @Inject(REQUEST) request?: any,
  ) {
    super(repository, tenantContext, request);
  }

  /**
   * Busca eventos ativos com página de evento
   */
  async findAtivosComPaginaEvento() {
    return this.find({
      where: { ativo: true } as any,
      relations: ['paginaEvento'],
      order: { dataEvento: 'ASC' } as any,
    });
  }

  /**
   * Busca todos os eventos com página de evento
   */
  async findAllComPaginaEvento() {
    return this.find({
      relations: ['paginaEvento'],
      order: { dataEvento: 'DESC' } as any,
    });
  }

  /**
   * Busca evento por ID com página de evento
   */
  async findByIdComPaginaEvento(id: string) {
    return this.findOne({
      where: { id } as any,
      relations: ['paginaEvento'],
    });
  }
}
