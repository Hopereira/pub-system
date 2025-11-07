import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { Medalha } from './medalha.entity';

@Entity('medalhas_garcons')
export class MedalhaGarcom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'funcionario_id', type: 'uuid' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ name: 'medalha_id', type: 'uuid' })
  medalhaId: string;

  @ManyToOne(() => Medalha, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medalha_id' })
  medalha: Medalha;

  @CreateDateColumn({ name: 'conquistada_em' })
  conquistadaEm: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    // Dados do momento da conquista
    valorAtingido?: number; // Ex: 50 entregas rápidas
    periodo?: string; // Ex: "07/11/2025"
    posicao?: number; // Ex: 1º lugar
    observacao?: string;
  };
}
