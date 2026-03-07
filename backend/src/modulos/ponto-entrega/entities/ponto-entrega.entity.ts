// Caminho: backend/src/modulos/ponto-entrega/entities/ponto-entrega.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresa/entities/empresa.entity';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Comanda } from '../../comanda/entities/comanda.entity';
import { TenantAwareEntity } from '../../../common/tenant/entities/tenant-aware.entity';

@Entity('pontos_entrega')
export class PontoEntrega extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

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

  // Relação: Mesa Próxima (opcional)
  @Column({ name: 'mesa_proxima_id', type: 'uuid', nullable: true })
  mesaProximaId: string;

  @ManyToOne(() => Mesa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mesa_proxima_id' })
  mesaProxima: Mesa;

  // Relação: Ambiente de Atendimento (onde o cliente está fisicamente)
  @Column({ name: 'ambiente_atendimento_id', type: 'uuid', nullable: true })
  ambienteAtendimentoId: string;

  @ManyToOne(() => Ambiente, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ambiente_atendimento_id' })
  ambienteAtendimento: Ambiente;

  // Relação: Ambiente de Preparo (de onde vem o pedido)
  @Column({ name: 'ambiente_preparo_id', type: 'uuid' })
  ambientePreparoId: string;

  @ManyToOne(() => Ambiente, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ambiente_preparo_id' })
  ambientePreparo: Ambiente;

  // Relação: Empresa
  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Relação: Comandas que usam este ponto
  @OneToMany(() => Comanda, (comanda) => comanda.pontoEntrega)
  comandas: Comanda[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

}
