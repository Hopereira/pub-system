// src/services/pedidoService.ts
import api from "./api";

// Define a estrutura de um item individual a ser adicionado
interface ItemParaAdicionar {
  produtoId: string;
  quantidade: number;
  observacao?: string;
}

// Define a estrutura do DTO que a API espera
interface AddItemPedidoDto {
  comandaId: string;
  itens: ItemParaAdicionar[];
}

export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<void> => {
  try {
    // Usamos o endpoint POST /pedidos conforme planeado no backend
    await api.post('/pedidos', data);
  } catch (error) {
    console.error('Erro ao adicionar itens ao pedido:', error);
    throw error;
  }
};