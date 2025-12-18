import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { TenantResolverService, TenantSource } from './tenant-resolver.service';

/**
 * TenantInterceptor - Captura Híbrida (Staff vs Cliente)
 * 
 * Identifica automaticamente qual bar está sendo acessado:
 * 
 * 1. **Subdomínio (Staff):** bar-do-ze.pubsystem.com.br
 * 2. **Slug na URL (Cliente via QR Code):** pubsystem.com/menu/bar-do-ze
 * 3. **JWT (Rotas protegidas):** Token contém empresaId
 * 4. **Header X-Tenant-ID (API):** Para integrações externas
 * 
 * Prioridade de resolução:
 * 1. Subdomínio (mais específico)
 * 2. Slug na URL
 * 3. JWT payload
 * 4. Header X-Tenant-ID
 * 
 * Para rotas protegidas, valida se o tenant do JWT coincide com o da URL.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantResolver: TenantResolverService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { hostname, path, user, headers } = request;

    // Se o tenant já foi definido (por outro middleware), pular
    if (this.tenantContext.hasTenant()) {
      return next.handle();
    }

    try {
      const resolved = await this.resolveTenant(hostname, path, user, headers);
      
      if (resolved) {
        const { tenant, source } = resolved;
        
        // Validar se JWT tenant coincide com URL tenant (segurança)
        if (user?.empresaId && tenant.id !== user.empresaId) {
          this.logger.warn(
            `⚠️ Mismatch de tenant! JWT: ${user.empresaId}, URL: ${tenant.id}`
          );
          throw new UnauthorizedException(
            'Acesso negado: você não tem permissão para acessar este estabelecimento'
          );
        }

        // Definir contexto do tenant
        this.tenantContext.setTenantId(tenant.id, tenant.nomeFantasia);
        
        // Adicionar informações ao request para uso posterior
        request.tenant = tenant;
        request.tenantSource = source;

        this.logger.debug(
          `🏢 Tenant definido via ${source}: ${tenant.nomeFantasia} (${tenant.id})`
        );
      }
    } catch (error) {
      // Se for erro de tenant não encontrado, deixar propagar
      if (error.status === 404 || error.status === 401) {
        throw error;
      }
      // Outros erros, logar e continuar (pode ser rota pública sem tenant)
      this.logger.debug(`Tenant não identificado: ${error.message}`);
    }

    return next.handle();
  }

  /**
   * Resolve o tenant usando múltiplas fontes (híbrido)
   */
  private async resolveTenant(
    hostname: string,
    path: string,
    user: any,
    headers: Record<string, string>,
  ): Promise<{ tenant: any; source: TenantSource } | null> {
    
    // 1. Tentar subdomínio primeiro (staff)
    const subdomainSlug = this.tenantResolver.extractSlugFromHostname(hostname);
    if (subdomainSlug) {
      this.logger.debug(`📍 Slug detectado no subdomínio: ${subdomainSlug}`);
      const tenant = await this.tenantResolver.resolveBySlug(subdomainSlug);
      return { tenant, source: 'subdomain' };
    }

    // 2. Tentar slug na URL (cliente via QR Code)
    const pathSlug = this.tenantResolver.extractSlugFromPath(path);
    if (pathSlug) {
      this.logger.debug(`📍 Slug detectado na URL: ${pathSlug}`);
      const tenant = await this.tenantResolver.resolveBySlug(pathSlug);
      return { tenant, source: 'slug' };
    }

    // 3. Tentar JWT (rotas protegidas)
    if (user?.empresaId) {
      this.logger.debug(`📍 Tenant detectado no JWT: ${user.empresaId}`);
      const tenant = await this.tenantResolver.resolveById(user.empresaId);
      return { tenant, source: 'jwt' };
    }

    // 4. Tentar header X-Tenant-ID (API externa)
    const headerTenantId = headers['x-tenant-id'];
    if (headerTenantId) {
      this.logger.debug(`📍 Tenant detectado no header: ${headerTenantId}`);
      const tenant = await this.tenantResolver.resolveById(headerTenantId);
      return { tenant, source: 'header' };
    }

    // Nenhum tenant identificado (pode ser rota pública global)
    return null;
  }
}
