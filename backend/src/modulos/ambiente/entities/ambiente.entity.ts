import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity'; // NOVO: Importamos a entidade Mesa

@Entity('ambientes')
export class Ambiente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // --- NOVO: Definindo o lado inverso da relação com Mesa ---
  @OneToMany(() => Mesa, (mesa) => mesa.ambiente)
  mesas: Mesa[]; // Um ambiente pode ter um array de mesas
}