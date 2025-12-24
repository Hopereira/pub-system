import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('produtos')
export class Produto {
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

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_produto_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos)
  @JoinColumn({ name: 'ambienteId' })
  ambiente: Ambiente;
}
