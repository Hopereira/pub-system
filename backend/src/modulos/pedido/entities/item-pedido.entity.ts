import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from '../../produto/entities/produto.entity';

@Entity('itens_pedido')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precoUnitario: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens)
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true })
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;
}