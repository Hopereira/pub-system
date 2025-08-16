import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany, // Adicionado
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { Pedido } from '../../pedido/entities/pedido.entity'; // Adicionado

export enum ComandaStatus {
  ABERTA = 'ABERTA',
  FECHADA = 'FECHADA',
  PAGA = 'PAGA',
}

@Entity('comandas')
export class Comanda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ComandaStatus,
    default: ComandaStatus.ABERTA,
  })
  status: ComandaStatus;

  @ManyToOne(() => Mesa, { nullable: true })
  @JoinColumn({ name: 'mesaId' })
  mesa: Mesa;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  // --- CORREÇÃO ADICIONADA AQUI ---
  @OneToMany(() => Pedido, (pedido) => pedido.comanda)
  pedidos: Pedido[];
}