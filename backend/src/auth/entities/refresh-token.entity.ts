import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Funcionario } from '../../modulos/funcionario/entities/funcionario.entity';
import { TenantAwareEntity } from '../../common/tenant/entities/tenant-aware.entity';

/**
 * RefreshToken - Entidade para tokens de renovação de sessão
 * 
 * Multi-tenancy: Cada refresh token é vinculado a um tenant específico.
 * Isso impede que um token de um bar seja usado para gerar acesso em outro.
 */
@Entity('refresh_tokens')
@Index(['tenantId', 'funcionario'])
export class RefreshToken extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  token: string;

  @ManyToOne(() => Funcionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funcionarioId' })
  funcionario: Funcionario;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revokedByIp: string;

  @Column({ type: 'uuid', nullable: true })
  replacedByToken: string;

  @CreateDateColumn()
  createdAt: Date;

  get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  get isActive(): boolean {
    return !this.revoked && !this.isExpired;
  }
}
