// Caminho: frontend/src/services/mesaService.ts

import { Mesa } from '@/types/mesa';
import { CreateMesaDto, UpdateMesaDto } from '@/types/mesa.dto';
import api from './api';
import { AxiosError } from 'axios'; // ALTERAÇÃO 1: Importamos o tipo AxiosError

export const getMesas = async (): Promise<Mesa[]> => {
  try {
    const response = await api.get('/mesas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    throw error;
  }
};

// --- NOVO: Buscar mesas por ambiente ---
export const getMesasByAmbiente = async (ambienteId: string): Promise<Mesa[]> => {
  try {
    const response = await api.get(`/mesas/ambiente/${ambienteId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar mesas do ambiente ${ambienteId}:`, error);
    throw error;
  }
};

// --- MÉTODO ATUALIZADO ---
export const createMesa = async (mesaData: CreateMesaDto): Promise<Mesa> => {
    try {
        const response = await api.post<Mesa>('/mesas', mesaData);
        return response.data;
    } catch (error) {
        // ALTERAÇÃO 2: Verificamos se o erro é uma instância do AxiosError
        if (error instanceof AxiosError && error.response) {
            // ALTERAÇÃO 3: Se o status for 409 (Conflict), lançamos um novo erro apenas com a mensagem do backend
            if (error.response.status === 409) {
                // A mensagem 'error.response.data.message' vem diretamente do nosso backend
                throw new Error(error.response.data.message || 'Esta mesa já existe.');
            }
        }
        // Se for qualquer outro erro, nós o relançamos
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

export const deleteMesa = async (id: string): Promise<void> => {
  try {
    await api.delete(`/mesas/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar mesa ${id}:`, error);
    throw error;
  }
};
