// Caminho: frontend/src/services/ambienteService.ts
import api from './api';
import { AmbienteData, CreateAmbienteDto, UpdateAmbienteDto } from '@/types/ambiente'; // Assumindo que os tipos estão aqui

export const getAmbientes = async (): Promise<AmbienteData[]> => {
  const response = await api.get<AmbienteData[]>('/ambientes');
  return response.data;
};

// --- MÉTODO ATUALIZADO ---
export const getAmbienteById = async (id: string, token?: string): Promise<AmbienteData | null> => {
  try {
    // Se um token for fornecido (do servidor), nós o usamos.
    // Senão, o interceptor do Axios (para o navegador) fará o trabalho.
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    const response = await api.get<AmbienteData>(`/ambientes/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ambiente com ID ${id}:`, error);
    // Retornamos null para que a página possa lidar com o erro graciosamente
    return null;
  }
};
// --- FIM DA ATUALIZAÇÃO ---


export const createAmbiente = async (data: CreateAmbienteDto): Promise<AmbienteData> => {
  const response = await api.post<AmbienteData>('/ambientes', data);
  return response.data;
};

export const updateAmbiente = async (id: string, data: UpdateAmbienteDto): Promise<AmbienteData> => {
  const response = await api.put<AmbienteData>(`/ambientes/${id}`, data);
  return response.data;
};

export const deleteAmbiente = async (id: string): Promise<void> => {
  await api.delete(`/ambientes/${id}`);
};