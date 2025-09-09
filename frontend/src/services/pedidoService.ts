// Caminho: frontend/src/services/pedidoService.ts
import { Pedido, PedidoStatus } from "@/types/pedido";
import api from "./api";

// DTO para adicionar itens a um pedido/comanda
interface ItemParaAdicionar {
  produtoId: string;
  quantidade: number;
  observacao?: string;
}
export interface AddItemPedidoDto {
  comandaId: string;
  itens: ItemParaAdicionar[];
}

// DTO para atualizar o status
export interface UpdatePedidoStatusDto {
  status: PedidoStatus;
  motivoCancelamento?: string;
}

// Busca todos os pedidos, com filtro opcional por ambiente
export const getPedidos = async (ambienteId?: string): Promise<Pedido[]> => {
  try {
    const params = ambienteId ? { ambienteId } : {};
    const response = await api.get('/pedidos', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    throw error;
  }
};

// Atualiza o status de um pedido específico
export const updatePedidoStatus = async (id: string, data: Partial<UpdatePedidoStatusDto>): Promise<Pedido> => {
    try {
        const response = await api.patch<Pedido>(`/pedidos/${id}/status`, data);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar status do pedido ${id}:`, error);
        throw error;
    }
}

// --- FUNÇÃO QUE ESTAVA EM FALTA ---
// Cria um novo pedido (adiciona itens a uma comanda)
export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<Pedido> => {
  try {
    // A API retorna o novo pedido criado, então podemos tipar a resposta
    const response = await api.post<Pedido>('/pedidos', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar itens ao pedido:', error);
    throw error;
  }
};