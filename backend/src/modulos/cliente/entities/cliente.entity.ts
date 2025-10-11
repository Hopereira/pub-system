// Caminho: backend/src/modulos/cliente/entities/cliente.entity.ts

// ✅ CORREÇÃO: O caminho agora é relativo, subindo dois níveis de pasta.
import { Comanda } from '../../comanda/entities/comanda.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cpf: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  celular?: string;

  @OneToMany(() => Comanda, (comanda) => comanda.cliente)
  comandas: Comanda[];
}