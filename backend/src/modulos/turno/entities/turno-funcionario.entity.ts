import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { Evento } from '../../evento/entities/evento.entity';

@Entity('turnos_funcionario')
export class TurnoFuncionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'funcionario_id' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { eager: true })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ type: 'timestamp' })
  checkIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut: Date;

  @Column({ type: 'int', nullable: true, comment: 'Tempo trabalhado em minutos' })
  horasTrabalhadas: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'evento_id', nullable: true })
  eventoId: string;

  @ManyToOne(() => Evento, { nullable: true, eager: true })
  @JoinColumn({ name: 'evento_id' })
  evento: Evento;

  @CreateDateColumn()
  criadoEm: Date;
}
