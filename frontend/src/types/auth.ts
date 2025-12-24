// Roles disponíveis no sistema
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'CAIXA' | 'GARCOM' | 'COZINHEIRO' | 'BARTENDER';

// Usuário decodificado do JWT
export interface User {
  id: string;
  email: string;
  nome: string;
  cargo: UserRole; // Backend usa 'cargo' não 'role'
  role: UserRole; // Alias para compatibilidade
  empresaId: string;
  ambienteId?: string; // Ambiente específico para cozinheiros
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
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
  if (!user) return false;
  // Verifica tanto 'cargo' (backend) quanto 'role' (compatibilidade)
  const userRole = user.cargo || user.role;
  // SUPER_ADMIN tem acesso a TUDO
  if (userRole === 'SUPER_ADMIN') return true;
  return roles.includes(userRole);
};

// Helper para verificar se é role de preparo
export const isPreparoRole = (user: User | null): boolean => {
  return hasRole(user, ['COZINHEIRO', 'BARTENDER']);
};

// Helper para verificar se é role gerencial
export const isGerencialRole = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'GERENTE']);
};
