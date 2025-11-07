// Caminho: backend/src/modulos/pedido/entities/pedido.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comanda } from '../../comanda/entities/comanda.entity';
// --- CORREÇÃO APLICADA AQUI ---
import { ItemPedido } from './item-pedido.entity';
import { PedidoStatus } from '../enums/pedido-status.enum';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.FEITO,
  })
  status: PedidoStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn()
  data: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  motivoCancelamento: string | null;

  @ManyToOne(() => Comanda, (comanda) => comanda.pedidos)
  @JoinColumn({ name: 'comandaId' })
  comanda: Comanda;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
    eager: true, // Adicionado para carregar os itens junto com o pedido
  })
  itens: ItemPedido[];

  // Rastreamento: Quem criou o pedido
  @Column({ name: 'criado_por_id', type: 'uuid', nullable: true })
  criadoPorId: string;

  @Column({ name: 'criado_por_tipo', type: 'varchar', length: 20, default: 'CLIENTE' })
  criadoPorTipo: 'GARCOM' | 'CLIENTE';

  @ManyToOne(() => Funcionario, { nullable: true })
  @JoinColumn({ name: 'criado_por_id' })
  criadoPor: Funcionario;

  // Rastreamento: Quem entregou o pedido
  @Column({ name: 'entregue_por_id', type: 'uuid', nullable: true })
  entreguePorId: string;

  @ManyToOne(() => Funcionario, { nullable: true })
  @JoinColumn({ name: 'entregue_por_id' })
  entreguePor: Funcionario;

  // Timestamps de entrega
  @Column({ name: 'entregue_em', type: 'timestamp', nullable: true })
  entregueEm: Date;

  // Tempo total em minutos (calculado automaticamente)
  @Column({ name: 'tempo_total_minutos', type: 'integer', nullable: true })
  tempoTotalMinutos: number;
}