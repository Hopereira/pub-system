import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemPedido } from './item-pedido.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';

/**
 * Entidade para registrar histórico de retiradas de itens
 * Permite rastrear múltiplas retiradas do mesmo item (ex: item de múltiplos ambientes)
 */
@Entity('retiradas_itens')
export class RetiradaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Item de pedido que foi retirado
  @Column({ name: 'item_pedido_id', type: 'uuid' })
  itemPedidoId: string;

  @ManyToOne(() => ItemPedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_pedido_id' })
  itemPedido: ItemPedido;

  // Garçom que retirou
  @Column({ name: 'garcom_id', type: 'uuid' })
  garcomId: string;

  @ManyToOne(() => Funcionario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'garcom_id' })
  garcom: Funcionario;

  // Ambiente de onde foi retirado
  @Column({ name: 'ambiente_id', type: 'uuid' })
  ambienteId: string;

  @ManyToOne(() => Ambiente, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;

  // Timestamp da retirada
  @Column({
    name: 'retirado_em',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  retiradoEm: Date;

  // Tempo de reação (PRONTO -> RETIRADO) em minutos
  @Column({ name: 'tempo_reacao_minutos', type: 'integer', nullable: true })
  tempoReacaoMinutos: number;

  // Observação opcional
  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_retirada_item_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
