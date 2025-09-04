// src/services/mesaService.ts
import { Mesa } from '@/types/mesa';
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