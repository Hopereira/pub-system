import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Status do tenant
 */
export enum TenantStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
  TRIAL = 'TRIAL',
}

/**
 * Plano de assinatura do tenant
 */
export enum TenantPlano {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Configurações específicas do tenant
 */
export interface TenantConfig {
  maxUsuarios?: number;
  maxMesas?: number;
  maxProdutos?: number;
  modulosAtivos?: string[];
  corPrimaria?: string;
  logoUrl?: string;
  paymentGateways?: {
    picpay?: { enabled: boolean; apiKey?: string };
    mercadopago?: { enabled: boolean; accessToken?: string };
    stripe?: { enabled: boolean; secretKey?: string };
  };
}

/**
 * Entidade Tenant - Representa um bar/restaurante na plataforma SaaS
 * 
 * Esta é a tabela central do multi-tenancy. Todos os dados operacionais
 * são vinculados a um tenant através da coluna tenant_id.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nome: string;

  @Index('idx_tenants_slug', { unique: true })
  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ nullable: true, length: 18 })
  cnpj: string;

  @Index('idx_tenants_status')
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ATIVO,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlano,
    default: TenantPlano.FREE,
  })
  plano: TenantPlano;

  @Column({ type: 'jsonb', nullable: true })
  config: TenantConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Verifica se o tenant está ativo
   */
  isAtivo(): boolean {
    return this.status === TenantStatus.ATIVO || this.status === TenantStatus.TRIAL;
  }

  /**
   * Verifica se o tenant pode usar determinado módulo
   */
  hasModulo(modulo: string): boolean {
    if (!this.config?.modulosAtivos) return true; // Sem restrição
    return this.config.modulosAtivos.includes(modulo);
  }
}
