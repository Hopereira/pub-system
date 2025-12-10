// Caminho: backend/src/modulos/evento/entities/evento.entity.ts

// ✅ CORREÇÃO: O caminho agora é relativo, subindo dois níveis de pasta.
import { PaginaEvento } from '../../pagina-evento/entities/pagina-evento.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('eventos')
export class Evento {
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

  @ManyToOne(() => PaginaEvento, { eager: true, nullable: true })
  paginaEvento: PaginaEvento;
}
