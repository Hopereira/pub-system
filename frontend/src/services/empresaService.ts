import { Empresa } from '@/types/empresa';
import { CreateEmpresaDto, UpdateEmpresaDto } from '@/types/empresa.dto';
import api from './api';
import { AxiosError } from 'axios';

/**
 * Busca o registro único da empresa.
 */
export const getEmpresa = async (): Promise<Empresa | null> => {
  try {
    const response = await api.get<Empresa>('/empresa');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      console.log('Empresa ainda não cadastrada (comportamento esperado).');
      return null;
    }
    console.error('Erro ao buscar empresa:', error);
    throw error;
  }
};

/**
 * Cria o registro da empresa.
 */
export const createEmpresa = async (data: CreateEmpresaDto): Promise<Empresa> => {
  const response = await api.post<Empresa>('/empresa', data);
  return response.data;
};

/**
 * Atualiza o registro da empresa.
 */
export const updateEmpresa = async (id: string, data: UpdateEmpresaDto): Promise<Empresa> => {
  const response = await api.patch<Empresa>(`/empresa/${id}`, data);
  return response.data;
};