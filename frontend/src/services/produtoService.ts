// Caminho: frontend/src/services/produtoService.ts
import { Produto } from '@/types/produto';
import api from './api';

// Tipos DTO para clareza
export interface CreateProdutoDto {
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  ambienteId: string;
}

export interface UpdateProdutoDto extends CreateProdutoDto {}

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const response = await api.get<Produto[]>('/produtos', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

export const createProduto = async (data: FormData): Promise<Produto> => {
  try {
    const response = await api.post<Produto>('/produtos', data, {
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