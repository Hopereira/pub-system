// Caminho: frontend/src/services/eventoService.ts

import { Evento } from '@/types/evento';
import api, { publicApi } from './api';
import { CreateEventoDto, UpdateEventoDto } from '@/types/evento.dto';

/**
 * Busca a lista de TODOS os eventos (para o painel de admin).
 */
export const getAllEventos = async (): Promise<Evento[]> => {
  try {
    const response = await api.get<Evento[]>('/eventos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar todos os eventos:', error);
    return [];
  }
};

/**
 * Busca a lista de eventos públicos e ativos da API.
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
 * Busca um único evento pelo seu ID (para a página de edição do admin).
 * ACEITA UM TOKEN OPCIONAL PARA CHAMADAS DO LADO DO SERVIDOR.
 */
export const getEventoById = async (id: string, token?: string): Promise<Evento | null> => {
  try {
    // 1. Cria um objeto de cabeçalho vazio.
    const headers: { Authorization?: string } = {};

    // 2. Se um token for fornecido, adiciona-o ao cabeçalho.
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 3. Passa os cabeçalhos para a chamada da API.
    const response = await api.get<Evento>(`/eventos/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar o evento com ID ${id}:`, error);
    return null;
  }
};

/**
 * Cria um novo evento (API POST).
 */
export const createEvento = async (data: CreateEventoDto): Promise<Evento> => {
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
  // Cria payload com tipo correto para envio à API (dataEvento como string ISO)
  const payload: Omit<Partial<UpdateEventoDto>, 'dataEvento'> & { dataEvento?: string } = {
    titulo: data.titulo,
    descricao: data.descricao,
    valor: data.valor,
    ativo: data.ativo,
  };
  
  if (data.dataEvento instanceof Date) {
    payload.dataEvento = data.dataEvento.toISOString();
  }

  const response = await api.patch<Evento>(`/eventos/${id}`, payload);
  return response.data;
};

/**
 * Altera o status (ativo/inativo) de um evento.
 */
export const toggleEventoStatus = async (id: string, ativo: boolean): Promise<Evento> => {
  return updateEvento(id, { ativo });
};

/**
 * Remove um evento permanentemente (API DELETE).
 */
export const deleteEvento = async (id: string): Promise<void> => {
  await api.delete(`/eventos/${id}`);
};

/**
 * Faz o upload da imagem de um evento.
 */
export const uploadEventoImagem = async (id: string, imagemFile: File): Promise<Evento> => {
  const formData = new FormData();
  formData.append('file', imagemFile);

  try {
    const response = await api.patch<Evento>(`/eventos/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem do evento:', error);
    throw error;
  }
};

/**
 * ✅ NOVO: Busca um único evento pelo seu ID PUBLICAMENTE (necessário para a rota /entrada/[id]).
 * Assumimos que o backend tem um endpoint público (ex: /eventos/publicos/:id).
 */
export const getPublicEventoById = async (id: string): Promise<Evento | null> => {
  try {
    // Usamos a API pública para garantir que não exige token.
    const response = await publicApi.get<Evento>(`/eventos/publicos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar o evento público com ID ${id}:`, error);
    return null;
  }
};