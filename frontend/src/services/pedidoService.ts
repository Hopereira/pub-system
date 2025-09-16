// Caminho: frontend/src/services/pedidoService.ts
import { ItemPedido, Pedido, PedidoStatus } from "@/types/pedido";
import api from "./api";
import { AxiosError } from "axios";

// DTO para adicionar itens a um pedido/comanda
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

// DTO para o corpo da requisição de atualização de status de um item
export interface UpdateItemStatusDto {
  status: PedidoStatus;
}

// Busca todos os pedidos, com filtro opcional por ambiente
export const getPedidos = async (ambienteId?: string): Promise<Pedido[]> => {
  try {
    const response = await api.get<Pedido[]>('/pedidos', {
      params: { ambienteId },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    throw error;
  }
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

/**
 * Atualiza o status de um item de pedido específico.
 * @param itemPedidoId O ID do item do pedido a ser atualizado.
 * @param data O novo status para o item.
 * @returns O item de pedido atualizado.
 */
export const updateItemStatus = async (itemPedidoId: string, data: UpdateItemStatusDto): Promise<ItemPedido> => {
  try {
    const response = await api.patch<ItemPedido>(`/pedidos/item/${itemPedidoId}/status`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar status do item de pedido ${itemPedidoId}:`, error);
    throw error;
  }
};

// --- FUNÇÃO CORRIGIDA ---
// Cria um novo pedido (usado internamente por funcionários)
export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<Pedido> => {
  try {
    const response = await api.post<Pedido>('/pedidos', data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Erro ao adicionar itens ao pedido:', axiosError.response?.data || axiosError.message);
    throw error;
  }
};

// --- FUNÇÃO CORRIGIDA ---
// Cria um novo pedido a partir do fluxo do cliente
export const createPedidoFromCliente = async (data: AddItemPedidoDto): Promise<Pedido> => {
  try {
    // Geralmente aponta para o mesmo endpoint, mas poderia ter um diferente se necessário
    const response = await api.post<Pedido>('/pedidos/cliente', data); 
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Erro ao criar pedido pelo cliente:', axiosError.response?.data || axiosError.message);
    throw error;
  }
};