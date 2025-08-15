import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Definimos os status possíveis para uma mesa
export enum MesaStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
}

@Entity('mesas')
export class Mesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'int' })
  numero: number;

  @Column({
    type: 'enum',
    enum: MesaStatus,
    default: MesaStatus.LIVRE,
  })
  status: MesaStatus;
}
