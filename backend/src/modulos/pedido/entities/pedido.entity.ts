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
import { ItemPedido } from '../entities/item-pedido.entity'; 

export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

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

  @ManyToOne(() => Comanda)
  @JoinColumn({ name: 'comandaId' })
  comanda: Comanda;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
  })
  itens: ItemPedido[];
}
