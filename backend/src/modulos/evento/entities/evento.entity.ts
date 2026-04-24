// Caminho: backend/src/modulos/evento/entities/evento.entity.ts

// ✅ CORREÇÃO: O caminho agora é relativo, subindo dois níveis de pasta.
import { PaginaEvento } from '../../pagina-evento/entities/pagina-evento.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('eventos')
export class Evento extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column()
  dataEvento: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor: number;

  @Column({ nullable: true })
  urlImagem: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @ManyToOne(() => PaginaEvento, { nullable: true })
  paginaEvento: PaginaEvento;

}
