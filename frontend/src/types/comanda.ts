// Caminho: frontend/src/types/comanda.ts

import { Mesa } from "./mesa";
import { Produto } from "./produto";

export type ComandaStatus = 'ABERTA' | 'FECHADA' | 'PAGA';

// Define a estrutura de um item dentro de um pedido
export interface ItemPedido {
  id: string;
  quantidade: number;
  observacao?: string | null;
  produto: Produto;
  precoUnitario: number; // Adicionado para consistência com a API
}

// Define a estrutura de um Pedido
export interface Pedido {
    id: string;
    status: string; // Ex: 'RECEBIDO', 'EM_PREPARO', 'PRONTO'
    itens: ItemPedido[];
    total: number;
}

// A comanda agora tem uma lista de Pedidos, e não de Itens
export interface Comanda {
  id: string;
  status: ComandaStatus;
  mesa?: Mesa;
  pedidos: Pedido[]; // A propriedade correta é 'pedidos'
  // Futuramente adicionaremos cliente
}

export interface AbrirComandaDto {
  mesaId: string;
}