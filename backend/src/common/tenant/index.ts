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

// Gateways
export { BaseTenantGateway } from './gateways/base-tenant.gateway';

// Services
export { TenantProvisioningService, CreateTenantDto, ProvisioningResult } from './services/tenant-provisioning.service';
