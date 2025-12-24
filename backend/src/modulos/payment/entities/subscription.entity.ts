import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant, TenantPlano } from '../../../common/tenant/entities/tenant.entity';
import { PaymentGateway } from './payment-config.entity';

/**
 * Status da assinatura
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

/**
 * Ciclo de cobrança
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Subscription - Assinatura de plano de um tenant
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: TenantPlano,
  })
  plano: TenantPlano;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
    nullable: true,
  })
  gateway: PaymentGateway;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  externalSubscriptionId: string;

  @Column({ nullable: true })
  externalCustomerId: string;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
