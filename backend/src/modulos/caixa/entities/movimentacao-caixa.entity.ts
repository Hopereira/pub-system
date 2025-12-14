import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AberturaCaixa } from './abertura-caixa.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

export enum TipoMovimentacao {
  ABERTURA = 'ABERTURA',
  VENDA = 'VENDA',
  SANGRIA = 'SANGRIA',
  SUPRIMENTO = 'SUPRIMENTO',
  FECHAMENTO = 'FECHAMENTO',
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  VALE_REFEICAO = 'VALE_REFEICAO',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
}

@Entity('movimentacoes_caixa')
export class MovimentacaoCaixa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abertura_caixa_id' })
  aberturaCaixaId: string;

  @ManyToOne(
    () => AberturaCaixa,
    (aberturaCaixa) => aberturaCaixa.movimentacoes,
    { eager: true },
  )
  @JoinColumn({ name: 'abertura_caixa_id' })
  aberturaCaixa: AberturaCaixa;

  @Column({
    type: 'enum',
    enum: TipoMovimentacao,
  })
  tipo: TipoMovimentacao;

  // ✅ CORREÇÃO DBA: Índice para relatórios por período
  @Index('idx_movimentacao_data')
  @Column({ type: 'date' })
  data: Date;

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({
    type: 'enum',
    enum: FormaPagamento,
    nullable: true,
  })
  formaPagamento: FormaPagamento;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ name: 'funcionario_id' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ name: 'comanda_id', nullable: true })
  comandaId: string;

  @Column({ name: 'comanda_numero', nullable: true })
  comandaNumero: string;

  @CreateDateColumn()
  criadoEm: Date;
}
