import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ nullable: true })
  nome: string;

  // --- NOVOS CAMPOS ADICIONADOS ---

  @Column({ unique: true, nullable: true }) // Único, mas pode ser nulo se o cliente não quiser fornecer
  email: string;

  @Column({ nullable: true }) // Celular é opcional
  celular: string;
}