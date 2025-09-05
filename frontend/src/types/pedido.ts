// Caminho: frontend/src/types/pedido.ts
import { ItemPedido } from "./comanda";
import { Mesa } from "./mesa";

export type PedidoStatus = 'FEITO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

export interface Pedido {
    id: string;
    status: PedidoStatus;
    total: number;
    data: Date;
    comanda: {
        id: string;
        mesa?: Mesa;
    };
    itens: ItemPedido[];
}