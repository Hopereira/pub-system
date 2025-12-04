// Caminho: backend/src/modulos/pagina-evento/entities/pagina-evento.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
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
}
