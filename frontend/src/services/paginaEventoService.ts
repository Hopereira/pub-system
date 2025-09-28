// Caminho: frontend/src/services/paginaEventoService.ts

import { PaginaEvento } from '@/types/pagina-evento';
import { CreatePaginaEventoDto, UpdatePaginaEventoDto } from '@/types/pagina-evento.dto';
import api from './api';

export const getPaginasEvento = async (): Promise<PaginaEvento[]> => {
  try {
    const response = await api.get<PaginaEvento[]>('/paginas-evento');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar páginas de evento:', error);
    throw error;
  }
};

export const createPaginaEvento = async (data: CreatePaginaEventoDto): Promise<PaginaEvento> => {
  try {
    const response = await api.post<PaginaEvento>('/paginas-evento', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar página de evento:', error);
    throw error;
  }
};

export const updatePaginaEvento = async (id: string, data: UpdatePaginaEventoDto): Promise<PaginaEvento> => {
  try {
    const response = await api.patch<PaginaEvento>(`/paginas-evento/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar página de evento ${id}:`, error);
    throw error;
  }
};

// --- NOVA FUNÇÃO: UPLOAD DE MÍDIA EXCLUSIVO ---
export const uploadPaginaEventoMedia = async (
  id: string,
  mediaFile: File, // Recebe o objeto File
): Promise<PaginaEvento> => {
  try {
    const formData = new FormData();
    // O backend espera que a chave do arquivo seja 'file'
    formData.append('file', mediaFile); 

    // O PATCH será enviado para o ID da página, com o Content-Type correto
    const response = await api.patch<PaginaEvento>(
      `/paginas-evento/${id}`, 
      formData,
      {
        headers: {
          // Garante que o Axios envie no formato correto para o arquivo
          'Content-Type': 'multipart/form-data', 
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erro ao fazer upload de mídia para a página ${id}:`, error);
    throw error;
  }
};

export const deletePaginaEvento = async (id: string): Promise<void> => {
  try {
    await api.delete(`/paginas-evento/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar página de evento ${id}:`, error);
    throw error;
  }
};