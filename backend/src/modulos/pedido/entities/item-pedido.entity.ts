import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from 'src/modulos/produto/entities/produto.entity';
// ==================================================================
// ## A CORREÇÃO ESTÁ AQUI: O caminho do import foi ajustado ##
// Usamos '../' para "subir" um nível de pasta antes de procurar por 'enums'.
// ==================================================================
import { PedidoStatus } from '../enums/pedido-status.enum';

@Entity('itens_pedido')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true })
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