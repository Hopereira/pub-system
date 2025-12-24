import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { PaymentGateway } from './payment-config.entity';

/**
 * Status da transação
 */
export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  IN_PROCESS = 'in_process',
}

/**
 * Tipo de transação
 */
export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  REFUND = 'refund',
}

/**
 * PaymentTransaction - Registro de transações de pagamento
 */
@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ nullable: true })
  externalPaymentId: string;

  @Column({ nullable: true })
  externalTransactionId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
