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
