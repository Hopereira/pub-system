// Caminho: backend/src/modulos/pedido/entities/item-pedido.entity.ts
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn, // É uma boa prática adicionar o JoinColumn
} from 'typeorm';
import { Pedido } from './pedido.entity';
// --- CORREÇÃO APLICADA AQUI ---
import { Produto } from '../../produto/entities/produto.entity';
import { PedidoStatus } from '../enums/pedido-status.enum';

@Entity('itens_pedido')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true, onDelete: 'SET NULL' }) // onDelete SET NULL para não dar erro ao apagar produto
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;

  @Column()
  quantidade: number;
  
  @Column('numeric', { precision: 10, scale: 2 })
  precoUnitario: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacao: string;

  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.FEITO,
  })
  status: PedidoStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoCancelamento: string;
}