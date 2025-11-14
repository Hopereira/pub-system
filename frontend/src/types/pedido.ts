// Caminho: frontend/src/types/pedido.ts

import { Produto } from "./produto";
import { Mesa } from "./mesa";

// Enum de status de pedido (fonte da verdade)
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO', // Sinal antecipado 30-60s antes de pronto
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO', // Garçom pegou o item no ambiente
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
  quaseProntoEm?: string | null; // ✅ NOVO: quando foi marcado como quase pronto
  retiradoEm?: string | null; // ✅ NOVO: quando o garçom retirou
  entregueEm?: string | null;
  
  // ✅ NOVO: Garçom que retirou o item
  retiradoPorGarcomId?: string | null;
  retiradoPorGarcom?: {
    id: string;
    nome: string;
  } | null;
  
  // ✅ NOVO: Garçom que entregou o item
  garcomEntregaId?: string | null;
  garcomEntrega?: {
    id: string;
    nome: string;
  } | null;
  
  // ✅ NOVO: Tempos calculados
  tempoPreparoMinutos?: number | null;
  tempoReacaoMinutos?: number | null; // PRONTO -> RETIRADO
  tempoEntregaFinalMinutos?: number | null; // RETIRADO -> ENTREGUE
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