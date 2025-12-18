import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

/**
 * TenantModule - Módulo global para Multi-tenancy
 * 
 * Este módulo é marcado como @Global para que o TenantContextService
 * esteja disponível em toda a aplicação sem necessidade de importação explícita.
 * 
 * O TenantContextService tem escopo REQUEST, então cada requisição HTTP
 * terá sua própria instância isolada.
 */
@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantModule {}
