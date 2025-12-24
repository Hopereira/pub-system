import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Comanda } from '../../comanda/entities/comanda.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';

@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Comanda, { nullable: false })
  @JoinColumn({ name: 'comandaId' })
  comanda: Comanda;

  @Column({ type: 'uuid' })
  comandaId: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid', nullable: true })
  clienteId: string;

  // Avaliação de 1 a 5 estrelas
  @Column({ type: 'int' })
  nota: number;

  // Comentário opcional
  @Column({ type: 'text', nullable: true })
  comentario: string;

  // Tempo que o cliente ficou no estabelecimento (em minutos)
  @Column({ type: 'int', nullable: true })
  tempoEstadia: number;

  // Valor total gasto
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorGasto: number;

  @CreateDateColumn()
  criadoEm: Date;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_avaliacao_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
