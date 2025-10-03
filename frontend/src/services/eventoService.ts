import { Evento } from '@/types/evento';
import { publicApi } from './api';

/**
 * Busca a lista de eventos públicos da API.
 */
export const getPublicEventos = async (): Promise<Evento[]> => {
  try {
    const response = await publicApi.get<Evento[]>('/eventos/publicos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar eventos públicos:', error);
    throw new Error('Não foi possível carregar os eventos.');
  }
};
