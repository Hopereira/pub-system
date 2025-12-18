import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { TenantContextService } from '../tenant-context.service';
import { PlanFeaturesService } from '../services/plan-features.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

/**
 * PlanFeaturesController - Endpoint para obter features do plano atual
 * 
 * Usado pelo frontend para:
 * - Esconder/mostrar módulos baseado no plano
 * - Mostrar limites atuais
 * - Sugerir upgrade
 */
@ApiTags('Plan Features')
@ApiBearerAuth()
@Controller('plan')
@UseGuards(JwtAuthGuard)
export class PlanFeaturesController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly planFeaturesService: PlanFeaturesService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Retorna informações do plano atual do tenant
   */
  @Get('features')
  @ApiOperation({ summary: 'Obtém features disponíveis no plano atual' })
  @ApiResponse({ status: 200, description: 'Features retornadas com sucesso' })
  async getFeatures() {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      // Retornar plano FREE como fallback
      return this.planFeaturesService.getPlanInfo('FREE');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'plano', 'nome', 'config'],
    });

    if (!tenant) {
      return this.planFeaturesService.getPlanInfo('FREE');
    }

    const planInfo = this.planFeaturesService.getPlanInfo(tenant.plano);

    return {
      ...planInfo,
      tenantId: tenant.id,
      tenantNome: tenant.nome,
      // Limites customizados do tenant (se houver)
      customLimits: tenant.config || {},
    };
  }

  /**
   * Retorna comparação entre planos para upgrade
   */
  @Get('compare')
  @ApiOperation({ summary: 'Compara planos para upgrade' })
  @ApiResponse({ status: 200, description: 'Comparação retornada com sucesso' })
  async comparePlans() {
    const tenantId = this.tenantContext.getTenantId();
    let currentPlano = 'FREE';

    if (tenantId) {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        select: ['plano'],
      });
      if (tenant) {
        currentPlano = tenant.plano;
      }
    }

    const planos = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const comparison = planos.map((plano) => ({
      plano,
      isCurrent: plano === currentPlano,
      ...this.planFeaturesService.getPlanInfo(plano),
      upgradeFeatures:
        plano !== currentPlano
          ? this.planFeaturesService.getUpgradeFeatures(currentPlano, plano)
          : [],
    }));

    return {
      currentPlano,
      planos: comparison,
    };
  }
}
