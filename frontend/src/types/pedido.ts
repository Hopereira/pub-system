// Caminho: frontend/src/types/pedido.ts

import { Produto } from "./produto";
import { Mesa } from "./mesa";

// Enum de status de pedido (fonte da verdade)
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE',
  CANCELADO = 'CANCELADO',
}

// Interface para Item de Pedido
export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  status: PedidoStatus; // Status individual do item
  motivoCancelamento?: string | null;
  produto: Produto;
  ambienteRetirada?: {
    id: string;
    nome: string;
  } | null;
  // Timestamps para cálculo de tempo de preparo
  iniciadoEm?: string | null;
  prontoEm?: string | null;
  entregueEm?: string | null;
}

// Interface simplificada para Comanda (evita import circular)
export interface ComandaSimples {
  id: string;
  status: string;
  mesa?: Mesa | null;
  pontoEntrega?: {
    id: string;
    nome: string;
  } | null;
  cliente?: {
    id: string;
    nome: string;
    cpf?: string;
  } | null;
}

// Interface principal de Pedido
export interface Pedido {
  id: string;
  status: PedidoStatus;
  total: number;
  data: string;
  motivoCancelamento: string | null;
  itens: ItemPedido[];
  comanda?: ComandaSimples; // Relação com comanda incluída
}