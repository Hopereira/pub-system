// Caminho: backend/src/modulos/pedido/entities/item-pedido.entity.ts

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from '../../produto/entities/produto.entity';
import { PedidoStatus } from '../enums/pedido-status.enum'; // <-- ALTERAÇÃO AQUI

@Entity('itens_pedido')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precoUnitario: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacao: string;

  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.FEITO,
  })
  status: PedidoStatus;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens)
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true })
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;
}