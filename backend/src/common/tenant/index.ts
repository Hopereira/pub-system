// Tenant Module - Multi-tenancy para SaaS
export { TenantModule } from './tenant.module';
export { TenantContextService } from './tenant-context.service';
export { TenantResolverService, ResolvedTenant, TenantSource } from './tenant-resolver.service';
export { TenantInterceptor } from './tenant.interceptor';
export { TenantLoggingInterceptor } from './tenant-logging.interceptor';
export {
  TenantId,
  createTenantId,
  isValidTenantId,
  ITenantContext,
  TenantNotSetError,
} from './tenant.types';

// Entidades
export { Tenant, TenantStatus, TenantPlano, TenantConfig } from './entities/tenant.entity';
export { TenantAwareEntity } from './entities/tenant-aware.entity';

// Repositório Base
export { BaseTenantRepository, TenantAwareEntity as ITenantAwareEntity } from './repositories/base-tenant.repository';

// Guards
export { TenantGuard, SkipTenantGuard, SKIP_TENANT_GUARD } from './guards/tenant.guard';
export { TenantRateLimitGuard, SkipRateLimit, SKIP_RATE_LIMIT, RATE_LIMITS, RateLimitConfig } from './guards/tenant-rate-limit.guard';
export { FeatureGuard, RequireFeature, REQUIRE_FEATURE_KEY } from './guards/feature.guard';

// Plan Features
export { PlanFeaturesService, Feature, PLAN_FEATURES, PLAN_LIMITS, PlanLimits } from './services/plan-features.service';

// Gateways
export { BaseTenantGateway } from './gateways/base-tenant.gateway';

// Services
export { TenantProvisioningService, CreateTenantDto, ProvisioningResult } from './services/tenant-provisioning.service';

// RLS (Row Level Security)
export { TenantRlsSubscriber } from './tenant-rls.subscriber';
export { TenantRlsMiddleware } from './tenant-rls.middleware';
