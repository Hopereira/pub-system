import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cargo } from '../enums/cargo.enum';
import { FuncionarioStatus } from '../enums/funcionario-status.enum';
import { Empresa } from '../../empresa/entities/empresa.entity';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('funcionarios')
@Index('idx_funcionario_email_tenant', ['email', 'tenantId'], { unique: true })
export class Funcionario extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  // ✅ CORREÇÃO: Email único por tenant (não global)
  @Index('idx_funcionario_email')
  @Column()
  email: string;

  @Column()
  senha: string;

  @Column({
    type: 'enum',
    enum: Cargo,
    default: Cargo.GARCOM,
  })
  cargo: Cargo;

  @Column({
    type: 'enum',
    enum: FuncionarioStatus,
    default: FuncionarioStatus.INATIVO,
  })
  status: FuncionarioStatus;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  endereco: string;

  @Column({ nullable: true, name: 'foto_url' })
  fotoUrl: string;

  // ✅ CORREÇÃO DBA: Adicionada relação ManyToOne para integridade referencial
  @Column({ type: 'uuid', nullable: true, name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ✅ CORREÇÃO DBA: Adicionada relação ManyToOne para integridade referencial
  @Column({ type: 'uuid', nullable: true, name: 'ambiente_id' })
  ambienteId: string;

  @ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;

}
