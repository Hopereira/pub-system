import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextService } from './tenant-context.service';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantLoggingInterceptor } from './tenant-logging.interceptor';
import { Empresa } from '../../modulos/empresa/entities/empresa.entity';
import { Tenant } from './entities/tenant.entity';

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
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Empresa, Tenant])],
  providers: [
    TenantContextService,
    TenantResolverService,
    TenantInterceptor,
    TenantLoggingInterceptor,
  ],
  exports: [
    TenantContextService,
    TenantResolverService,
    TenantInterceptor,
    TenantLoggingInterceptor,
  ],
})
export class TenantModule {}
