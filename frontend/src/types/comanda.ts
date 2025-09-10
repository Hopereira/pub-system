// Caminho: frontend/src/types/comanda.ts

import { Mesa } from "./mesa";
import { PedidoStatus } from "./pedido"; // ALTERAÇÃO 1: Importando o enum de status do pedido
import { Produto } from "./produto";

export type ComandaStatus = 'ABERTA' | 'FECHADA' | 'PAGA';

// Define a estrutura de um item dentro de um pedido
export interface ItemPedido {
  id: string;
  quantidade: number;
  observacao?: string | null;
  produto: Produto;
  precoUnitario: number;
  pedidoId: string; // ALTERAÇÃO 2: Adicionando a referência ao pedido pai
}

// Define a estrutura de um Pedido
export interface Pedido {
    id: string;
    status: PedidoStatus; // ALTERAÇÃO 3: Usando o enum para mais segurança
    itens: ItemPedido[];
    total: number;
}

// A comanda agora tem uma lista de Pedidos, e não de Itens
export interface Comanda {
  id: string;
  status: ComandaStatus;
  mesa?: Mesa;
  pedidos: Pedido[];
  // Futuramente adicionaremos cliente
}

export interface AbrirComandaDto {
  mesaId: string;
}