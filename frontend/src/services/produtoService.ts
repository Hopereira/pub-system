import { Produto } from '@/types/produto';
import { UpdateProdutoDto } from '@/types/produto.dto';
import api from './api';

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const response = await api.get<Produto[]>('/produtos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

// --- FUNÇÃO CREATEPRODUTO ATUALIZADA ---
// Agora ela recebe um FormData e o envia diretamente para a API.
// O Axios configurará o 'Content-Type' como 'multipart/form-data' automaticamente.
export const createProduto = async (data: FormData): Promise<Produto> => {
  try {
    const response = await api.post<Produto>('/produtos', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
};

export const updateProduto = async (id: string, produtoData: UpdateProdutoDto): Promise<Produto> => {
  try {
    const response = await api.patch<Produto>(`/produtos/${id}`, produtoData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar produto ${id}:`, error);
    throw error;
  }
};

export const deleteProduto = async (id: string): Promise<void> => {
  try {
    await api.delete(`/produtos/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar produto ${id}:`, error);
    throw error;
  }
};

// A função 'uploadImagem' foi REMOVIDA, pois a lógica agora está unificada.