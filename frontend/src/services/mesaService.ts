// Caminho: frontend/src/services/mesaService.ts

import { Mesa } from '@/types/mesa';
import { CreateMesaDto, UpdateMesaDto } from '@/types/mesa.dto';
import api from './api';

export const getMesas = async (): Promise<Mesa[]> => {
  try {
    const response = await api.get('/mesas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    throw error;
  }
};

export const createMesa = async (mesaData: CreateMesaDto): Promise<Mesa> => {
    try {
        const response = await api.post<Mesa>('/mesas', mesaData);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        throw error;
    }
}

export const updateMesa = async (id: string, mesaData: UpdateMesaDto): Promise<Mesa> => {
  try {
    const response = await api.patch<Mesa>(`/mesas/${id}`, mesaData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar mesa ${id}:`, error);
    throw error;
  }
}

// --- NOVO: Função para deletar uma mesa ---
export const deleteMesa = async (id: string): Promise<void> => {
  try {
    await api.delete(`/mesas/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar mesa ${id}:`, error);
    throw error;
  }
};