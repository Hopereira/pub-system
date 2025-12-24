import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

@Entity('audit_logs')
@Index(['funcionario', 'createdAt'])
@Index(['entityName', 'entityId'])
@Index(['action', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Funcionario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'funcionarioId' })
  funcionario: Funcionario;

  @Column({ type: 'varchar', length: 255, nullable: true })
  funcionarioEmail: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldData: any;

  @Column({ type: 'jsonb', nullable: true })
  newData: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_audit_log_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
