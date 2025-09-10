// Caminho: frontend/src/types/comanda.ts

import { Mesa } from "./mesa";
import { PedidoStatus } from "./pedido";
import { Produto } from "./produto";

// --- CORREÇÃO APLICADA AQUI ---
// Transformado de 'type' para 'enum' para que possa ser usado no código em execução.
export enum ComandaStatus {
  ABERTA = 'ABERTA',
  FECHADA = 'FECHADA',
  PAGA = 'PAGA',
}
// --- FIM DA CORREÇÃO ---

// Define a estrutura de um item dentro de um pedido
export interface ItemPedido {
  id: string;
  quantidade: number;
  observacao?: string | null;
  produto: Produto;
  precoUnitario: number;
  pedidoId: string;
}

// Define a estrutura de um Pedido
export interface Pedido {
    id: string;
    status: PedidoStatus;
    itens: ItemPedido[];
    total: number;
}

// A comanda agora tem uma lista de Pedidos, e não de Itens
export interface Comanda {
  id: string;
  status: ComandaStatus; // Esta linha já estava correta e agora funcionará
  mesa?: Mesa;
  pedidos: Pedido[];
  // Futuramente adicionaremos cliente
}

export interface AbrirComandaDto {
  mesaId: string;
}