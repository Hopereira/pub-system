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
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
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

  // Ambiente de Retirada (quando garçom deixa no ambiente)
  @Column({ name: 'ambiente_retirada_id', type: 'uuid', nullable: true })
  ambienteRetiradaId: string;

  @ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ambiente_retirada_id' })
  ambienteRetirada: Ambiente;

  // Timestamps para cálculo de tempo de preparo
  @Column({ type: 'timestamp', nullable: true })
  iniciadoEm: Date;

  @Column({ type: 'timestamp', nullable: true })
  prontoEm: Date;

  @Column({ type: 'timestamp', nullable: true })
  entregueEm: Date;

  // ✅ NOVO: Garçom que entregou o item
  @Column({ name: 'garcom_entrega_id', type: 'uuid', nullable: true })
  garcomEntregaId: string;

  @ManyToOne(() => Funcionario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'garcom_entrega_id' })
  garcomEntrega: Funcionario;

  // ✅ NOVO: Tempo de entrega em minutos (calculado automaticamente)
  @Column({ type: 'int', nullable: true })
  tempoEntregaMinutos: number;

  // Tempo de preparo em minutos (do início ao pronto)
  @Column({ name: 'tempo_preparo_minutos', type: 'integer', nullable: true })
  tempoPreparoMinutos: number;
}