// Caminho: frontend/src/services/ambienteService.ts
import api from './api';
import { AmbienteData } from '@/types/ambiente'; // Supondo que você tenha um tipo definido


export interface AmbienteData {
  id: string;
  nome: string;
}

export interface CreateAmbienteDto {
  nome: string;
}

// NOVA INTERFACE: Para os dados de atualização
export interface UpdateAmbienteDto {
  nome: string;
}

export const getAmbientes = async (): Promise<AmbienteData[]> => {
  const response = await api.get<AmbienteData[]>('/ambientes');
  return response.data;
};

export const createAmbiente = async (data: CreateAmbienteDto): Promise<AmbienteData> => {
  const response = await api.post<AmbienteData>('/ambientes', data);
  return response.data;
};

// NOVA FUNÇÃO: para atualizar um ambiente existente
export const updateAmbiente = async (id: string, data: UpdateAmbienteDto): Promise<AmbienteData> => {
  const response = await api.put<AmbienteData>(`/ambientes/${id}`, data);
  return response.data;
};

export const deleteAmbiente = async (id: string): Promise<void> => {
  await api.delete(`/ambientes/${id}`);
};