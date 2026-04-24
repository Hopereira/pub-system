import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { AberturaCaixa, StatusCaixa } from './abertura-caixa.entity';
import { TurnoFuncionario } from '../../turno/entities/turno-funcionario.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('fechamentos_caixa')
@Index('idx_fechamento_abertura_caixa', ['aberturaCaixaId'])
@Index('idx_fechamento_data', ['dataFechamento'])
export class FechamentoCaixa extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abertura_caixa_id' })
  aberturaCaixaId: string;

  @OneToOne(() => AberturaCaixa)
  @JoinColumn({ name: 'abertura_caixa_id' })
  aberturaCaixa: AberturaCaixa;

  @Column({ name: 'turno_funcionario_id' })
  turnoFuncionarioId: string;

  @ManyToOne(() => TurnoFuncionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turno_funcionario_id' })
  turnoFuncionario: TurnoFuncionario;

  @Column({ name: 'funcionario_id' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ type: 'date' })
  dataFechamento: Date;

  @Column({ type: 'time' })
  horaFechamento: string;

  // Valores esperados (calculados pelo sistema)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoDinheiro: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoPix: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoDebito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoCredito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoValeRefeicao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoValeAlimentacao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorEsperadoTotal: number;

  // Valores informados (conferência física)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoDinheiro: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoPix: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoDebito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoCredito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoValeRefeicao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoValeAlimentacao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorInformadoTotal: number;

  // Diferenças
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaDinheiro: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaPix: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaDebito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaCredito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaValeRefeicao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaValeAlimentacao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencaTotal: number;

  // Estatísticas
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSangrias: number;

  @Column({ type: 'int', default: 0 })
  quantidadeSangrias: number;

  @Column({ type: 'int', default: 0 })
  quantidadeVendas: number;

  @Column({ type: 'int', default: 0 })
  quantidadeComandasFechadas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ticketMedio: number;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @Column({
    type: 'enum',
    enum: StatusCaixa,
    default: StatusCaixa.FECHADO,
  })
  status: StatusCaixa;

  @CreateDateColumn()
  criadoEm: Date;

}
