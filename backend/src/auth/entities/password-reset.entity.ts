import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Funcionario } from '../../modulos/funcionario/entities/funcionario.entity';

export enum PasswordResetType {
  RESET = 'RESET',
  SETUP = 'SETUP',
}

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'funcionario_id', type: 'uuid' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Index('idx_password_resets_token')
  @Column({ unique: true, length: 255 })
  token: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: PasswordResetType.RESET,
  })
  type: PasswordResetType;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }
}
