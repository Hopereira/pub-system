// src/types/produto.ts
export interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
  // imagemUrl: string; // Futuramente
}