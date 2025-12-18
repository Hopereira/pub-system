import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextService } from './tenant-context.service';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantLoggingInterceptor } from './tenant-logging.interceptor';
import { TenantGuard } from './guards/tenant.guard';
import { TenantRateLimitGuard } from './guards/tenant-rate-limit.guard';
import { FeatureGuard } from './guards/feature.guard';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { SuperAdminService } from './services/super-admin.service';
import { PlanFeaturesService } from './services/plan-features.service';
import { SuperAdminController } from './controllers/super-admin.controller';
import { PlanFeaturesController } from './controllers/plan-features.controller';
import { Empresa } from '../../modulos/empresa/entities/empresa.entity';
import { Tenant } from './entities/tenant.entity';
import { Ambiente } from '../../modulos/ambiente/entities/ambiente.entity';
import { Mesa } from '../../modulos/mesa/entities/mesa.entity';
import { Funcionario } from '../../modulos/funcionario/entities/funcionario.entity';
import { Pedido } from '../../modulos/pedido/entities/pedido.entity';
import { Comanda } from '../../modulos/comanda/entities/comanda.entity';

/**
 * TenantModule - Módulo global para Multi-tenancy
 * 
 * Este módulo é marcado como @Global para que os serviços de tenant
 * estejam disponíveis em toda a aplicação sem necessidade de importação explícita.
 * 
 * Serviços:
 * - TenantContextService: Armazena o tenant da requisição atual (Scope.REQUEST)
 * - TenantResolverService: Resolve slugs/IDs para informações do tenant
 * - TenantInterceptor: Captura híbrida (subdomínio + slug + JWT)
 * - TenantLoggingInterceptor: Adiciona tenant_id nos logs
 * - TenantProvisioningService: Automação de criação de novos bares
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, Tenant, Ambiente, Mesa, Funcionario, Pedido, Comanda]),
  ],
  controllers: [SuperAdminController, PlanFeaturesController],
  providers: [
    TenantContextService,
    TenantResolverService,
    TenantInterceptor,
    TenantLoggingInterceptor,
    TenantGuard,
    TenantRateLimitGuard,
    FeatureGuard,
    TenantProvisioningService,
    SuperAdminService,
    PlanFeaturesService,
  ],
  exports: [
    TenantContextService,
    TenantResolverService,
    TenantInterceptor,
    TenantLoggingInterceptor,
    TenantGuard,
    TenantRateLimitGuard,
    FeatureGuard,
    TenantProvisioningService,
    SuperAdminService,
    PlanFeaturesService,
  ],
})
export class TenantModule {}
