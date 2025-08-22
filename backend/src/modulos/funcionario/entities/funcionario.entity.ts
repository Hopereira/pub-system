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

  //@BeforeInsert()
  //async hashPassword() {
   // this.senha = await bcrypt.hash(this.senha, 10);
  //} --->>>>>  comentei para testes
}
