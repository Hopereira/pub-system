import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('produtos')
export class Produto extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column()
  categoria: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  urlImagem: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos)
  @JoinColumn({ name: 'ambienteId' })
  ambiente: Ambiente;
}
