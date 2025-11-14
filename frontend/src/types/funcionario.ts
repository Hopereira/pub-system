// Caminho: frontend/src/types/funcionario.ts

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHA';
  status: 'ATIVO' | 'INATIVO';
  criadoEm: string;
  atualizadoEm: string;
}