// Caminho: frontend/src/types/comanda.ts

import { Mesa } from "./mesa";
import { PedidoStatus } from "./pedido";
import { Produto } from "./produto";
import { PontoEntrega, Agregado } from "./ponto-entrega";
import { PaginaEvento } from "./pagina-evento";

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
  status?: PedidoStatus; // Status individual do item
}

// Define a estrutura de um Pedido
export interface Pedido {
    id: string;
    status: PedidoStatus;
    itens: ItemPedido[];
    total: number;
}

// Interface do Cliente
export interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  celular?: string;
  email?: string;
}

// A comanda agora tem uma lista de Pedidos, e não de Itens
export interface Comanda {
  id: string;
  status: ComandaStatus;
  mesa?: Mesa;
  pontoEntrega?: PontoEntrega;
  agregados?: Agregado[];
  pedidos: Pedido[];
  cliente?: Cliente;
  paginaEvento?: PaginaEvento;
  dataAbertura?: string;
  dataFechamento?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface AbrirComandaDto {
  mesaId: string;
}