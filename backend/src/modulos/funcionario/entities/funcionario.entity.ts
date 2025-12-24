import {
  BeforeInsert,
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
import * as bcrypt from 'bcrypt';

@Entity('funcionarios')
@Index('idx_funcionario_email_tenant', ['email', 'tenantId'], { unique: true })
export class Funcionario {
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

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_funcionario_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  //@BeforeInsert()
  //async hashPassword() {
  // this.senha = await bcrypt.hash(this.senha, 10);
  //} --->>>>>  comentei para testes
}
