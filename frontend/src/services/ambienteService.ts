// Caminho: frontend/src/services/ambienteService.ts
import api from './api';

// Interface completa com todos os dados que vêm da API
export interface AmbienteData {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'PREPARO' | 'ATENDIMENTO';
  isPontoDeRetirada: boolean;
  productCount?: number; // Contagem de produtos associados
  tableCount?: number;   // Contagem de mesas associadas
}

// DTO de criação completo, com todos os campos do formulário
export interface CreateAmbienteDto {
  nome: string;
  descricao?: string;
  tipo: 'PREPARO' | 'ATENDIMENTO';
  isPontoDeRetirada: boolean;
}

// Usamos um tipo parcial do DTO de criação para as atualizações.
export type UpdateAmbienteDto = Partial<CreateAmbienteDto>;

export const getAmbientes = async (): Promise<AmbienteData[]> => {
  const response = await api.get<AmbienteData[]>('/ambientes');
  return response.data;
};

export const createAmbiente = async (data: CreateAmbienteDto): Promise<AmbienteData> => {
  const response = await api.post<AmbienteData>('/ambientes', data);
  return response.data;
};

// Função de atualização corrigida para usar PUT
export const updateAmbiente = async (id: string, data: UpdateAmbienteDto): Promise<AmbienteData> => {
  // CORRIGIDO: Voltamos a usar PUT para corresponder ao backend.
  const response = await api.put<AmbienteData>(`/ambientes/${id}`, data);
  return response.data;
};

export const deleteAmbiente = async (id: string): Promise<void> => {
  await api.delete(`/ambientes/${id}`);
};