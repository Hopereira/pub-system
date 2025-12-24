import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { PaymentService } from './payment.service';
import { PaymentGateway } from './entities/payment-config.entity';
import { BillingCycle } from './entities/subscription.entity';
import { TenantPlano } from '../../common/tenant/entities/tenant.entity';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * DTO para criar checkout
 */
class CreateCheckoutDto {
  targetPlan: TenantPlano;
  billingCycle: BillingCycle;
  gateway: PaymentGateway;
  customer: {
    email: string;
    name: string;
    document?: string;
  };
}

/**
 * DTO para atualizar configuração de gateway
 */
class UpdateGatewayConfigDto {
  enabled?: boolean;
  sandbox?: boolean;
  publicKey?: string;
  accessToken?: string;
  secretKey?: string;
  webhookSecret?: string;
  displayName?: string;
  logoUrl?: string;
  additionalConfig?: Record<string, any>;
}

@ApiTags('Pagamentos')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // ==========================================
  // ENDPOINTS PÚBLICOS (Webhooks)
  // ==========================================

  @Public()
  @Post('webhooks/:gateway')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook para receber notificações dos gateways' })
  @ApiParam({ name: 'gateway', enum: PaymentGateway })
  async handleWebhook(
    @Param('gateway') gateway: PaymentGateway,
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
    @Headers('x-picpay-token') picpayToken?: string,
  ) {
    await this.paymentService.processWebhook(
      gateway,
      payload,
      signature || picpayToken,
    );
    return { received: true };
  }

  // ==========================================
  // ENDPOINTS PARA TENANT ADMIN
  // ==========================================

  @Get('gateways')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista gateways de pagamento disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de gateways' })
  async getAvailableGateways() {
    return this.paymentService.getAvailableGateways();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria checkout para upgrade de plano' })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({ status: 200, description: 'Checkout criado' })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant não identificado');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return this.paymentService.createPlanCheckout(
      tenantId,
      dto.targetPlan,
      dto.billingCycle,
      dto.gateway,
      dto.customer,
      {
        success: `${frontendUrl}/dashboard/configuracoes/plano?status=success`,
        failure: `${frontendUrl}/dashboard/configuracoes/plano?status=failure`,
        webhook: `${baseUrl}/payments/webhooks/${dto.gateway}`,
      },
    );
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria assinatura recorrente' })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({ status: 200, description: 'Assinatura criada' })
  async createSubscription(
    @Body() dto: CreateCheckoutDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant não identificado');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return this.paymentService.createSubscription(
      tenantId,
      dto.targetPlan,
      dto.billingCycle,
      dto.gateway,
      dto.customer,
      {
        back: `${frontendUrl}/dashboard/configuracoes/plano`,
        webhook: `${baseUrl}/payments/webhooks/${dto.gateway}`,
      },
    );
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna assinatura ativa do tenant' })
  @ApiResponse({ status: 200, description: 'Assinatura ativa' })
  async getActiveSubscription() {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      return null;
    }
    return this.paymentService.getActiveSubscription(tenantId);
  }

  @Post('subscription/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela assinatura ativa' })
  @ApiResponse({ status: 200, description: 'Assinatura cancelada' })
  async cancelSubscription(@Body('reason') reason?: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant não identificado');
    }
    await this.paymentService.cancelSubscription(tenantId, reason);
    return { success: true };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico de transações do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de transações' })
  async getTransactionHistory() {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }
    return this.paymentService.getTransactionHistory(tenantId);
  }

  // ==========================================
  // ENDPOINTS PARA SUPER ADMIN
  // ==========================================

  @Get('admin/configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Super Admin] Lista todas as configurações de gateway' })
  @ApiResponse({ status: 200, description: 'Configurações dos gateways' })
  async getAllConfigs() {
    return this.paymentService.getAllConfigs();
  }

  @Put('admin/configs/:gateway')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Super Admin] Atualiza configuração de um gateway' })
  @ApiParam({ name: 'gateway', enum: PaymentGateway })
  @ApiBody({ type: UpdateGatewayConfigDto })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  async updateConfig(
    @Param('gateway') gateway: PaymentGateway,
    @Body() dto: UpdateGatewayConfigDto,
  ) {
    return this.paymentService.updateConfig(gateway, dto);
  }
}
