import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Cargo } from '../enums/cargo.enum';
import * as bcrypt from 'bcrypt';

@Entity('funcionarios')
export class Funcionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({
    type: 'enum',
    enum: Cargo,
    default: Cargo.GARCOM,
  })
  cargo: Cargo;

  @Column({ type: 'uuid', nullable: true, name: 'empresa_id' })
  empresaId: string;

  @Column({ type: 'uuid', nullable: true, name: 'ambiente_id' })
  ambienteId: string;

  //@BeforeInsert()
  //async hashPassword() {
   // this.senha = await bcrypt.hash(this.senha, 10);
  //} --->>>>>  comentei para testes
}
