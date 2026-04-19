import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Features disponíveis na plataforma
 */
export const ALL_FEATURES = [
  // Básicas
  { key: 'pedidos', label: 'Pedidos', description: 'Sistema de pedidos' },
  { key: 'comandas', label: 'Comandas', description: 'Gestão de comandas' },
  { key: 'mesas', label: 'Mesas', description: 'Gestão de mesas' },
  { key: 'produtos', label: 'Produtos', description: 'Cardápio de produtos' },
  { key: 'funcionarios', label: 'Funcionários', description: 'Gestão de funcionários' },
  { key: 'cardapio_digital', label: 'Cardápio Digital (QR Code)', description: 'Páginas de boas-vindas com QR Code para atendimento automático' },
  
  // Intermediárias
  { key: 'clientes', label: 'Clientes', description: 'Cadastro de clientes' },
  { key: 'avaliacoes', label: 'Avaliações', description: 'Sistema de avaliações' },
  { key: 'eventos', label: 'Eventos (Couvert/Agenda)', description: 'Agenda de eventos pagos com entrada e couvert artístico' },
  { key: 'pontos_entrega', label: 'Pontos de Entrega', description: 'Gestão de pontos de entrega' },
  { key: 'turnos', label: 'Turnos', description: 'Check-in/Check-out de funcionários' },
  
  // Avançadas
  { key: 'analytics', label: 'Analytics', description: 'Relatórios avançados e métricas' },
  { key: 'relatorios_avancados', label: 'Relatórios Avançados', description: 'Exportação e dashboards' },
  { key: 'medalhas', label: 'Medalhas', description: 'Gamificação para funcionários' },
  { key: 'caixa_avancado', label: 'Caixa Avançado', description: 'Gestão avançada de caixa' },
  
  // Premium
  { key: 'api_externa', label: 'API Externa', description: 'Acesso à API para integrações' },
  { key: 'webhooks', label: 'Webhooks', description: 'Notificações automáticas' },
  { key: 'white_label', label: 'White Label', description: 'Personalização completa' },
  { key: 'multi_unidade', label: 'Multi-Unidade', description: 'Gestão de múltiplas unidades' },
  { key: 'suporte_prioritario', label: 'Suporte Prioritário', description: 'Atendimento 24/7' },
];

/**
 * Limites configuráveis por plano
 */
export interface PlanLimits {
  maxMesas: number;
  maxFuncionarios: number;
  maxProdutos: number;
  maxAmbientes: number;
  maxEventos: number;
  storageGB: number;
}

/**
 * Entidade Plan - Planos de assinatura configuráveis
 */
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_plans_code', { unique: true })
  @Column({ unique: true, length: 50 })
  code: string; // FREE, BASIC, STANDARD, PRO, ENTERPRISE

  @Column({ length: 100 })
  name: string; // Nome de exibição

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceMonthly: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceYearly: number;

  @Column({ type: 'jsonb', default: [] })
  features: string[]; // Lista de features ativas

  @Column({ type: 'jsonb', default: {} })
  limits: PlanLimits;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPopular: boolean; // Destaque na landing page

  @Column({ default: 0 })
  sortOrder: number; // Ordem de exibição

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Dados extras (cor, ícone, etc.)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
