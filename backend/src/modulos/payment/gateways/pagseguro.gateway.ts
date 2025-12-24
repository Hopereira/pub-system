import { Injectable, Logger } from '@nestjs/common';
import { PaymentGateway } from '../entities/payment-config.entity';
import {
  IPaymentGateway,
  CreatePaymentData,
  CreateSubscriptionData,
  PaymentResult,
  SubscriptionResult,
  WebhookData,
} from '../interfaces/payment-gateway.interface';

/**
 * PagSeguroGateway - Integração com PagSeguro
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference
 */
@Injectable()
export class PagSeguroGateway implements IPaymentGateway {
  private readonly logger = new Logger(PagSeguroGateway.name);
  readonly name = PaymentGateway.PAGSEGURO;

  private accessToken: string;
  private sandbox: boolean;
  private baseUrl: string;

  initialize(config: {
    publicKey?: string;
    accessToken?: string;
    sandbox?: boolean;
  }): void {
    this.accessToken = config.accessToken || '';
    this.sandbox = config.sandbox ?? true;
    this.baseUrl = this.sandbox
      ? 'https://sandbox.api.pagseguro.com'
      : 'https://api.pagseguro.com';
    
    this.logger.log(`🔧 PagSeguro inicializado (sandbox: ${this.sandbox})`);
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      const order = {
        reference_id: data.metadata?.externalReference || `order_${Date.now()}`,
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          tax_id: data.customer.document?.replace(/\D/g, ''),
          phones: data.customer.phone
            ? [
                {
                  country: '55',
                  area: data.customer.phone.substring(0, 2),
                  number: data.customer.phone.substring(2),
                  type: 'MOBILE',
                },
              ]
            : [],
        },
        items: [
          {
            reference_id: 'item_1',
            name: data.description,
            quantity: 1,
            unit_amount: Math.round(data.amount * 100), // PagSeguro usa centavos
          },
        ],
        notification_urls: data.metadata?.webhookUrl
          ? [data.metadata.webhookUrl]
          : [],
      };

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(order),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Erro ao criar pedido PagSeguro:', result);
        return {
          success: false,
          status: 'error',
          error: result.error_messages?.[0]?.description || 'Erro ao criar pagamento',
          rawResponse: result,
        };
      }

      this.logger.log(`✅ Pedido PagSeguro criado: ${result.id}`);

      // Encontrar link de checkout
      const checkoutLink = result.links?.find((l: any) => l.rel === 'PAY');

      return {
        success: true,
        paymentId: result.id,
        status: result.status || 'pending',
        checkoutUrl: checkoutLink?.href,
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PagSeguro:', error);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResult> {
    try {
      // PagSeguro usa "plans" e "subscriptions"
      // Primeiro criar ou usar um plano existente
      const subscription = {
        reference_id: data.metadata?.externalReference || `sub_${Date.now()}`,
        plan: {
          name: data.planName,
          interval: {
            unit: data.billingCycle === 'monthly' ? 'MONTH' : 'YEAR',
            length: 1,
          },
          amount: {
            value: Math.round(data.price * 100),
            currency: 'BRL',
          },
        },
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          tax_id: data.customer.document?.replace(/\D/g, ''),
        },
        trial: data.trialDays
          ? {
              enabled: true,
              days: data.trialDays,
            }
          : undefined,
      };

      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(subscription),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Erro ao criar assinatura PagSeguro:', result);
        return {
          success: false,
          status: 'error',
          error: result.error_messages?.[0]?.description || 'Erro ao criar assinatura',
          rawResponse: result,
        };
      }

      this.logger.log(`✅ Assinatura PagSeguro criada: ${result.id}`);

      const checkoutLink = result.links?.find((l: any) => l.rel === 'ACTIVATE');

      return {
        success: true,
        subscriptionId: result.id,
        customerId: result.customer?.id,
        status: result.status || 'pending',
        checkoutUrl: checkoutLink?.href,
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error('Erro ao criar assinatura PagSeguro:', error);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.error_messages?.[0]?.description };
      }

      this.logger.log(`✅ Assinatura PagSeguro cancelada: ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string; rawResponse?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const result = await response.json();
      
      // Mapear status do PagSeguro
      const statusMap: Record<string, string> = {
        PAID: 'approved',
        AUTHORIZED: 'approved',
        DECLINED: 'rejected',
        CANCELED: 'cancelled',
        WAITING: 'pending',
      };

      return {
        status: statusMap[result.status] || result.status || 'unknown',
        rawResponse: result,
      };
    } catch (error) {
      return { status: 'error' };
    }
  }

  async processWebhook(payload: any): Promise<WebhookData> {
    const { notificationType, notificationCode } = payload;

    return {
      gateway: PaymentGateway.PAGSEGURO,
      event: notificationType || 'unknown',
      paymentId: notificationCode,
      status: 'pending', // Precisa consultar API para status real
      rawData: payload,
    };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    // PagSeguro valida por IP ou token
    return true;
  }
}
