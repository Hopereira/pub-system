// Caminho: frontend/src/types/produto.ts

import { Ambiente } from "@/types/ambiente"; // Supondo que você tenha um types/ambiente.ts

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ambiente: Ambiente; // A API deve retornar o ambiente de preparo aninhado
}