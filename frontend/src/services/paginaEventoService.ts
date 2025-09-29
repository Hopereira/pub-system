// Caminho: frontend/src/services/paginaEventoService.ts

import { PaginaEvento } from '@/types/pagina-evento';
import { CreatePaginaEventoDto, UpdatePaginaEventoDto } from '@/types/pagina-evento.dto';
import api, { publicApi } from './api';

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

export const uploadPaginaEventoMedia = async (
  id: string,
  mediaFile: File,
): Promise<PaginaEvento> => {
  try {
    const formData = new FormData();
    formData.append('file', mediaFile); 

    const response = await api.patch<PaginaEvento>(
      `/paginas-evento/${id}/media`,
      formData,
      {
        headers: {
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

export const getPublicPaginaEvento = async (id: string): Promise<PaginaEvento> => {
  try {
    // Esta função agora usa a 'publicApi' para não enviar o token de autenticação
    const response = await publicApi.get<PaginaEvento>(`/paginas-evento/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar página de evento pública ${id}:`, error);
    throw error;
  }
};