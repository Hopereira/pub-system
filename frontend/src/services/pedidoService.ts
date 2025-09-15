// Caminho: frontend/src/services/pedidoService.ts
import { ItemPedido, Pedido, PedidoStatus } from "@/types/pedido";
import api from "./api";

// DTO para adicionar itens a um pedido/comanda
// (sem alterações)
export interface AddItemPedidoDto {
  comandaId: string;
  itens: {
    produtoId: string;
    quantidade: number;
    observacao?: string;
  }[];
}

/**
 * @deprecated O status agora é controlado por item. Use UpdateItemStatusDto.
 */
export interface UpdatePedidoStatusDto {
  status: PedidoStatus;
  motivoCancelamento?: string;
}

// --- NOVA INTERFACE ---
// DTO para o corpo da requisição de atualização de status de um item
export interface UpdateItemStatusDto {
  status: PedidoStatus;
}
// --- FIM DA NOVA INTERFACE ---


// Busca todos os pedidos, com filtro opcional por ambiente
// (sem alterações)
export const getPedidos = async (ambienteId?: string): Promise<Pedido[]> => {
  // ... código existente ...
};


/**
 * @deprecated O status agora é controlado por item. Use updateItemStatus.
 * Atualiza o status de um pedido específico
 */
export const updatePedidoStatus = async (id: string, data: Partial<UpdatePedidoStatusDto>): Promise<Pedido> => {
    try {
        const response = await api.patch<Pedido>(`/pedidos/${id}/status`, data);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar status do pedido ${id}:`, error);
        throw error;
    }
}


// --- NOVA FUNÇÃO ---
/**
 * Atualiza o status de um item de pedido específico.
 * @param itemPedidoId O ID do item do pedido a ser atualizado.
 * @param data O novo status para o item.
 * @returns O item de pedido atualizado.
 */
export const updateItemStatus = async (itemPedidoId: string, data: UpdateItemStatusDto): Promise<ItemPedido> => {
  try {
    // Aponta para o novo endpoint do backend que vamos criar
    const response = await api.patch<ItemPedido>(`/pedidos/item/${itemPedidoId}/status`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar status do item de pedido ${itemPedidoId}:`, error);
    throw error;
  }
};
// --- FIM DA NOVA FUNÇÃO ---


// Cria um novo pedido (usado internamente por funcionários)
// (sem alterações)
export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<Pedido> => {
  // ... código existente ...
};

// Cria um novo pedido a partir do fluxo do cliente
// (sem alterações)
export const createPedidoFromCliente = async (data: AddItemPedidoDto): Promise<Pedido> => {
  // ... código existente ...
};