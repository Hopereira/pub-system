import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentConfig } from './entities/payment-config.entity';
import { Subscription } from './entities/subscription.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Tenant } from '../../common/tenant/entities/tenant.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MercadoPagoGateway } from './gateways/mercado-pago.gateway';
import { PagSeguroGateway } from './gateways/pagseguro.gateway';
import { PicPayGateway } from './gateways/picpay.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentConfig,
      Subscription,
      PaymentTransaction,
      Tenant,
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MercadoPagoGateway,
    PagSeguroGateway,
    PicPayGateway,
  ],
  exports: [PaymentService],
})
export class PaymentModule implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) {}

  async onModuleInit() {
    // Inicializar gateways ao iniciar o módulo
    await this.paymentService.initializeGateways();
  }
}
