import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TurnoFuncionario } from '../../turno/entities/turno-funcionario.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { Sangria } from './sangria.entity';
import { MovimentacaoCaixa } from './movimentacao-caixa.entity';

export enum StatusCaixa {
  ABERTO = 'ABERTO',
  FECHADO = 'FECHADO',
  CONFERENCIA = 'CONFERENCIA',
}

@Entity('aberturas_caixa')
export class AberturaCaixa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turno_funcionario_id' })
  turnoFuncionarioId: string;

  @ManyToOne(() => TurnoFuncionario, { eager: true })
  @JoinColumn({ name: 'turno_funcionario_id' })
  turnoFuncionario: TurnoFuncionario;

  @Column({ name: 'funcionario_id' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { eager: true })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ type: 'date' })
  dataAbertura: Date;

  @Column({ type: 'time' })
  horaAbertura: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInicial: number;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @Column({
    type: 'enum',
    enum: StatusCaixa,
    default: StatusCaixa.ABERTO,
  })
  status: StatusCaixa;

  @OneToMany(() => Sangria, (sangria) => sangria.aberturaCaixa)
  sangrias: Sangria[];

  @OneToMany(() => MovimentacaoCaixa, (movimentacao) => movimentacao.aberturaCaixa)
  movimentacoes: MovimentacaoCaixa[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
