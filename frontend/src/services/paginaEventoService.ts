import { PaginaEvento } from '@/types/pagina-evento';
import { CreatePaginaEventoDto, UpdatePaginaEventoDto } from '@/types/pagina-evento.dto';
import api, { publicApi } from './api';

export const getPaginasEvento = async (): Promise<PaginaEvento[]> => { /* ... */ };
export const createPaginaEvento = async (data: CreatePaginaEventoDto): Promise<PaginaEvento> => { /* ... */ };
export const updatePaginaEvento = async (id: string, data: UpdatePaginaEventoDto): Promise<PaginaEvento> => { /* ... */ };
export const uploadPaginaEventoMedia = async (id: string, mediaFile: File): Promise<PaginaEvento> => { /* ... */ };
export const deletePaginaEvento = async (id: string): Promise<void> => { /* ... */ };

/**
 * Função FINAL para o Cliente.
 * Busca o registro da Página de Evento que está marcada como ATIVA pelo administrador.
 */
export const getPublicPaginaEventoAtiva = async (): Promise<PaginaEvento | null> => {
  try {
    // Presume que o endpoint /paginas-evento/ativa/publica existe no backend.
    const response = await publicApi.get<PaginaEvento>('/paginas-evento/ativa/publica');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar página de evento ativa:', error);
    return null; 
  }
};