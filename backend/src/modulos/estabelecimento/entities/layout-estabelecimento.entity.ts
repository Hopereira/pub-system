import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';

@Entity('layouts_estabelecimento')
export class LayoutEstabelecimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ambiente_id' })
  ambienteId: string;

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;

  @Column({ type: 'int', default: 1200 })
  width: number;

  @Column({ type: 'int', default: 800 })
  height: number;

  @Column({ type: 'varchar', nullable: true })
  backgroundImage: string;

  @Column({ type: 'int', default: 20 })
  gridSize: number;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
