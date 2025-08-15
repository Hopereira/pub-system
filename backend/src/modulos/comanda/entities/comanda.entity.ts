import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Cliente } from '../../cliente/entities/cliente.entity'; // <-- Faremos este arquivo em seguida

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
}
