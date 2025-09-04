// Caminho: frontend/src/types/funcionario.dto.ts

// Este tipo define os dados que nosso formulário enviará para a API
export interface CreateFuncionarioDto {
  nome: string;
  email: string;
  senha?: string; // Senha é opcional na edição, mas obrigatória na criação
  cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHA';
}