// Caminho: backend/src/modulos/mesa/entities/mesa.entity.ts

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique, // NOVO: Importamos o decorador Unique
} from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';

export enum MesaStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
}

@Entity('mesas')
// NOVO: Criamos uma constraint de unicidade composta.
// Isso garante que a combinação de 'numero' e 'ambiente' seja única.
@Unique(['numero', 'ambiente'])
export class Mesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ATUALIZADO: Removemos o 'unique: true' daqui, pois a regra agora é composta
  @Column({ type: 'int' })
  numero: number;

  @Column({
    type: 'enum',
    enum: MesaStatus,
    default: MesaStatus.LIVRE,
  })
  status: MesaStatus;

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.mesas)
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;
}