import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { SuperAdminService } from '../services/super-admin.service';
import { TenantProvisioningService, CreateTenantDto } from '../services/tenant-provisioning.service';
import { PasswordResetService } from '../../../auth/password-reset.service';
import { EmailService } from '../../../common/email/email.service';
import { PasswordResetType } from '../../../auth/entities/password-reset.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipTenantGuard } from '../guards/tenant.guard';
import { SkipRateLimit } from '../guards/tenant-rate-limit.guard';

/**
 * SuperAdminController - Endpoints para gestão da plataforma
 * 
 * Todos os endpoints requerem:
 * 1. Autenticação JWT
 * 2. Cargo SUPER_ADMIN
 * 
 * Os endpoints ignoram o filtro de tenant (SkipTenantGuard)
 */
@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard)
@SkipTenantGuard()
@SkipRateLimit()
@SkipThrottle()
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly provisioningService: TenantProvisioningService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Verifica se o usuário é SUPER_ADMIN
   */
  private checkSuperAdmin(user: any): void {
    if (user.cargo !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Acesso negado. Apenas SUPER_ADMIN pode acessar este recurso.',
      );
    }
  }

  /**
   * Métricas globais da plataforma
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Obtém métricas globais da plataforma' })
  @ApiResponse({ status: 200, description: 'Métricas retornadas com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getMetrics(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.superAdminService.getPlatformMetrics();
  }

  /**
   * Lista todos os tenants
   */
  @Get('tenants')
  @ApiOperation({ summary: 'Lista todos os tenants da plataforma' })
  @ApiResponse({ status: 200, description: 'Lista de tenants' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async listTenants(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.superAdminService.listTenants();
  }

  /**
   * Detalhes de um tenant específico
   */
  @Get('tenants/:id')
  @ApiOperation({ summary: 'Obtém detalhes de um tenant' })
  @ApiResponse({ status: 200, description: 'Detalhes do tenant' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async getTenantDetails(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    return this.superAdminService.getTenantDetails(id);
  }

  /**
   * Cria um novo tenant (provisioning)
   */
  @Post('tenants')
  @ApiOperation({ summary: 'Cria um novo tenant' })
  @ApiResponse({ status: 201, description: 'Tenant criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Slug já em uso' })
  async createTenant(@CurrentUser() user: any, @Body() dto: CreateTenantDto) {
    this.checkSuperAdmin(user);
    return this.provisioningService.provisionTenant(dto);
  }

  /**
   * Suspende um tenant
   */
  @Post('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspende um tenant' })
  @ApiResponse({ status: 200, description: 'Tenant suspenso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async suspendTenant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    this.checkSuperAdmin(user);
    return this.superAdminService.suspendTenant(id, motivo);
  }

  /**
   * Reativa um tenant suspenso
   */
  @Post('tenants/:id/reactivate')
  @ApiOperation({ summary: 'Reativa um tenant suspenso' })
  @ApiResponse({ status: 200, description: 'Tenant reativado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async reactivateTenant(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    return this.superAdminService.reactivateTenant(id);
  }

  /**
   * Altera o plano de um tenant
   */
  @Patch('tenants/:id/plan')
  @ApiOperation({ summary: 'Altera o plano de um tenant' })
  @ApiResponse({ status: 200, description: 'Plano alterado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async changePlan(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('plano') plano: string,
  ) {
    this.checkSuperAdmin(user);
    return this.superAdminService.changeTenantPlan(id, plano);
  }

  /**
   * Verifica disponibilidade de slug
   */
  @Get('slugs/:slug/available')
  @ApiOperation({ summary: 'Verifica se um slug está disponível' })
  @ApiResponse({ status: 200, description: 'Disponibilidade verificada' })
  async checkSlugAvailability(@CurrentUser() user: any, @Param('slug') slug: string) {
    this.checkSuperAdmin(user);
    const available = await this.provisioningService.isSlugAvailable(slug);
    const suggestions = available ? [] : await this.provisioningService.suggestSlugs(slug);
    return { slug, available, suggestions };
  }

  /**
   * Atualiza dados de um tenant
   */
  @Put('tenants/:id')
  @ApiOperation({ summary: 'Atualiza dados de um tenant' })
  @ApiResponse({ status: 200, description: 'Tenant atualizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async updateTenant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { nome?: string; cnpj?: string; config?: any },
  ) {
    this.checkSuperAdmin(user);
    return this.superAdminService.updateTenant(id, data);
  }

  /**
   * Reseta a senha do admin de um tenant
   */
  @Post('tenants/:id/reset-admin-password')
  @ApiOperation({ summary: 'Reseta a senha do admin de um tenant' })
  @ApiResponse({ status: 200, description: 'Senha resetada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tenant ou admin não encontrado' })
  async resetAdminPassword(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('novaSenha') novaSenha: string,
  ) {
    this.checkSuperAdmin(user);
    return this.superAdminService.resetAdminPassword(id, novaSenha);
  }

  /**
   * Lista funcionários de um tenant
   */
  @Get('tenants/:id/funcionarios')
  @ApiOperation({ summary: 'Lista funcionários de um tenant' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async listTenantFuncionarios(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    return this.superAdminService.listTenantFuncionarios(id);
  }

  /**
   * Deleta um tenant (soft delete - muda status para INATIVO)
   */
  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Deleta um tenant (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tenant deletado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async deleteTenant(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    return this.superAdminService.deleteTenant(id);
  }

  /**
   * Reenvia email de boas-vindas para o admin de um tenant
   */
  @Post('tenants/:id/resend-welcome-email')
  @ApiOperation({ summary: 'Reenvia email de boas-vindas' })
  @ApiResponse({ status: 200, description: 'Email reenviado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async resendWelcomeEmail(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    const details = await this.superAdminService.getTenantDetails(id);
    if (!details.admin) {
      return { success: false, error: 'Admin não encontrado para este tenant' };
    }
    const result = await this.emailService.sendWelcomeEmail({
      to: details.admin.email,
      nomeEstabelecimento: details.nome,
      slug: details.slug,
      nomeAdmin: details.admin.nome,
    });
    return { success: true, emailStatus: result.status };
  }

  /**
   * Gera link de definição de senha para um funcionário de um tenant
   */
  @Post('tenants/:id/generate-password-link')
  @ApiOperation({ summary: 'Gera link de definição de senha para o admin' })
  @ApiResponse({ status: 200, description: 'Link gerado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async generatePasswordLink(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('funcionarioId') funcionarioId?: string,
  ) {
    this.checkSuperAdmin(user);
    const details = await this.superAdminService.getTenantDetails(id);

    let targetId = funcionarioId;
    if (!targetId) {
      if (!details.admin) {
        return { success: false, error: 'Admin não encontrado' };
      }
      targetId = details.admin.id;
    }

    const { url, emailSent } = await this.passwordResetService.sendResetEmail(
      targetId,
      PasswordResetType.SETUP,
    );
    return { success: true, url, emailSent };
  }

  /**
   * Hard delete - Remove completamente um tenant e todos os dados
   * CUIDADO: Esta ação é irreversível!
   */
  @Delete('tenants/:id/hard')
  @ApiOperation({ summary: 'Remove permanentemente um tenant e todos os dados (IRREVERSÍVEL)' })
  @ApiResponse({ status: 200, description: 'Tenant removido permanentemente' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async hardDeleteTenant(@CurrentUser() user: any, @Param('id') id: string) {
    this.checkSuperAdmin(user);
    return this.superAdminService.hardDeleteTenant(id);
  }
}
