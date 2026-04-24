import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { TenantResolverService, TenantSource } from './tenant-resolver.service';
import { JwtService } from '@nestjs/jwt';
import { REQUIRES_TENANT_KEY } from '../../auth/decorators/public.decorator';

/**
 * TenantInterceptor - Captura Híbrida (Staff vs Cliente)
 * 
 * Identifica automaticamente qual bar está sendo acessado:
 * 
 * 1. **Subdomínio (Staff):** bar-do-ze.pubsystem.com.br
 * 2. **Slug na URL (Cliente via QR Code):** pubsystem.com/menu/bar-do-ze
 * 3. **JWT (Rotas protegidas):** Token contém tenantId
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
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Proteção: Se não tiver request HTTP válido, pular
    if (!request) {
      return next.handle();
    }
    
    const { hostname, path, user, headers } = request;

    // Se o tenant já foi definido (por outro middleware), pular
    // Proteção contra tenantContext undefined
    if (this.tenantContext?.hasTenant?.()) {
      return next.handle();
    }

    // Proteção: Se tenantResolver não estiver disponível, pular
    if (!this.tenantResolver) {
      return next.handle();
    }

    try {
      const cookies = request?.cookies ?? {};
      const resolved = await this.resolveTenant(hostname, path, user, headers, cookies);
      
      if (resolved) {
        const { tenant, source } = resolved;
        
        // Validar se JWT tenant coincide com URL tenant (segurança)
        const userTenantId = user?.tenantId;
        if (userTenantId && tenant.id !== userTenantId) {
          this.logger?.warn?.(
            `⚠️ Mismatch de tenant! JWT: ${userTenantId}, URL: ${tenant.id}`
          );
          throw new UnauthorizedException(
            'Acesso negado: você não tem permissão para acessar este estabelecimento'
          );
        }

        // Sempre popular request.tenant ANTES de setTenantId (garante UUID disponível
        // mesmo que TenantContextService falhe ou já esteja bloqueado)
        request.tenant = tenant;
        request.tenantSource = source;

        // Definir contexto do tenant (pode falhar se já bloqueado, não é crítico)
        try {
          this.tenantContext?.setTenantId?.(tenant.id, tenant.nomeFantasia);
        } catch {
          // TenantContextService já bloqueado — request.tenant.id é a fonte autoritativa
        }

        this.logger?.debug?.(
          `🏢 Tenant definido via ${source}: ${tenant.nomeFantasia} (${tenant.id})`
        );
      }
    } catch (error) {
      // Verificar se a rota exige tenant (@PublicWithTenant)
      const requiresTenant = this.reflector.getAllAndOverride<boolean>(
        REQUIRES_TENANT_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiresTenant) {
        // Rota exige tenant mas não foi possível resolver
        throw new BadRequestException(
          'Estabelecimento não identificado. Verifique a URL ou o header X-Tenant-ID.'
        );
      }

      // Para rotas públicas normais, não propagar erro de tenant não encontrado
      // Apenas logar e continuar - o service decidirá o que fazer
      this.logger?.debug?.(`Tenant não identificado: ${error?.message}`);
      // NÃO propagar erro 404 - deixar a rota decidir se precisa de tenant
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
    cookies: Record<string, string>,
  ): Promise<{ tenant: any; source: TenantSource } | null> {
    
    // 1. Tentar subdomínio primeiro (staff)
    const subdomainSlug = this.tenantResolver?.extractSlugFromHostname?.(hostname);
    if (subdomainSlug) {
      this.logger?.debug?.(`📍 Slug detectado no subdomínio: ${subdomainSlug}`);
      const tenant = await this.tenantResolver.resolveBySlug(subdomainSlug);
      return { tenant, source: 'subdomain' };
    }

    // 2. Tentar slug na URL (cliente via QR Code)
    const pathSlug = this.tenantResolver?.extractSlugFromPath?.(path);
    if (pathSlug) {
      this.logger?.debug?.(`📍 Slug detectado na URL: ${pathSlug}`);
      const tenant = await this.tenantResolver.resolveBySlug(pathSlug);
      return { tenant, source: 'slug' };
    }

    // 3. Tentar JWT (rotas protegidas) - usar apenas tenantId
    let jwtTenantId = user?.tenantId;
    
    // Se user não estiver disponível, verificar JWT do header ou cookie
    if (!jwtTenantId) {
      // Tentar Bearer header primeiro
      if (headers?.authorization) {
        const decoded = this.decodeJwtFromHeader(headers.authorization);
        jwtTenantId = decoded?.tenantId;
      }
      // Fallback: tentar access_token cookie (httpOnly)
      if (!jwtTenantId && cookies?.['access_token']) {
        const decoded = this.verifyJwt(cookies['access_token']);
        jwtTenantId = decoded?.tenantId;
      }
    }
    
    if (jwtTenantId) {
      this.logger?.log?.(`🏢 Resolvendo tenant: ${jwtTenantId}`);
      const tenant = await this.tenantResolver.resolveById(jwtTenantId);
      this.logger?.log?.(`✅ Tenant resolvido: ${tenant?.nomeFantasia}`);
      return { tenant, source: 'jwt' };
    }

    // 4. Tentar header X-Tenant-ID (API externa ou rotas públicas)
    const headerTenantId = headers?.['x-tenant-id'];
    this.logger?.log?.(`🔍 Header X-Tenant-ID: ${headerTenantId || 'NÃO ENVIADO'}`);
    if (headerTenantId) {
      this.logger?.log?.(`📍 Tenant detectado no header: ${headerTenantId}`);
      // Verificar se é UUID ou slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(headerTenantId);
      this.logger?.log?.(`📍 É UUID? ${isUuid}`);
      const tenant = isUuid 
        ? await this.tenantResolver.resolveById(headerTenantId)
        : await this.tenantResolver.resolveBySlug(headerTenantId);
      this.logger?.log?.(`✅ Tenant resolvido via header: ${tenant?.nomeFantasia} (${tenant?.id})`);
      return { tenant, source: 'header' };
    }

    // Nenhum tenant identificado (pode ser rota pública global)
    return null;
  }

  /**
   * Verifica JWT de qualquer fonte (cookie ou header) usando jwtService.verify().
   */
  private verifyJwt(token: string): any | null {
    try {
      return this.jwtService?.verify?.(token) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica e decodifica JWT diretamente do header Authorization.
   * Usa verify() (não decode()) para validar assinatura e expiração.
   * Se a verificação falhar, retorna null — o JwtAuthGuard tratará o 401 downstream.
   */
  private decodeJwtFromHeader(authHeader: string): any | null {
    try {
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }
      const token = authHeader.substring(7); // Remove 'Bearer '
      // SECURITY: verify() valida assinatura + expiração (decode() não fazia isso)
      const verified = this.jwtService?.verify?.(token);
      return verified ?? null;
    } catch (error) {
      // Token expirado, assinatura inválida, etc. — não é crítico aqui,
      // o JwtAuthGuard retornará 401 se a rota exigir autenticação.
      this.logger?.debug?.(`JWT não verificado no interceptor (esperado para tokens expirados): ${error?.message}`);
      return null;
    }
  }
}
