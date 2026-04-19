import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../../auth/decorators/public.decorator';
import { TenantContextService } from '../tenant-context.service';
import { PlanFeaturesService, Feature } from '../services/plan-features.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { Empresa } from '../../../modulos/empresa/entities/empresa.entity';

/**
 * Decorator para marcar rotas que requerem uma feature específica
 * 
 * @example
 * @RequireFeature(Feature.ANALYTICS)
 * @Get('analytics/dashboard')
 * getAnalytics() {}
 */
export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const RequireFeature = (...features: Feature[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, features);

/**
 * FeatureGuard - Verifica se o tenant tem acesso a uma feature
 * 
 * Usado em conjunto com o decorator @RequireFeature()
 * Bloqueia acesso se o plano do tenant não inclui a feature
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
    private readonly planFeaturesService: PlanFeaturesService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública - rotas públicas não precisam de verificação de feature
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.logger.debug('FeatureGuard: Rota pública, permitindo acesso');
      return true;
    }

    // Verificar se é SUPER_ADMIN - tem acesso total
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user?.cargo === 'SUPER_ADMIN') {
      return true;
    }

    // Obter features requeridas do decorator
    const requiredFeatures = this.reflector.getAllAndOverride<Feature[]>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há features requeridas, permitir acesso
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    // Obter tenantId do contexto ou do JWT do usuário
    let tenantId = this.tenantContext.getTenantIdOrNull();

    // Se não há tenant no contexto, tentar obter do JWT
    if (!tenantId && user?.tenantId) {
      tenantId = user.tenantId;
      this.logger.debug(`FeatureGuard: Usando tenantId do JWT: ${tenantId}`);
    }

    if (!tenantId) {
      // Se não há tenant e não há usuário, bloquear
      if (!user) {
        this.logger.warn('🚫 FeatureGuard: Sem tenantId no contexto e sem usuário');
        throw new ForbiddenException('Tenant não identificado');
      }
      // Usuário autenticado sem tenant (pode ser SUPER_ADMIN que já foi verificado acima)
      this.logger.debug('FeatureGuard: Usuário autenticado sem tenant, permitindo acesso');
      return true;
    }

    // Buscar plano do tenant
    let tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'plano', 'nome'],
    });

    // Fallback: se não encontrou na tabela tenants, buscar empresa pelo tenantId
    if (!tenant) {
      const empresa = await this.empresaRepository.findOne({
        where: { tenantId },
        select: ['tenantId'],
      });
      
      if (empresa?.tenantId) {
        tenant = await this.tenantRepository.findOne({
          where: { id: empresa.tenantId },
          select: ['id', 'plano', 'nome'],
        });
      }
    }

    // Fallback: buscar empresa pelo id (caso tenantId seja empresaId)
    if (!tenant) {
      const empresa = await this.empresaRepository.findOne({
        where: { id: tenantId },
        select: ['tenantId'],
      });
      
      if (empresa?.tenantId) {
        tenant = await this.tenantRepository.findOne({
          where: { id: empresa.tenantId },
          select: ['id', 'plano', 'nome'],
        });
      }
    }

    if (!tenant) {
      this.logger.warn(`🚫 FeatureGuard: Tenant não encontrado para id: ${tenantId}`);
      throw new ForbiddenException('Tenant não encontrado');
    }

    // Verificar cada feature requerida (usando features do banco de dados)
    for (const feature of requiredFeatures) {
      const allowed = await this.planFeaturesService.hasFeatureFromDb(tenant.plano, feature);
      if (!allowed) {
        this.logger.warn(
          `🚫 Feature "${feature}" bloqueada para tenant "${tenant.nome}" (plano: ${tenant.plano})`,
        );
        throw new ForbiddenException(
          `A funcionalidade "${feature}" não está disponível no plano ${tenant.plano}. ` +
          `Faça upgrade para ter acesso.`,
        );
      }
    }

    return true;
  }
}
