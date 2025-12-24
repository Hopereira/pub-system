import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Gateways de pagamento suportados
 */
export enum PaymentGateway {
  MERCADO_PAGO = 'mercado_pago',
  PAGSEGURO = 'pagseguro',
  PICPAY = 'picpay',
}

/**
 * PaymentConfig - Configuração global dos gateways de pagamento
 * 
 * Gerenciado pelo Super Admin para configurar credenciais
 * e ativar/desativar gateways na plataforma.
 */
@Entity('payment_configs')
export class PaymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
    unique: true,
  })
  gateway: PaymentGateway;

  @Column({ default: false })
  enabled: boolean;

  @Column({ default: false })
  sandbox: boolean;

  @Column({ type: 'text', nullable: true })
  publicKey: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string;

  @Column({ type: 'text', nullable: true })
  secretKey: string;

  @Column({ type: 'text', nullable: true })
  webhookSecret: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalConfig: Record<string, any>;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  logoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
