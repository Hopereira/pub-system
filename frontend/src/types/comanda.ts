// src/types/comanda.ts (versão atualizada)
import { Mesa } from "./mesa";
import { Produto } from "./produto";

export type ComandaStatus = 'Aberta' | 'Fechada' | 'Paga';

export interface ItemPedido {
  id: string;
  quantidade: number;
  observacao?: string | null;
  produto: Produto;
}

export interface Comanda {
  id: string;
  status: ComandaStatus;
  mesa?: Mesa;
  itensPedido: ItemPedido[];
  // Futuramente adicionaremos cliente
}

export interface AbrirComandaDto {
  mesaId: string;
}