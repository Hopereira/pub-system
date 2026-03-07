// Caminho: backend/src/modulos/mesa/entities/mesa.entity.ts

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany, // NOVO: Importamos o OneToMany
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Comanda } from '../../comanda/entities/comanda.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

export enum MesaStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
}

@Entity('mesas')
@Index('idx_mesa_numero_ambiente_tenant', ['numero', 'ambienteId', 'tenantId'], { unique: true })
export class Mesa extends TenantAwareEntity {
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

  // Coluna auxiliar para ambiente
  @Column({ type: 'uuid', nullable: true, name: 'ambiente_id' })
  ambienteId: string;

  // --- NOVO: Definindo o lado inverso da relação com Comanda ---
  @OneToMany(() => Comanda, (comanda) => comanda.mesa)
  comandas: Comanda[];
}
