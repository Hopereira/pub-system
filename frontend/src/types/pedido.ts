// Caminho: frontend/src/types/pedido.ts

import { Produto } from "./produto";

// AQUI ESTÁ A NOSSA FONTE DA VERDADE
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  produto: Produto;
}

export interface Pedido {
  id: string;
  status: PedidoStatus;
  total: number;
  data: string;
  motivoCancelamento: string | null;
  itens: ItemPedido[];
  // Adicione outras relações se necessário, como 'comanda'
}