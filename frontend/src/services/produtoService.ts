// Caminho: frontend/src/services/produtoService.ts
import { Produto } from '@/types/produto';
import api from './api';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const response = await api.get('/produtos', {
      headers: { 'Cache-Control': 'no-cache' },
      params: { limit: 100 }, // Máximo permitido pelo backend
    });
    
    // A resposta pode ser um array direto ou um objeto paginado { data: [...] }
    const responseData = response.data;
    
    // Se for um array, retorna diretamente
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    // Se for objeto paginado, extrai o array 'data'
    if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    // Fallback: retorna array vazio
    console.warn('Resposta inesperada de /produtos:', responseData);
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

export const createProduto = async (data: FormData): Promise<Produto> => {
  try {
    const response = await api.post('/produtos', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
};

export const updateProduto = async (id: string, data: FormData): Promise<Produto> => {
  try {
    // Corrigido para usar PATCH e enviar FormData
    const response = await api.patch<Produto>(`/produtos/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar produto ${id}:`, error);
    throw error;
  }
};

export const deleteProduto = async (id: string): Promise<Produto> => {
  try {
    const response = await api.delete<Produto>(`/produtos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar produto ${id}:`, error);
    throw error;
  }
};