export interface CreateProdutoDto {
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  ambienteId: string;
}

export type UpdateProdutoDto = Partial<CreateProdutoDto>;