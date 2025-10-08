// Caminho: frontend/src/services/paginaEventoService.ts

import { PaginaEvento } from '@/types/pagina-evento';
import { CreatePaginaEventoDto, UpdatePaginaEventoDto } from '@/types/pagina-evento.dto';
import api, { publicApi } from './api';

/**
 * Busca todas as Páginas de Evento (para o painel de admin).
 */
export const getPaginasEvento = async (): Promise<PaginaEvento[]> => {
  try {
    const response = await api.get<PaginaEvento[]>('/paginas-evento');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar páginas de evento:', error);
    throw error;
  }
};

/**
 * Cria uma nova Página de Evento.
 */
export const createPaginaEvento = async (data: CreatePaginaEventoDto): Promise<PaginaEvento> => {
  try {
    const response = await api.post<PaginaEvento>('/paginas-evento', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar página de evento:', error);
    throw error;
  }
};

/**
 * Atualiza uma Página de Evento existente.
 */
export const updatePaginaEvento = async (id: string, data: UpdatePaginaEventoDto): Promise<PaginaEvento> => {
  try {
    const response = await api.patch<PaginaEvento>(`/paginas-evento/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar página de evento ${id}:`, error);
    throw error;
  }
};

/**
 * Faz o upload de uma mídia (imagem/vídeo) para uma Página de Evento.
 */
export const uploadPaginaEventoMedia = async (id: string, mediaFile: File): Promise<PaginaEvento> => {
  const formData = new FormData();
  formData.append('file', mediaFile);

  try {
    const response = await api.patch<PaginaEvento>(
      `/paginas-evento/${id}/upload-media`,
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

/**
 * Deleta uma Página de Evento.
 */
export const deletePaginaEvento = async (id: string): Promise<void> => {
  try {
    await api.delete(`/paginas-evento/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar página de evento ${id}:`, error);
    throw error;
  }
};

/**
 * Busca a Página de Evento pública que está marcada como ATIVA.
 */
export const getPublicPaginaEventoAtiva = async (): Promise<PaginaEvento | null> => {
  try {
    const response = await publicApi.get<PaginaEvento>('/paginas-evento/ativa/publica');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar página de evento ativa:', error);
    return null;
  }
};

// =======================================================
// ✅ NOVA FUNÇÃO ADICIONADA AQUI
// =======================================================
/**
 * Busca os dados públicos de UMA página de evento específica pelo ID.
 */
export const getPublicPaginaEvento = async (id: string): Promise<PaginaEvento | null> => {
  try {
    // Usa a API pública para chamar o endpoint GET /paginas-evento/:id
    const response = await publicApi.get<PaginaEvento>(`/paginas-evento/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar página de evento pública com ID ${id}:`, error);
    return null; 
  }
};