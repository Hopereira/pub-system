// Caminho: frontend/src/types/funcionario.ts

// Tipos de cargo disponíveis no sistema
export type CargoType = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO' | 'COZINHA' | 'BARTENDER';

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: CargoType;
  status: 'ATIVO' | 'INATIVO';
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

/**
 * Retorna os cargos que o usuário atual pode atribuir
 * Implementa anti-elevação no frontend
 */
export function getCargosDisponiveis(userCargo: CargoType): CargoType[] {
  switch (userCargo) {
    case 'SUPER_ADMIN':
      // SUPER_ADMIN pode criar qualquer cargo
      return ['ADMIN', 'GERENTE', 'CAIXA', 'GARCOM', 'COZINHEIRO', 'COZINHA', 'BARTENDER'];
    case 'ADMIN':
      // ADMIN pode criar até ADMIN (não SUPER_ADMIN)
      return ['ADMIN', 'GERENTE', 'CAIXA', 'GARCOM', 'COZINHEIRO', 'COZINHA', 'BARTENDER'];
    case 'GERENTE':
      // GERENTE não pode criar funcionários
      return [];
    default:
      return [];
  }
}

/**
 * Labels amigáveis para os cargos
 */
export const CARGO_LABELS: Record<CargoType, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  CAIXA: 'Caixa',
  GARCOM: 'Garçom',
  COZINHEIRO: 'Cozinheiro',
  COZINHA: 'Cozinha',
  BARTENDER: 'Bartender',
};