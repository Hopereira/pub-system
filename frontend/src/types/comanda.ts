// Caminho: frontend/src/types/comanda.ts

import { Mesa } from "./mesa";
import { ItemPedido, PedidoStatus } from "./pedido"; 
import { Produto } from "./produto";
import { PontoEntrega, Agregado } from "./ponto-entrega";

// --- CORREÇÃO APLICADA AQUI ---
// Transformado de 'type' para 'enum' para que possa ser usado no código em execução.
export enum ComandaStatus {
  ABERTA = 'ABERTA',
  FECHADA = 'FECHADA',
  PAGA = 'PAGA',
}
// --- FIM DA CORREÇÃO ---

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
  status: ComandaStatus; 
  mesa?: Mesa;
  pontoEntrega?: PontoEntrega;
  agregados?: Agregado[];
  pedidos: Pedido[];
  dataAbertura: string;
  cliente?: {
    id: string;
    nome: string;
    cpf?: string;
  } | null;
}

export interface AbrirComandaDto {
  mesaId: string;
}