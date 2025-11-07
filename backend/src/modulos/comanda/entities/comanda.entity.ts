// Caminho: backend/src/modulos/comanda/entities/comanda.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { Pedido } from '../../pedido/entities/pedido.entity';
import { PaginaEvento } from '../../pagina-evento/entities/pagina-evento.entity';
import { PontoEntrega } from '../../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './comanda-agregado.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

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

  // Ponto de Entrega (alternativa a Mesa)
  @Column({ name: 'ponto_entrega_id', type: 'uuid', nullable: true })
  pontoEntregaId: string;

  @ManyToOne(() => PontoEntrega, (ponto) => ponto.comandas, { nullable: true, eager: true })
  @JoinColumn({ name: 'ponto_entrega_id' })
  pontoEntrega: PontoEntrega;

  // Agregados (familiares/amigos na mesma comanda)
  @OneToMany(() => ComandaAgregado, (agregado) => agregado.comanda, { cascade: true })
  agregados: ComandaAgregado[];

  @OneToMany(() => Pedido, (pedido) => pedido.comanda)
  pedidos: Pedido[];

  @ManyToOne(() => PaginaEvento, { nullable: true, eager: true })
  paginaEvento: PaginaEvento;

  // Rastreamento: Quem criou a comanda
  @Column({ name: 'criado_por_id', type: 'uuid', nullable: true })
  criadoPorId: string;

  @Column({ name: 'criado_por_tipo', type: 'varchar', length: 20, default: 'CLIENTE' })
  criadoPorTipo: 'GARCOM' | 'CLIENTE';

  @ManyToOne(() => Funcionario, { nullable: true })
  @JoinColumn({ name: 'criado_por_id' })
  criadoPor: Funcionario;
}