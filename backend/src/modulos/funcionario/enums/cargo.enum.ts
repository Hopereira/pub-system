export enum Cargo {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE', // Permissões gerenciais: relatórios, supervisão, sem config admin
  CAIXA = 'CAIXA',
  GARCOM = 'GARCOM',
  COZINHEIRO = 'COZINHEIRO',
  COZINHA = 'COZINHA', // Alias para COZINHEIRO (compatibilidade)
  BARTENDER = 'BARTENDER',
}

/**
 * Hierarquia de permissões:
 * - SUPER_ADMIN: Acesso total à plataforma (multi-tenant)
 * - ADMIN: Acesso total ao tenant (configurações, funcionários, relatórios)
 * - GERENTE: Supervisão operacional (relatórios, pedidos, comandas, sem config)
 * - CAIXA: Operações de caixa e comandas
 * - GARCOM: Pedidos e atendimento
 * - COZINHEIRO/COZINHA/BARTENDER: Preparo de pedidos
 */
export const ROLES_GERENCIAIS = [Cargo.SUPER_ADMIN, Cargo.ADMIN, Cargo.GERENTE];
export const ROLES_OPERACIONAIS = [Cargo.CAIXA, Cargo.GARCOM, Cargo.COZINHEIRO, Cargo.COZINHA, Cargo.BARTENDER];
export const ROLES_PREPARO = [Cargo.COZINHEIRO, Cargo.COZINHA, Cargo.BARTENDER];
