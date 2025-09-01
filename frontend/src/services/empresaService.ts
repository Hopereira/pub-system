// Caminho: frontend/src/services/empresaService.ts
import api from './api';

// CORRIGIDO: Alinhamos os nomes dos campos com o DTO do backend
export interface EmpresaData {
  id?: string;
  nomeFantasia: string; // Renomeado de 'nome'
  razaoSocial: string;  // Adicionado
  cnpj: string;
  endereco: string;
  telefone: string;
}

export const getEmpresa = async (): Promise<EmpresaData | null> => {
  try {
    const response = await api.get<EmpresaData>('/empresa');
    return response.data;
  } catch (error) {
    console.error("Empresa ainda não cadastrada.", error);
    return null;
  }
};

export const createOrUpdateEmpresa = async (data: Partial<EmpresaData>): Promise<EmpresaData> => {
  if (data.id) {
    const response = await api.put<EmpresaData>(`/empresa/${data.id}`, data);
    return response.data;
  } else {
    const response = await api.post<EmpresaData>('/empresa', data);
    return response.data;
  }
};