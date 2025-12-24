// Caminho: backend/src/modulos/pedido/entities/item-pedido.entity.ts
import {
  Check,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
// --- CORREÇÃO APLICADA AQUI ---
import { Produto } from '../../produto/entities/produto.entity';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';
import { PedidoStatus } from '../enums/pedido-status.enum';

@Entity('itens_pedido')
@Check('chk_quantidade_positiva', '"quantidade" > 0')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true, onDelete: 'SET NULL' }) // onDelete SET NULL para não dar erro ao apagar produto
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;

  // ✅ CORREÇÃO DBA: Quantidade deve ser > 0 (constraint na entity)
  @Column({ type: 'int', default: 1 })
  quantidade: number;

  @Column('numeric', { precision: 10, scale: 2 })
  precoUnitario: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacao: string;

  // ✅ CORREÇÃO DBA: Índice para busca de itens por status (cozinha)
  @Index('idx_item_pedido_status')
  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.FEITO,
  })
  status: PedidoStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoCancelamento: string;

  // Ambiente de Retirada (quando garçom deixa no ambiente)
  @Column({ name: 'ambiente_retirada_id', type: 'uuid', nullable: true })
  ambienteRetiradaId: string;

  @ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ambiente_retirada_id' })
  ambienteRetirada: Ambiente;

  // Timestamps para cálculo de tempo de preparo
  @Column({ type: 'timestamp', nullable: true })
  iniciadoEm: Date;

  @Column({ type: 'timestamp', nullable: true })
  prontoEm: Date;

  // ✅ NOVO: Timestamp quando item foi marcado como quase pronto
  @Column({ name: 'quase_pronto_em', type: 'timestamp', nullable: true })
  quaseProntoEm: Date;

  // ✅ NOVO: Timestamp quando garçom retirou o item
  @Column({ name: 'retirado_em', type: 'timestamp', nullable: true })
  retiradoEm: Date;

  @Column({ type: 'timestamp', nullable: true })
  entregueEm: Date;

  // ✅ NOVO: Garçom que retirou o item
  @Column({ name: 'retirado_por_garcom_id', type: 'uuid', nullable: true })
  retiradoPorGarcomId: string;

  @ManyToOne(() => Funcionario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'retirado_por_garcom_id' })
  retiradoPorGarcom: Funcionario;

  // ✅ NOVO: Garçom que entregou o item
  @Column({ name: 'garcom_entrega_id', type: 'uuid', nullable: true })
  garcomEntregaId: string;

  @ManyToOne(() => Funcionario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'garcom_entrega_id' })
  garcomEntrega: Funcionario;

  // ✅ NOVO: Tempo de entrega em minutos (calculado automaticamente)
  @Column({ name: 'tempoentregaminutos', type: 'int', nullable: true })
  tempoEntregaMinutos: number;

  // Tempo de preparo em minutos (do início ao pronto)
  @Column({ name: 'tempo_preparo_minutos', type: 'integer', nullable: true })
  tempoPreparoMinutos: number;

  // ✅ NOVO: Tempo de reação (PRONTO -> RETIRADO) em minutos
  @Column({ name: 'tempo_reacao_minutos', type: 'integer', nullable: true })
  tempoReacaoMinutos: number;

  // ✅ NOVO: Tempo de entrega final (RETIRADO -> ENTREGUE) em minutos
  @Column({
    name: 'tempo_entrega_final_minutos',
    type: 'integer',
    nullable: true,
  })
  tempoEntregaFinalMinutos: number;

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_item_pedido_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;
}
