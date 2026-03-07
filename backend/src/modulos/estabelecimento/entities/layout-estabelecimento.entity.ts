import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('layouts_estabelecimento')
export class LayoutEstabelecimento extends TenantAwareEntity {
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
