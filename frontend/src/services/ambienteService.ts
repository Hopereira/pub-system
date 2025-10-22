// Caminho: frontend/src/services/ambienteService.ts
import api from './api';
import { Ambiente } from '@/types/ambiente';

// Re-export para facilitar importação em outros arquivos
export type { Ambiente };
export type AmbienteData = Ambiente;

export const getAmbientes = async (): Promise<Ambiente[]> => {
  const response = await api.get<Ambiente[]>('/ambientes');
  return response.data;
};

export const getAmbienteById = async (id: string, token?: string): Promise<Ambiente | null> => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await api.get<Ambiente>(`/ambientes/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ambiente com ID ${id}:`, error);
    return null;
  }
};

export const createAmbiente = async (data: Partial<Ambiente>): Promise<Ambiente> => {
  const response = await api.post<Ambiente>('/ambientes', data);
  return response.data;
};

export const updateAmbiente = async (id: string, data: Partial<Ambiente>): Promise<Ambiente> => {
  const response = await api.put<Ambiente>(`/ambientes/${id}`, data);
  return response.data;
};

export const deleteAmbiente = async (id: string): Promise<void> => {
  await api.delete(`/ambientes/${id}`);
};