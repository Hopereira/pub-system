// Caminho: frontend/src/types/funcionario.ts

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHA';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}