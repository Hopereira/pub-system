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

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ CORREÇÃO DBA: Índice para busca por CPF
  @Index('idx_cliente_cpf')
  @Column({ unique: true, length: 14 })
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

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_cliente_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  @OneToMany(() => Comanda, (comanda) => comanda.cliente)
  comandas: Comanda[];
}
