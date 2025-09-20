// Caminho: frontend/src/types/produto.ts

import { Ambiente } from "@/types/ambiente";

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ambiente: Ambiente;
  // ==================================================================
  // ## CORREÇÃO: Adicionamos a propriedade que faltava ##
  // ==================================================================
  urlImagem?: string | null; // A imagem pode ser opcional
}