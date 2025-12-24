import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

/**
 * Classe base para entidades que pertencem a um tenant
 * 
 * Todas as entidades operacionais devem estender esta classe
 * para garantir o isolamento de dados por tenant.
 * 
 * @example
 * ```typescript
 * @Entity('produtos')
 * export class Produto extends TenantAwareEntity {
 *   @Column()
 *   nome: string;
 * }
 * ```
 */
export abstract class TenantAwareEntity {
  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
