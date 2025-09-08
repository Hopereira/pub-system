// Caminho: frontend/src/types/produto.dto.ts

export interface CreateProdutoDto {
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ambienteId: string; // Enviamos apenas o ID do ambiente de preparo
}

// Já vamos deixar pronto o DTO para a atualização
export interface UpdateProdutoDto {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
  ambienteId?: string;
}