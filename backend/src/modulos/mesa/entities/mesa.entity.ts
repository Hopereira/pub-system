// Caminho: backend/src/modulos/mesa/entities/mesa.entity.ts

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany, // NOVO: Importamos o OneToMany
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Comanda } from '../../comanda/entities/comanda.entity'; // NOVO: Importamos a Comanda

export enum MesaStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
}

@Entity('mesas')
@Unique(['numero', 'ambiente'])
export class Mesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  numero: number;

  @Column({
    type: 'enum',
    enum: MesaStatus,
    default: MesaStatus.LIVRE,
  })
  status: MesaStatus;

  // Campos de posição para mapa visual
  @Column({ type: 'json', nullable: true })
  posicao: {
    x: number;
    y: number;
  };

  @Column({ type: 'json', nullable: true })
  tamanho: {
    width: number;
    height: number;
  };

  @Column({ type: 'int', nullable: true, default: 0 })
  rotacao: number; // graus (0, 90, 180, 270)

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.mesas)
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;

  // --- NOVO: Definindo o lado inverso da relação com Comanda ---
  @OneToMany(() => Comanda, (comanda) => comanda.mesa)
  comandas: Comanda[];
}