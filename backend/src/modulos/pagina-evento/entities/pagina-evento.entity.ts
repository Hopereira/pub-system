// Caminho: backend/src/modulos/pagina-evento/entities/pagina-evento.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('paginas_evento')
export class PaginaEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  titulo: string;

  // ALTERAÇÃO AQUI: Adicionamos "nullable: true" para tornar a coluna opcional
  @Column({ type: 'text', name: 'url_imagem', nullable: true })
  urlImagem: string;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_pagina_evento_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
