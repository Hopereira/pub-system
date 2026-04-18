import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('empresas')
export class Empresa extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column()
  nomeFantasia: string;

  @Column()
  razaoSocial: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  endereco: string;

  /**
   * Slug único para identificação via URL/subdomínio
   * Exemplo: "bar-do-ze" para acessar bar-do-ze.pubsystem.com.br
   */
  @Index('idx_empresas_slug', { unique: true })
  @Column({ unique: true, nullable: true, length: 100 })
  slug: string;

  /**
   * Status do estabelecimento
   * Se false, retorna "Estabelecimento não encontrado"
   */
  @Column({ default: true })
  ativo: boolean;

}
