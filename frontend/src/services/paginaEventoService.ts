// Caminho: frontend/src/services/paginaEventoService.ts
import api from './api';

// Interface para os dados da PaginaEvento
export interface PaginaEventoData {
  id: string;
  titulo: string;
  urlImagem: string;
  ativa: boolean;
}

/**
 * Busca os dados de uma PaginaEvento pública.
 * Não necessita de autenticação.
 * @param id O ID da PaginaEvento
 * @returns Os dados da página do evento.
 */
export const getPublicPaginaEvento = async (id: string): Promise<PaginaEventoData> => {
  try {
    // Assumindo que o endpoint no backend seja /paginas-evento/:id/public
    const response = await api.get<PaginaEventoData>(`/paginas-evento/${id}/public`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar página de evento pública ${id}:`, error);
    throw error;
  }
};