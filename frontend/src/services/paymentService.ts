import api from './api';

/**
 * Gateways de pagamento suportados
 */
export enum PaymentGateway {
  MERCADO_PAGO = 'mercado_pago',
  PAGSEGURO = 'pagseguro',
  PICPAY = 'picpay',
}

/**
 * Configuração de gateway
 */
export interface PaymentConfig {
  id: string;
  gateway: PaymentGateway;
  enabled: boolean;
  sandbox: boolean;
  publicKey?: string;
  accessToken?: string;
  secretKey?: string;
  webhookSecret?: string;
  displayName?: string;
  logoUrl?: string;
  additionalConfig?: Record<string, any>;
}

/**
 * Dados para criar checkout
 */
export interface CreateCheckoutDto {
  targetPlan: string;
  billingCycle: 'monthly' | 'yearly';
  gateway: PaymentGateway;
  customer: {
    email: string;
    name: string;
    document?: string;
  };
}

/**
 * Resultado do checkout
 */
export interface CheckoutResult {
  success: boolean;
  paymentId?: string;
  status: string;
  checkoutUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  error?: string;
}

/**
 * Assinatura
 */
export interface Subscription {
  id: string;
  tenantId: string;
  plano: string;
  status: string;
  billingCycle: string;
  gateway?: PaymentGateway;
  price: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
}

/**
 * Transação
 */
export interface PaymentTransaction {
  id: string;
  tenantId: string;
  gateway: PaymentGateway;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
}

const paymentService = {
  // ==========================================
  // ENDPOINTS PARA TENANT ADMIN
  // ==========================================

  /**
   * Lista gateways disponíveis
   */
  async getAvailableGateways(): Promise<PaymentConfig[]> {
    const response = await api.get('/payments/gateways');
    return response.data;
  },

  /**
   * Cria checkout para upgrade de plano
   */
  async createCheckout(data: CreateCheckoutDto): Promise<CheckoutResult> {
    const response = await api.post('/payments/checkout', data);
    return response.data;
  },

  /**
   * Cria assinatura recorrente
   */
  async createSubscription(data: CreateCheckoutDto): Promise<CheckoutResult> {
    const response = await api.post('/payments/subscription', data);
    return response.data;
  },

  /**
   * Retorna assinatura ativa
   */
  async getActiveSubscription(): Promise<Subscription | null> {
    const response = await api.get('/payments/subscription');
    return response.data;
  },

  /**
   * Cancela assinatura
   */
  async cancelSubscription(reason?: string): Promise<void> {
    await api.post('/payments/subscription/cancel', { reason });
  },

  /**
   * Histórico de transações
   */
  async getTransactionHistory(): Promise<PaymentTransaction[]> {
    const response = await api.get('/payments/transactions');
    return response.data;
  },

  // ==========================================
  // ENDPOINTS PARA SUPER ADMIN
  // ==========================================

  /**
   * Lista todas as configurações de gateway (Super Admin)
   */
  async getAllConfigs(): Promise<PaymentConfig[]> {
    const response = await api.get('/payments/admin/configs');
    return response.data;
  },

  /**
   * Atualiza configuração de gateway (Super Admin)
   */
  async updateConfig(
    gateway: PaymentGateway,
    data: Partial<PaymentConfig>,
  ): Promise<PaymentConfig> {
    const response = await api.put(`/payments/admin/configs/${gateway}`, data);
    return response.data;
  },
};

export default paymentService;
