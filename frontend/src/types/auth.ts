// Roles disponíveis no sistema
export type UserRole = 'ADMIN' | 'GERENTE' | 'CAIXA' | 'GARCOM' | 'COZINHEIRO';

// Usuário decodificado do JWT
export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  empresaId: string;
  ambienteId?: string; // Ambiente específico para cozinheiros
  iat?: number;
  exp?: number;
}

// Credenciais de login
export interface LoginCredentials {
  email: string;
  senha: string;
}

// Resposta do login
export interface LoginResponse {
  access_token: string;
}

// Helper para verificar permissões
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

// Helper para verificar se é role de preparo
export const isPreparoRole = (user: User | null): boolean => {
  return hasRole(user, ['COZINHEIRO']);
};

// Helper para verificar se é role gerencial
export const isGerencialRole = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'GERENTE']);
};
