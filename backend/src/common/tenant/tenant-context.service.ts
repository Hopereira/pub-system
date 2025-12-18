import { Injectable, Scope, Logger } from '@nestjs/common';
import { TenantId, createTenantId, TenantNotSetError, ITenantContext } from './tenant.types';

/**
 * TenantContextService - Serviço com escopo de requisição para Multi-tenancy
 * 
 * Este serviço armazena a identidade do inquilino (tenant) durante todo o
 * ciclo de vida da requisição, garantindo isolamento entre diferentes bares/empresas.
 * 
 * IMPORTANTE:
 * - Escopo REQUEST: Uma nova instância é criada para cada requisição HTTP
 * - Imutável após definido: O tenant não pode ser alterado após ser configurado
 * - Thread-safe: Cada requisição tem sua própria instância isolada
 * 
 * @example
 * ```typescript
 * // No middleware ou guard
 * tenantContext.setTenantId('uuid-do-tenant');
 * 
 * // Em qualquer serviço
 * const tenantId = tenantContext.getTenantId();
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private context: ITenantContext | null = null;
  private isLocked = false;

  /**
   * Define o ID do tenant para esta requisição
   * 
   * @param id - UUID do tenant (empresa/bar)
   * @param tenantName - Nome opcional do tenant para logs
   * @throws Error se o tenant já foi definido (imutabilidade)
   * @throws Error se o ID for inválido
   */
  setTenantId(id: string, tenantName?: string): void {
    if (this.isLocked) {
      throw new Error(
        `Tentativa de alterar tenant já definido. ` +
        `Tenant atual: ${this.context?.tenantId}. ` +
        `O contexto do tenant é imutável após ser configurado.`
      );
    }

    const tenantId = createTenantId(id);
    
    this.context = {
      tenantId,
      tenantName,
      setAt: new Date(),
    };
    
    this.isLocked = true;
    
    this.logger.debug(
      `🏢 Tenant definido: ${tenantId}${tenantName ? ` (${tenantName})` : ''}`
    );
  }

  /**
   * Obtém o ID do tenant da requisição atual
   * 
   * @returns TenantId tipado
   * @throws TenantNotSetError se o tenant não foi definido
   */
  getTenantId(): TenantId {
    if (!this.context) {
      throw new TenantNotSetError(
        'getTenantId() chamado antes de setTenantId(). ' +
        'Certifique-se de que o TenantMiddleware está configurado corretamente.'
      );
    }
    return this.context.tenantId;
  }

  /**
   * Obtém o nome do tenant (se disponível)
   * 
   * @returns Nome do tenant ou undefined
   * @throws TenantNotSetError se o tenant não foi definido
   */
  getTenantName(): string | undefined {
    if (!this.context) {
      throw new TenantNotSetError();
    }
    return this.context.tenantName;
  }

  /**
   * Verifica se o tenant foi definido para esta requisição
   * 
   * @returns true se o tenant está configurado
   */
  hasTenant(): boolean {
    return this.context !== null;
  }

  /**
   * Obtém o contexto completo do tenant (para logs e debugging)
   * 
   * @returns Contexto completo ou null se não definido
   */
  getContext(): Readonly<ITenantContext> | null {
    return this.context ? { ...this.context } : null;
  }

  /**
   * Obtém o tenant ID de forma segura (retorna null se não definido)
   * Útil para logs e situações onde o tenant pode não estar disponível
   * 
   * @returns TenantId ou null
   */
  getTenantIdOrNull(): TenantId | null {
    return this.context?.tenantId ?? null;
  }
}
