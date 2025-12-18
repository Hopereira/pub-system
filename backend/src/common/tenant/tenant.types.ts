/**
 * Tipos para Multi-tenancy
 * 
 * Garante tipagem forte para evitar uso de `any` em IDs de inquilinos.
 */

/**
 * ID único do tenant (empresa/bar)
 * Formato: UUID v4
 */
export type TenantId = string & { readonly __brand: 'TenantId' };

/**
 * Cria um TenantId tipado a partir de uma string
 * @throws Error se o ID for inválido (vazio ou não UUID)
 */
export function createTenantId(id: string): TenantId {
  if (!id || id.trim() === '') {
    throw new Error('TenantId não pode ser vazio');
  }
  
  // Validação básica de UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`TenantId inválido: ${id}. Deve ser um UUID válido.`);
  }
  
  return id as TenantId;
}

/**
 * Verifica se um valor é um TenantId válido
 */
export function isValidTenantId(id: unknown): id is TenantId {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Interface para contexto do tenant
 */
export interface ITenantContext {
  tenantId: TenantId;
  tenantName?: string;
  setAt: Date;
}

/**
 * Erro específico para quando o tenant não está definido
 */
export class TenantNotSetError extends Error {
  constructor(message = 'Tenant não definido. O contexto do tenant deve ser configurado antes de acessá-lo.') {
    super(message);
    this.name = 'TenantNotSetError';
  }
}
