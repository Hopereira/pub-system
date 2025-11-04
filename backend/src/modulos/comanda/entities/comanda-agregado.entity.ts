// Caminho: backend/src/modulos/comanda/entities/comanda-agregado.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Comanda } from './comanda.entity';

@Entity('comanda_agregados')
export class ComandaAgregado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comanda_id', type: 'uuid' })
  comandaId: string;

  @ManyToOne(() => Comanda, (comanda) => comanda.agregados, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comanda_id' })
  comanda: Comanda;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  cpf: string;

  @Column({ type: 'integer' })
  ordem: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
