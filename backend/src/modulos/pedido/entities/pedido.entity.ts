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
}