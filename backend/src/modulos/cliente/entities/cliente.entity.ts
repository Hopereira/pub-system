// Caminho: backend/src/modulos/cliente/entities/cliente.entity.ts

// ✅ CORREÇÃO: O caminho agora é relativo, subindo dois níveis de pasta.
import { Comanda } from '../../comanda/entities/comanda.entity';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { PontoEntrega } from '../../ponto-entrega/entities/ponto-entrega.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('clientes')
@Index('idx_cliente_cpf_tenant', ['cpf', 'tenantId'], { unique: true })
export class Cliente extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_cliente_cpf')
  @Column({ length: 14 })
  cpf: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  celular?: string;

  // ✅ NOVO: Relação com Ambiente (onde o cliente está)
  @Column({ name: 'ambiente_id', type: 'uuid', nullable: true })
  ambienteId?: string;

  @ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente?: Ambiente;

  // ✅ NOVO: Relação com Ponto de Entrega (preferência do cliente)
  @Column({ name: 'ponto_entrega_id', type: 'uuid', nullable: true })
  pontoEntregaId?: string;

  @ManyToOne(() => PontoEntrega, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ponto_entrega_id' })
  pontoEntrega?: PontoEntrega;

  @OneToMany(() => Comanda, (comanda) => comanda.cliente)
  comandas: Comanda[];
}
