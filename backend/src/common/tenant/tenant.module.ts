import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { CloudflareDnsService } from './services/cloudflare-dns.service';
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
    // JwtModule para decodificar tokens no TenantInterceptor
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
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
    CloudflareDnsService,
    // 🏢 Interceptor Global: Captura tenant de subdomínio/URL/JWT
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    // 📊 Logging Interceptor: Adiciona tenant_id em todos os logs HTTP
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantLoggingInterceptor,
    },
    // 🛡️ Guard Global: Bloqueia acesso cross-tenant
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // ⚡ Rate Limiting por Tenant: Limites baseados no plano
    {
      provide: APP_GUARD,
      useClass: TenantRateLimitGuard,
    },
  ],
  exports: [
    TypeOrmModule, // Exportar TypeOrmModule para que os repositories estejam disponíveis
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
    CloudflareDnsService,
  ],
})
export class TenantModule {}
