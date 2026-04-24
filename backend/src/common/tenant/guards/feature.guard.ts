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
 * 
 * ⚡ PERFORMANCE: Cache in-memory com TTL de 5 min para evitar
 *    lookups repetidos no banco a cada request.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);

  // ⚡ Cache: tenantId → { plano, nome, features[], cachedAt }
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
  private static tenantPlanCache = new Map<string, {
    plano: string;
    nome: string;
    features: Feature[];
    cachedAt: number;
  }>();

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
    private readonly planFeaturesService: PlanFeaturesService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  /**
   * Invalida cache de um tenant específico ou de todos.
   * Útil ao alterar plano de um tenant via SUPER_ADMIN.
   */
  static invalidateCache(tenantId?: string): void {
    if (tenantId) {
      FeatureGuard.tenantPlanCache.delete(tenantId);
    } else {
      FeatureGuard.tenantPlanCache.clear();
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública - rotas públicas não precisam de verificação de feature
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
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
    }

    if (!tenantId) {
      // Se não há tenant e não há usuário, bloquear
      if (!user) {
        this.logger.warn('🚫 FeatureGuard: Sem tenantId no contexto e sem usuário');
        throw new ForbiddenException('Tenant não identificado');
      }
      // Usuário autenticado sem tenant (pode ser SUPER_ADMIN que já foi verificado acima)
      return true;
    }

    // ⚡ Tentar buscar do cache
    const cached = FeatureGuard.tenantPlanCache.get(tenantId);
    if (cached && (Date.now() - cached.cachedAt) < FeatureGuard.CACHE_TTL_MS) {
      // Cache hit — verificar features direto na memória
      for (const feature of requiredFeatures) {
        if (!cached.features.includes(feature)) {
          this.logger.warn(
            `🚫 Feature "${feature}" bloqueada para tenant "${cached.nome}" (plano: ${cached.plano}) [cached]`,
          );
          throw new ForbiddenException(
            `A funcionalidade "${feature}" não está disponível no plano ${cached.plano}. ` +
            `Faça upgrade para ter acesso.`,
          );
        }
      }
      return true;
    }

    // Cache miss — buscar do banco
    const tenantData = await this.resolveTenantPlan(tenantId);

    if (!tenantData) {
      this.logger.warn(`🚫 FeatureGuard: Tenant não encontrado para id: ${tenantId}`);
      throw new ForbiddenException('Tenant não encontrado');
    }

    // Buscar features do plano (banco → fallback hardcoded)
    const features = await this.planFeaturesService.getFeaturesFromDb(tenantData.plano);

    // Salvar no cache
    FeatureGuard.tenantPlanCache.set(tenantId, {
      plano: tenantData.plano,
      nome: tenantData.nome,
      features,
      cachedAt: Date.now(),
    });

    // Verificar cada feature requerida
    for (const feature of requiredFeatures) {
      if (!features.includes(feature)) {
        this.logger.warn(
          `🚫 Feature "${feature}" bloqueada para tenant "${tenantData.nome}" (plano: ${tenantData.plano})`,
        );
        throw new ForbiddenException(
          `A funcionalidade "${feature}" não está disponível no plano ${tenantData.plano}. ` +
          `Faça upgrade para ter acesso.`,
        );
      }
    }

    return true;
  }

  /**
   * Resolve plano do tenant com fallbacks (empresa → empresaId).
   * Retorna { plano, nome } ou null.
   */
  private async resolveTenantPlan(tenantId: string): Promise<{ plano: string; nome: string } | null> {
    // Tentativa 1: buscar direto na tabela tenants
    let tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'plano', 'nome'],
    });
    if (tenant) return { plano: tenant.plano, nome: tenant.nome };

    // Fallback 2: buscar empresa pelo tenantId
    const empresa = await this.empresaRepository.findOne({
      where: { tenantId },
      select: ['tenantId'],
    });
    if (empresa?.tenantId) {
      tenant = await this.tenantRepository.findOne({
        where: { id: empresa.tenantId },
        select: ['id', 'plano', 'nome'],
      });
      if (tenant) return { plano: tenant.plano, nome: tenant.nome };
    }

    // Fallback 3: buscar empresa pelo id (caso tenantId seja empresaId)
    const empresa2 = await this.empresaRepository.findOne({
      where: { id: tenantId },
      select: ['tenantId'],
    });
    if (empresa2?.tenantId) {
      tenant = await this.tenantRepository.findOne({
        where: { id: empresa2.tenantId },
        select: ['id', 'plano', 'nome'],
      });
      if (tenant) return { plano: tenant.plano, nome: tenant.nome };
    }

    return null;
  }
}
