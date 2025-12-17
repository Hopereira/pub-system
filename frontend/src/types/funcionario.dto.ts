// Caminho: frontend/src/types/funcionario.dto.ts

// Este tipo define os dados que nosso formulário enviará para a API ao CRIAR
export interface CreateFuncionarioDto {
  nome: string;
  email: string;
  senha?: string; // Obrigatório na criação
  cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO' | 'BARTENDER';
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
}

// NOVO: Já vamos deixar pronto o DTO para ATUALIZAÇÃO.
// Na atualização, todos os campos são opcionais.
export interface UpdateFuncionarioDto {
  nome?: string;
  email?: string;
  senha?: string;
  cargo?: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO' | 'BARTENDER';
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  ativo?: boolean;
}