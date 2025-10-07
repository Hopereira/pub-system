import { Evento } from '@/types/evento';
// Importa o cliente de API autenticado para uso no painel de administrador ('api')
// e o cliente de API público ('publicApi') para a tela do cliente.
import api, { publicApi } from './api'; 
import { CreateEventoDto, UpdateEventoDto } from '@/types/evento.dto'; 

/**
 * Busca a lista de TODOS os eventos (para o painel de admin).
 * Utiliza a API autenticada.
 */
export const getAllEventos = async (): Promise<Evento[]> => {
  try {
    const response = await api.get<Evento[]>('/eventos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar todos os eventos:', error);
    return []; // Retorna array vazio em caso de erro
  }
};

/**
 * Busca a lista de eventos públicos e ativos da API.
 * Utiliza a API pública.
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

/**
 * Cria um novo evento (API POST).
 */
export const createEvento = async (data: CreateEventoDto): Promise<Evento> => {
    // É crucial formatar a data como string ISO para o backend
    const payload = {
        ...data,
        dataEvento: data.dataEvento.toISOString(),
    };
    const response = await api.post<Evento>('/eventos', payload);
    return response.data;
};

/**
 * Atualiza um evento existente (API PATCH).
 */
export const updateEvento = async (id: string, data: Partial<UpdateEventoDto>): Promise<Evento> => {
    // Trata a data para ISO string, se presente
    const payload: Partial<UpdateEventoDto & { dataEvento?: string }> = { ...data };
    if (data.dataEvento instanceof Date) {
        payload.dataEvento = data.dataEvento.toISOString();
    }

    const response = await api.patch<Evento>(`/eventos/${id}`, payload);
    return response.data;
};

/**
 * Altera o status (ativo/inativo) de um evento (função de conveniência para PATCH).
 */
export const toggleEventoStatus = async (id: string, ativo: boolean): Promise<Evento> => {
    // Reutiliza a função de atualização, enviando apenas o campo 'ativo'
    return updateEvento(id, { ativo });
};

/**
 * Remove um evento permanentemente (API DELETE).
 */
export const deleteEvento = async (id: string): Promise<void> => {
    await api.delete(`/eventos/${id}`);
};