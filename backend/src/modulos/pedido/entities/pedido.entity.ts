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
import { ItemPedido } from '../entities/item-pedido.entity';
import { PedidoStatus } from '../enums/pedido-status.enum'; // <-- 1. IMPORTAR DO NOVO FICHEIRO

// 2. A DEFINIÇÃO DO ENUM FOI REMOVIDA DAQUI

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

  // ... (resto do ficheiro igual)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn()
  data: Date;
  
  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  motivoCancelamento: string | null;

  @ManyToOne(() => Comanda)
  @JoinColumn({ name: 'comandaId' })
  comanda: Comanda;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
  })
  itens: ItemPedido[];
}