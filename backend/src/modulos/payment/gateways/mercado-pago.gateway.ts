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
 * MercadoPagoGateway - Integração com Mercado Pago
 * 
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs
 */
@Injectable()
export class MercadoPagoGateway implements IPaymentGateway {
  private readonly logger = new Logger(MercadoPagoGateway.name);
  readonly name = PaymentGateway.MERCADO_PAGO;

  private accessToken: string;
  private publicKey: string;
  private sandbox: boolean;
  private baseUrl: string;

  initialize(config: {
    publicKey?: string;
    accessToken?: string;
    sandbox?: boolean;
  }): void {
    this.accessToken = config.accessToken || '';
    this.publicKey = config.publicKey || '';
    this.sandbox = config.sandbox ?? true;
    this.baseUrl = 'https://api.mercadopago.com';
    
    this.logger.log(`🔧 Mercado Pago inicializado (sandbox: ${this.sandbox})`);
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      const preference = {
        items: [
          {
            title: data.description,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: data.amount,
          },
        ],
        payer: {
          email: data.customer.email,
          name: data.customer.name,
          identification: data.customer.document
            ? { type: 'CPF', number: data.customer.document }
            : undefined,
        },
        back_urls: {
          success: data.successUrl || '',
          failure: data.failureUrl || '',
          pending: data.pendingUrl || '',
        },
        auto_return: 'approved',
        external_reference: data.metadata?.externalReference || '',
        notification_url: data.metadata?.webhookUrl || '',
      };

      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(preference),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Erro ao criar preferência MP:', result);
        return {
          success: false,
          status: 'error',
          error: result.message || 'Erro ao criar pagamento',
          rawResponse: result,
        };
      }

      this.logger.log(`✅ Preferência MP criada: ${result.id}`);

      return {
        success: true,
        paymentId: result.id,
        status: 'pending',
        checkoutUrl: this.sandbox ? result.sandbox_init_point : result.init_point,
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error('Erro ao criar pagamento MP:', error);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResult> {
    try {
      // Mercado Pago usa "preapproval" para assinaturas
      const preapproval = {
        reason: data.planName,
        auto_recurring: {
          frequency: data.billingCycle === 'monthly' ? 1 : 12,
          frequency_type: 'months',
          transaction_amount: data.price,
          currency_id: 'BRL',
        },
        payer_email: data.customer.email,
        back_url: data.metadata?.backUrl || '',
        external_reference: data.metadata?.externalReference || '',
      };

      const response = await fetch(`${this.baseUrl}/preapproval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(preapproval),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Erro ao criar assinatura MP:', result);
        return {
          success: false,
          status: 'error',
          error: result.message || 'Erro ao criar assinatura',
          rawResponse: result,
        };
      }

      this.logger.log(`✅ Assinatura MP criada: ${result.id}`);

      return {
        success: true,
        subscriptionId: result.id,
        status: result.status,
        checkoutUrl: result.init_point,
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error('Erro ao criar assinatura MP:', error);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.message };
      }

      this.logger.log(`✅ Assinatura MP cancelada: ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string; rawResponse?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const result = await response.json();
      return { status: result.status || 'unknown', rawResponse: result };
    } catch (error) {
      return { status: 'error' };
    }
  }

  async processWebhook(payload: any): Promise<WebhookData> {
    const { type, data, action } = payload;

    let event = type;
    let status = 'unknown';
    let paymentId: string | undefined;
    let subscriptionId: string | undefined;

    if (type === 'payment') {
      paymentId = data?.id;
      // Buscar status real do pagamento
      if (paymentId) {
        const paymentStatus = await this.getPaymentStatus(paymentId);
        status = paymentStatus.status;
      }
    } else if (type === 'subscription_preapproval') {
      subscriptionId = data?.id;
      event = action || type;
    }

    return {
      gateway: PaymentGateway.MERCADO_PAGO,
      event,
      paymentId,
      subscriptionId,
      status,
      rawData: payload,
    };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    // Mercado Pago usa x-signature header
    // Em produção, implementar validação HMAC
    return true;
  }
}
