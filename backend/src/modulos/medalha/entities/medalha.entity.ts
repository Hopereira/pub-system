import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TipoMedalha } from '../enums/tipo-medalha.enum';
import { NivelMedalha } from '../enums/nivel-medalha.enum';

@Entity('medalhas')
export class Medalha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoMedalha,
  })
  tipo: TipoMedalha;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ length: 50 })
  icone: string;

  @Column({
    type: 'enum',
    enum: NivelMedalha,
  })
  nivel: NivelMedalha;

  @Column({ type: 'jsonb' })
  requisitos: {
    // Para VELOCISTA
    entregasRapidas?: number; // Ex: 10, 25, 50 entregas < 2min

    // Para MARATONISTA
    entregasPorDia?: number; // Ex: 30, 60, 100 entregas em um dia

    // Para PONTUAL
    percentualSLA?: number; // Ex: 90%, 95%, 98%
    diasConsecutivos?: number; // Ex: 3, 7, 30 dias

    // Para MVP
    posicaoRanking?: number; // Ex: 1 (primeiro lugar)
    periodoRanking?: 'dia' | 'semana' | 'mes';

    // Para CONSISTENTE
    posicaoMaxima?: number; // Ex: top 3
    diasNoPeriodo?: number; // Ex: 7, 15, 30 dias no top 3
  };

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_medalha_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
