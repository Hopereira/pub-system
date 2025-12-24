import { PaymentGateway } from '../entities/payment-config.entity';

/**
 * Dados do cliente para pagamento
 */
export interface CustomerData {
  email: string;
  name: string;
  document?: string; // CPF/CNPJ
  phone?: string;
}

/**
 * Dados para criar uma assinatura
 */
export interface CreateSubscriptionData {
  customerId?: string;
  customer: CustomerData;
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  trialDays?: number;
  metadata?: Record<string, any>;
}

/**
 * Dados para criar um pagamento único
 */
export interface CreatePaymentData {
  customer: CustomerData;
  amount: number;
  description: string;
  paymentMethod?: string;
  installments?: number;
  metadata?: Record<string, any>;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

/**
 * Resultado da criação de pagamento
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status: string;
  checkoutUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  pixCode?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Resultado da criação de assinatura
 */
export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  status: string;
  checkoutUrl?: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Dados do webhook
 */
export interface WebhookData {
  gateway: PaymentGateway;
  event: string;
  paymentId?: string;
  subscriptionId?: string;
  status: string;
  amount?: number;
  rawData: any;
}

/**
 * Interface abstrata para gateways de pagamento
 */
export interface IPaymentGateway {
  /**
   * Nome do gateway
   */
  readonly name: PaymentGateway;

  /**
   * Inicializa o gateway com as credenciais
   */
  initialize(config: {
    publicKey?: string;
    accessToken?: string;
    secretKey?: string;
    sandbox?: boolean;
  }): void;

  /**
   * Cria um pagamento único (checkout)
   */
  createPayment(data: CreatePaymentData): Promise<PaymentResult>;

  /**
   * Cria uma assinatura recorrente
   */
  createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResult>;

  /**
   * Cancela uma assinatura
   */
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Consulta status de um pagamento
   */
  getPaymentStatus(paymentId: string): Promise<{ status: string; rawResponse?: any }>;

  /**
   * Processa webhook do gateway
   */
  processWebhook(payload: any, signature?: string): Promise<WebhookData>;

  /**
   * Valida assinatura do webhook
   */
  validateWebhookSignature(payload: any, signature: string): boolean;
}
