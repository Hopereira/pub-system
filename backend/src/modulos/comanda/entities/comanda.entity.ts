// Caminho: backend/src/modulos/comanda/entities/comanda.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { Pedido } from '../../pedido/entities/pedido.entity';
// ✅ CORREÇÃO: O caminho agora é relativo, subindo dois níveis de pasta.
import { PaginaEvento } from '../../pagina-evento/entities/pagina-evento.entity';

export enum ComandaStatus {
  ABERTA = 'ABERTA',
  FECHADA = 'FECHADA',
  PAGA = 'PAGA',
}

@Entity('comandas')
export class Comanda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ComandaStatus, default: ComandaStatus.ABERTA })
  status: ComandaStatus;

  @CreateDateColumn()
  dataAbertura: Date;
  
  @ManyToOne(() => Mesa, (mesa) => mesa.comandas, { nullable: true, eager: true })
  mesa: Mesa;

  @ManyToOne(() => Cliente, (cliente) => cliente.comandas, { nullable: true, eager: true })
  cliente: Cliente;

  @OneToMany(() => Pedido, (pedido) => pedido.comanda)
  pedidos: Pedido[];

  @ManyToOne(() => PaginaEvento, { nullable: true, eager: true })
  paginaEvento: PaginaEvento;
}