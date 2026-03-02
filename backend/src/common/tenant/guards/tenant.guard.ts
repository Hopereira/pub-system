import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../tenant-context.service';

/**
 * Decorator para marcar rotas que não precisam de validação de tenant
 */
export const SKIP_TENANT_GUARD = 'skipTenantGuard';
export const SkipTenantGuard = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(SKIP_TENANT_GUARD, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(SKIP_TENANT_GUARD, true, target);
    return target;
  };
};

/**
 * TenantGuard - Bloqueio de Acesso Cross-Tenant
 * 
 * Este guard impede que um usuário autenticado no Bar A tente acessar
 * recursos do Bar B através de manipulação de URL/subdomínio.
 * 
 * Validações:
 * 1. Compara tenant_id do JWT com tenant_id do contexto (URL/subdomínio)
 * 2. Registra tentativas de violação no log de auditoria
 * 3. Retorna 403 Forbidden em caso de mismatch
 * 
 * @example
 * ```typescript
 * // Aplicar globalmente
 * app.useGlobalGuards(app.get(TenantGuard));
 * 
 * // Ou em controllers específicos
 * @UseGuards(JwtAuthGuard, TenantGuard)
 * @Controller('produtos')
 * export class ProdutoController {}
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota está marcada para pular validação
    // Proteção contra reflector undefined (pode ocorrer em alguns contextos)
    const skipGuard = this.reflector?.getAllAndOverride<boolean>(
      SKIP_TENANT_GUARD,
      [context.getHandler(), context.getClass()],
    ) ?? false;

    if (skipGuard) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não há usuário autenticado, deixar passar (JwtAuthGuard cuida disso)
    if (!user) {
      return true;
    }

    // Se não há tenant no contexto (rota pública), deixar passar
    if (!this.tenantContext?.hasTenant?.()) {
      return true;
    }

    const contextTenantId = this.tenantContext.getTenantId();
    const userTenantId = user.tenantId;

    // BLOQUEIO: Usuário sem tenant NÃO pode acessar recursos de nenhum tenant
    if (!userTenantId) {
      this.logger.error(
        `🚨 Usuário ${user.id} (${user.email}) sem tenantId tentou acessar tenant ${contextTenantId}`
      );
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Usuário não está associado a nenhum estabelecimento',
        details: { reason: 'USER_WITHOUT_TENANT' },
      });
    }

    // VALIDAÇÃO PRINCIPAL: Comparar tenant do JWT com tenant do contexto
    if (userTenantId !== contextTenantId) {
      await this.logSecurityViolation(request, user, contextTenantId, userTenantId);
      
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Acesso negado: você não tem permissão para acessar este estabelecimento',
        details: {
          reason: 'CROSS_TENANT_ACCESS_DENIED',
          userTenant: userTenantId,
          requestedTenant: contextTenantId,
        },
      });
    }

    return true;
  }

  /**
   * Registra tentativa de violação cross-tenant
   */
  private async logSecurityViolation(
    request: any,
    user: any,
    targetTenantId: string,
    userTenantId: string,
  ): Promise<void> {
    const { ip, method, url, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';

    const logData = {
      event: 'CROSS_TENANT_ACCESS_ATTEMPT',
      severity: 'HIGH',
      userId: user.id,
      userEmail: user.email,
      userTenantId,
      targetTenantId,
      ip,
      userAgent,
      method,
      url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `🚨 TENTATIVA DE ACESSO CROSS-TENANT BLOQUEADA!\n` +
      `   Usuário: ${user.email} (${user.id})\n` +
      `   Tenant do usuário: ${userTenantId}\n` +
      `   Tenant alvo: ${targetTenantId}\n` +
      `   IP: ${ip}\n` +
      `   URL: ${method} ${url}`
    );

    // TODO: Integrar com AuditService quando disponível
    // await this.auditService.logSecurityEvent(logData);

    // Emitir evento para monitoramento (se configurado)
    // this.eventEmitter.emit('security.crossTenantAttempt', logData);
  }
}
