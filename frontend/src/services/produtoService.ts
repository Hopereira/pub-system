import { Produto } from '@/types/produto';
import { CreateProdutoDto, UpdateProdutoDto } from '@/types/produto.dto';
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

// Envia JSON para o endpoint POST /produtos
export const createProduto = async (data: CreateProdutoDto): Promise<Produto> => {
  try {
    const response = await api.post<Produto>('/produtos', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
};

// Envia JSON para o endpoint PATCH /produtos/:id
export const updateProduto = async (id: string, data: UpdateProdutoDto): Promise<Produto> => {
  try {
    const response = await api.patch<Produto>(`/produtos/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar produto ${id}:`, error);
    throw error;
  }
};

// Envia FormData para o endpoint PATCH /produtos/:id/upload-imagem
export const uploadProdutoMedia = async (id: string, mediaFile: File): Promise<Produto> => {
  const formData = new FormData();
  formData.append('file', mediaFile);

  try {
    const response = await api.patch<Produto>(`/produtos/${id}/upload-imagem`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao fazer upload da imagem para o produto ${id}:`, error);
    throw error;
  }
};

export const deleteProduto = async (id: string): Promise<void> => {
    try {
        await api.delete(`/produtos/${id}`);
    } catch (error) {
        console.error(`Erro ao excluir produto ${id}:`, error);
        throw error;
    }
};