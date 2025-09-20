import { Pedido } from '@/types/pedido';
import { AddItemPedidoDto, CreatePedidoDto, UpdateItemPedidoStatusDto, UpdatePedidoStatusDto } from '@/types/pedido.dto';
import api from './api';

export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<Pedido> => {
  try {
    const response = await api.post<Pedido>('/pedidos', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar itens ao pedido:', error);
    throw error;
  }
};

export const createPedidoFromCliente = async (payload: CreatePedidoDto): Promise<Pedido> => {
  try {
    const response = await api.post<Pedido>('/pedidos/cliente', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar pedido do cliente:', error);
    throw error;
  }
};

export const getPedidosPorAmbiente = async (ambienteId: string): Promise<Pedido[]> => {
  try {
    const response = await api.get<Pedido[]>(`/pedidos`, { params: { ambienteId } });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar pedidos para o ambiente ${ambienteId}:`, error);
    throw error;
  }
};

export const updateItemStatus = async (
  itemPedidoId: string,
  data: UpdateItemPedidoStatusDto,
): Promise<any> => {
  try {
    const response = await api.patch(`/pedidos/item/${itemPedidoId}/status`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar status do item ${itemPedidoId}:`, error);
    throw error;
  }
};

// --- FUNÇÃO RESTAURADA (Obsoleta) ---
export const updatePedidoStatus = async (id: string, data: UpdatePedidoStatusDto): Promise<Pedido> => {
  try {
    const response = await api.patch<Pedido>(`/pedidos/${id}/status`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar status do pedido ${id}:`, error);
    throw error;
  }
};