import { Empresa } from '@/types/empresa';
import { CreateEmpresaDto, UpdateEmpresaDto } from '@/types/empresa.dto';
import api from './api';
import { AxiosError } from 'axios';

/**
 * Busca o registro único da empresa.
 * Espera um objeto, não um array.
 */
export const getEmpresa = async (): Promise<Empresa | null> => {
  try {
    // Chama a rota específica para buscar o recurso único
    const response = await api.get<Empresa>('/empresas/unica');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      console.log('Empresa ainda não cadastrada.');
      return null; // Comportamento esperado quando o DB está vazio
    }
    console.error('Erro ao buscar empresa:', error);
    throw error; // Lança outros erros para serem tratados pela UI
  }
};

/**
 * Cria o registro da empresa.
 */
export const createEmpresa = async (data: CreateEmpresaDto): Promise<Empresa> => {
  const response = await api.post<Empresa>('/empresas', data);
  return response.data;
};

/**
 * Atualiza o registro da empresa.
 */
export const updateEmpresa = async (id: string, data: UpdateEmpresaDto): Promise<Empresa> => {
  const response = await api.patch<Empresa>(`/empresas/${id}`, data);
  return response.data;
};