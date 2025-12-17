// Caminho: frontend/src/types/funcionario.ts

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO' | 'BARTENDER';
  status: 'ATIVO' | 'INATIVO';
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}