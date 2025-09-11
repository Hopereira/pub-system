// Caminho: frontend/src/services/ambienteService.ts
import api from './api';

// A sua interface AmbienteData que já deve existir
export interface AmbienteData {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'PREPARO' | 'ATENDIMENTO';
  isPontoDeRetirada: boolean;
  productCount?: number;
  tableCount?: number;
}

export interface CreateAmbienteDto {
  nome: string;
  descricao?: string;
  tipo: 'PREPARO' | 'ATENDIMENTO';
  isPontoDeRetirada: boolean;
}

export type UpdateAmbienteDto = Partial<CreateAmbienteDto>;


export const getAmbientes = async (): Promise<AmbienteData[]> => {
  const response = await api.get<AmbienteData[]>('/ambientes');
  return response.data;
};

// --- ADICIONE ESTA NOVA FUNÇÃO ---
export const getAmbienteById = async (id: string): Promise<AmbienteData | null> => {
  try {
    const response = await api.get<AmbienteData>(`/ambientes/${id}`);
    return response.data;
  } catch (error) {
    // Se a API retornar 404, por exemplo, o erro será capturado aqui.
    console.error(`Erro ao buscar ambiente com ID ${id}:`, error);
    return null;
  }
};
// --- FIM DA ADIÇÃO ---

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