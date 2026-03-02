import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentConfig, PaymentGateway } from './entities/payment-config.entity';
import { Subscription, SubscriptionStatus, BillingCycle } from './entities/subscription.entity';
import { PaymentTransaction, TransactionStatus, TransactionType } from './entities/payment-transaction.entity';
import { Tenant, TenantPlano } from '../../common/tenant/entities/tenant.entity';
import { MercadoPagoGateway } from './gateways/mercado-pago.gateway';
import { PagSeguroGateway } from './gateways/pagseguro.gateway';
import { PicPayGateway } from './gateways/picpay.gateway';
import {
  IPaymentGateway,
  CreatePaymentData,
  CreateSubscriptionData,
  PaymentResult,
  SubscriptionResult,
  WebhookData,
} from './interfaces/payment-gateway.interface';

/**
 * Preços dos planos
 */
export const PLAN_PRICES: Record<TenantPlano, { monthly: number; yearly: number }> = {
  [TenantPlano.FREE]: { monthly: 0, yearly: 0 },
  [TenantPlano.BASIC]: { monthly: 99, yearly: 990 },
  [TenantPlano.PRO]: { monthly: 199, yearly: 1990 },
  [TenantPlano.ENTERPRISE]: { monthly: 499, yearly: 4990 },
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private gateways: Map<PaymentGateway, IPaymentGateway> = new Map();

  constructor(
    @InjectRepository(PaymentConfig)
    private readonly configRepository: Repository<PaymentConfig>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly pagSeguroGateway: PagSeguroGateway,
    private readonly picPayGateway: PicPayGateway,
  ) {
    this.gateways.set(PaymentGateway.MERCADO_PAGO, mercadoPagoGateway);
    this.gateways.set(PaymentGateway.PAGSEGURO, pagSeguroGateway);
    this.gateways.set(PaymentGateway.PICPAY, picPayGateway);
  }

  /**
   * Inicializa os gateways com as configurações do banco
   */
  async initializeGateways(): Promise<void> {
    try {
      const configs = await this.configRepository.find({ where: { enabled: true } });
      
      for (const config of configs) {
        const gateway = this.gateways.get(config.gateway);
        if (gateway) {
          gateway.initialize({
            publicKey: config.publicKey,
            accessToken: config.accessToken,
            secretKey: config.secretKey,
            sandbox: config.sandbox,
          });
        }
      }
      
      this.logger.log(`✅ ${configs.length} gateway(s) de pagamento inicializado(s)`);
    } catch (error) {
      // Gracefully handle missing table in test environments
      this.logger.warn(`⚠️ Não foi possível inicializar gateways de pagamento: ${error.message}`);
    }
  }

  /**
   * Retorna gateways disponíveis (habilitados)
   */
  async getAvailableGateways(): Promise<PaymentConfig[]> {
    return this.configRepository.find({
      where: { enabled: true },
      select: ['id', 'gateway', 'displayName', 'logoUrl', 'sandbox'],
    });
  }

  /**
   * Retorna todas as configurações (Super Admin)
   */
  async getAllConfigs(): Promise<PaymentConfig[]> {
    return this.configRepository.find();
  }

  /**
   * Atualiza configuração de um gateway (Super Admin)
   */
  async updateConfig(
    gateway: PaymentGateway,
    data: Partial<PaymentConfig>,
  ): Promise<PaymentConfig> {
    let config = await this.configRepository.findOne({ where: { gateway } });
    
    if (!config) {
      config = this.configRepository.create({ gateway });
    }

    Object.assign(config, data);
    const saved = await this.configRepository.save(config);

    // Reinicializar gateway se estiver habilitado
    if (saved.enabled) {
      const gatewayInstance = this.gateways.get(gateway);
      if (gatewayInstance) {
        gatewayInstance.initialize({
          publicKey: saved.publicKey,
          accessToken: saved.accessToken,
          secretKey: saved.secretKey,
          sandbox: saved.sandbox,
        });
      }
    }

    this.logger.log(`✅ Configuração do gateway ${gateway} atualizada`);
    return saved;
  }

  /**
   * Cria checkout para upgrade de plano
   */
  async createPlanCheckout(
    tenantId: string,
    targetPlan: TenantPlano,
    billingCycle: BillingCycle,
    gateway: PaymentGateway,
    customerData: { email: string; name: string; document?: string },
    urls: { success: string; failure: string; webhook: string },
  ): Promise<PaymentResult> {
    // Validar tenant
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // Validar gateway
    const config = await this.configRepository.findOne({
      where: { gateway, enabled: true },
    });
    if (!config) {
      throw new BadRequestException(`Gateway ${gateway} não está disponível`);
    }

    // Calcular preço
    const prices = PLAN_PRICES[targetPlan];
    const price = billingCycle === BillingCycle.MONTHLY ? prices.monthly : prices.yearly;

    if (price === 0) {
      throw new BadRequestException('Plano FREE não requer pagamento');
    }

    // Criar transação pendente
    const transaction = this.transactionRepository.create({
      tenantId,
      gateway,
      type: TransactionType.UPGRADE,
      status: TransactionStatus.PENDING,
      amount: price,
      description: `Upgrade para plano ${targetPlan} (${billingCycle})`,
      metadata: { targetPlan, billingCycle },
    });
    await this.transactionRepository.save(transaction);

    // Criar pagamento no gateway
    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new BadRequestException('Gateway não configurado');
    }

    gatewayInstance.initialize({
      publicKey: config.publicKey,
      accessToken: config.accessToken,
      secretKey: config.secretKey,
      sandbox: config.sandbox,
    });

    const paymentData: CreatePaymentData = {
      customer: customerData,
      amount: price,
      description: `PubSystem - Plano ${targetPlan} (${billingCycle === 'monthly' ? 'Mensal' : 'Anual'})`,
      metadata: {
        externalReference: transaction.id,
        tenantId,
        targetPlan,
        billingCycle,
        webhookUrl: urls.webhook,
      },
      successUrl: urls.success,
      failureUrl: urls.failure,
    };

    const result = await gatewayInstance.createPayment(paymentData);

    // Atualizar transação com ID externo
    if (result.success && result.paymentId) {
      transaction.externalPaymentId = result.paymentId;
      await this.transactionRepository.save(transaction);
    }

    return result;
  }

  /**
   * Cria assinatura recorrente
   */
  async createSubscription(
    tenantId: string,
    targetPlan: TenantPlano,
    billingCycle: BillingCycle,
    gateway: PaymentGateway,
    customerData: { email: string; name: string; document?: string },
    urls: { back: string; webhook: string },
  ): Promise<SubscriptionResult> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const config = await this.configRepository.findOne({
      where: { gateway, enabled: true },
    });
    if (!config) {
      throw new BadRequestException(`Gateway ${gateway} não está disponível`);
    }

    const prices = PLAN_PRICES[targetPlan];
    const price = billingCycle === BillingCycle.MONTHLY ? prices.monthly : prices.yearly;

    if (price === 0) {
      throw new BadRequestException('Plano FREE não requer assinatura');
    }

    // Criar registro de assinatura
    const subscription = this.subscriptionRepository.create({
      tenantId,
      plano: targetPlan,
      status: SubscriptionStatus.PENDING,
      billingCycle,
      gateway,
      price,
    });
    await this.subscriptionRepository.save(subscription);

    // Criar assinatura no gateway
    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new BadRequestException('Gateway não configurado');
    }

    gatewayInstance.initialize({
      publicKey: config.publicKey,
      accessToken: config.accessToken,
      secretKey: config.secretKey,
      sandbox: config.sandbox,
    });

    const subscriptionData: CreateSubscriptionData = {
      customer: customerData,
      planId: targetPlan,
      planName: `PubSystem - Plano ${targetPlan}`,
      price,
      billingCycle: billingCycle === BillingCycle.MONTHLY ? 'monthly' : 'yearly',
      metadata: {
        externalReference: subscription.id,
        tenantId,
        backUrl: urls.back,
        webhookUrl: urls.webhook,
      },
    };

    const result = await gatewayInstance.createSubscription(subscriptionData);

    if (result.success && result.subscriptionId) {
      subscription.externalSubscriptionId = result.subscriptionId;
      subscription.externalCustomerId = result.customerId;
      await this.subscriptionRepository.save(subscription);
    }

    return result;
  }

  /**
   * Processa webhook de pagamento
   */
  async processWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature?: string,
  ): Promise<void> {
    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new BadRequestException('Gateway não encontrado');
    }

    // Inicializar gateway
    const config = await this.configRepository.findOne({ where: { gateway } });
    if (config) {
      gatewayInstance.initialize({
        publicKey: config.publicKey,
        accessToken: config.accessToken,
        secretKey: config.secretKey,
        sandbox: config.sandbox,
      });
    }

    // Validar assinatura
    if (signature && !gatewayInstance.validateWebhookSignature(payload, signature)) {
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    // Processar webhook
    const webhookData = await gatewayInstance.processWebhook(payload);
    this.logger.log(`📥 Webhook ${gateway}: ${webhookData.event} - ${webhookData.status}`);

    // Atualizar transação se existir
    if (webhookData.paymentId) {
      const transaction = await this.transactionRepository.findOne({
        where: { externalPaymentId: webhookData.paymentId },
      });

      if (transaction) {
        const statusMap: Record<string, TransactionStatus> = {
          approved: TransactionStatus.APPROVED,
          rejected: TransactionStatus.REJECTED,
          pending: TransactionStatus.PENDING,
          in_process: TransactionStatus.IN_PROCESS,
          refunded: TransactionStatus.REFUNDED,
          cancelled: TransactionStatus.CANCELLED,
        };

        transaction.status = statusMap[webhookData.status] || transaction.status;
        transaction.gatewayResponse = webhookData.rawData;
        await this.transactionRepository.save(transaction);

        // Se aprovado, atualizar plano do tenant
        if (transaction.status === TransactionStatus.APPROVED && transaction.metadata?.targetPlan) {
          await this.activatePlan(
            transaction.tenantId,
            transaction.metadata.targetPlan as TenantPlano,
          );
        }
      }
    }

    // Atualizar assinatura se existir
    if (webhookData.subscriptionId) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { externalSubscriptionId: webhookData.subscriptionId },
      });

      if (subscription) {
        const statusMap: Record<string, SubscriptionStatus> = {
          active: SubscriptionStatus.ACTIVE,
          authorized: SubscriptionStatus.ACTIVE,
          pending: SubscriptionStatus.PENDING,
          cancelled: SubscriptionStatus.CANCELLED,
          paused: SubscriptionStatus.CANCELLED,
        };

        const newStatus = statusMap[webhookData.status];
        if (newStatus) {
          subscription.status = newStatus;
          await this.subscriptionRepository.save(subscription);

          // Se ativada, atualizar plano do tenant
          if (newStatus === SubscriptionStatus.ACTIVE) {
            await this.activatePlan(subscription.tenantId, subscription.plano);
          }
        }
      }
    }
  }

  /**
   * Ativa plano do tenant após pagamento aprovado
   */
  private async activatePlan(tenantId: string, plano: TenantPlano): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (tenant) {
      tenant.plano = plano;
      await this.tenantRepository.save(tenant);
      this.logger.log(`✅ Plano ${plano} ativado para tenant ${tenant.nome}`);
    }
  }

  /**
   * Retorna assinatura ativa do tenant
   */
  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retorna histórico de transações do tenant
   */
  async getTransactionHistory(tenantId: string): Promise<PaymentTransaction[]> {
    return this.transactionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(tenantId: string, reason?: string): Promise<void> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada');
    }

    // Cancelar no gateway
    if (subscription.externalSubscriptionId && subscription.gateway) {
      const gatewayInstance = this.gateways.get(subscription.gateway);
      if (gatewayInstance) {
        const config = await this.configRepository.findOne({
          where: { gateway: subscription.gateway },
        });
        if (config) {
          gatewayInstance.initialize({
            publicKey: config.publicKey,
            accessToken: config.accessToken,
            secretKey: config.secretKey,
            sandbox: config.sandbox,
          });
          await gatewayInstance.cancelSubscription(subscription.externalSubscriptionId);
        }
      }
    }

    // Atualizar status local
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    await this.subscriptionRepository.save(subscription);

    this.logger.log(`✅ Assinatura cancelada para tenant ${tenantId}`);
  }
}
