import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { AberturaCaixa } from './abertura-caixa.entity';
import { TurnoFuncionario } from '../../turno/entities/turno-funcionario.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('sangrias')
@Index('idx_sangria_abertura_caixa', ['aberturaCaixaId'])
export class Sangria extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abertura_caixa_id' })
  aberturaCaixaId: string;

  @ManyToOne(() => AberturaCaixa, (aberturaCaixa) => aberturaCaixa.sangrias)
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
  dataSangria: Date;

  @Column({ type: 'time' })
  horaSangria: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  autorizadoPor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  autorizadoCargo: string;

  @CreateDateColumn()
  criadoEm: Date;

}
