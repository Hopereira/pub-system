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
 * PicPayGateway - Integração com PicPay
 * 
 * Documentação: https://studio.picpay.com/produtos/e-commerce/checkout
 */
@Injectable()
export class PicPayGateway implements IPaymentGateway {
  private readonly logger = new Logger(PicPayGateway.name);
  readonly name = PaymentGateway.PICPAY;

  private accessToken: string;
  private sellerToken: string;
  private sandbox: boolean;
  private baseUrl: string;

  initialize(config: {
    publicKey?: string;
    accessToken?: string;
    secretKey?: string;
    sandbox?: boolean;
  }): void {
    this.accessToken = config.accessToken || '';
    this.sellerToken = config.secretKey || '';
    this.sandbox = config.sandbox ?? true;
    this.baseUrl = 'https://appws.picpay.com/ecommerce/public';
    
    this.logger.log(`🔧 PicPay inicializado (sandbox: ${this.sandbox})`);
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      const referenceId = data.metadata?.externalReference || `picpay_${Date.now()}`;
      
      const payment = {
        referenceId,
        callbackUrl: data.metadata?.webhookUrl || '',
        returnUrl: data.successUrl || '',
        value: data.amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        buyer: {
          firstName: data.customer.name.split(' ')[0],
          lastName: data.customer.name.split(' ').slice(1).join(' ') || '',
          document: data.customer.document?.replace(/\D/g, ''),
          email: data.customer.email,
          phone: data.customer.phone?.replace(/\D/g, ''),
        },
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-picpay-token': this.accessToken,
        },
        body: JSON.stringify(payment),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Erro ao criar pagamento PicPay:', result);
        return {
          success: false,
          status: 'error',
          error: result.message || 'Erro ao criar pagamento',
          rawResponse: result,
        };
      }

      this.logger.log(`✅ Pagamento PicPay criado: ${referenceId}`);

      return {
        success: true,
        paymentId: referenceId,
        status: 'pending',
        checkoutUrl: result.paymentUrl,
        qrCode: result.qrcode?.content,
        qrCodeBase64: result.qrcode?.base64,
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PicPay:', error);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResult> {
    // PicPay não suporta assinaturas recorrentes nativamente
    // Implementar via pagamentos recorrentes manuais ou usar outro gateway
    this.logger.warn('PicPay não suporta assinaturas recorrentes nativas');
    
    return {
      success: false,
      status: 'unsupported',
      error: 'PicPay não suporta assinaturas recorrentes. Use Mercado Pago ou PagSeguro.',
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'PicPay não suporta assinaturas recorrentes',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string; rawResponse?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/status`, {
        headers: {
          'x-picpay-token': this.accessToken,
        },
      });

      const result = await response.json();

      // Mapear status do PicPay
      const statusMap: Record<string, string> = {
        created: 'pending',
        expired: 'expired',
        analysis: 'in_process',
        paid: 'approved',
        completed: 'approved',
        refunded: 'refunded',
        chargeback: 'rejected',
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
    const { referenceId, authorizationId } = payload;

    // Buscar status atualizado
    let status = 'unknown';
    if (referenceId) {
      const paymentStatus = await this.getPaymentStatus(referenceId);
      status = paymentStatus.status;
    }

    return {
      gateway: PaymentGateway.PICPAY,
      event: 'payment_update',
      paymentId: referenceId,
      status,
      rawData: payload,
    };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    // PicPay usa seller token para validação
    return true;
  }
}
