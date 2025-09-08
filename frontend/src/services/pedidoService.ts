// Caminho: frontend/src/services/pedidoService.ts
import { Pedido } from "@/types/pedido";
import api from "./api";

// Define a estrutura do DTO para atualizar o status
export interface UpdatePedidoStatusDto {
  status: 'EM_PREPARO' | 'PRONTO';
}

// Busca todos os pedidos
export const getPedidos = async (): Promise<Pedido[]> => {
  try {
    const response = await api.get('/pedidos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    throw error;
  }
};

// Atualiza o status de um pedido específico
export const updatePedidoStatus = async (id: string, data: UpdatePedidoStatusDto): Promise<Pedido> => {
    try {
        const response = await api.patch(`/pedidos/${id}/status`, data);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar status do pedido ${id}:`, error);
        throw error;
    }
}

// A função de adicionar itens pode ser movida para cá também para centralizar
interface ItemParaAdicionar {
  produtoId: string;
  quantidade: number;
  observacao?: string;
}
interface AddItemPedidoDto {
  comandaId: string;
  itens: ItemParaAdicionar[];
}
export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<void> => {
  try {
    await api.post('/pedidos', data);
  } catch (error) {
    console.error('Erro ao adicionar itens ao pedido:', error);
    throw error;
  }
};