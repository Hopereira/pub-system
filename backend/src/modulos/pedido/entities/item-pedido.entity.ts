import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Pedido } from './pedido.entity';
import { Produto } from '../../produto/entities/produto.entity';
import { PedidoStatus } from '../enums/pedido-status.enum';

@Entity('item_pedido')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precoUnitario: string;

  @Column({ nullable: true })
  observacao?: string;

  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.FEITO,
  })
  status: PedidoStatus;

  // --- NOVA COLUNA ADICIONADA ---
  @Column({ nullable: true })
  motivoCancelamento?: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens)
  pedido: Pedido;

  @ManyToOne(() => Produto)
  produto: Produto;
  
  @CreateDateColumn({ type: 'timestamp' })
  dataCriacao: Date;
}