// Caminho: frontend/src/services/ambienteService.ts
import api from './api';
import { Ambiente } from '@/types/ambiente';

// Re-export para facilitar importação em outros arquivos
export type { Ambiente };
export type AmbienteData = Ambiente;

// Cache para evitar 429: Sidebar + MobileMenu + página chamam getAmbientes() simultaneamente
let _ambientesCache: { data: Ambiente[]; timestamp: number } | null = null;
let _ambientesInflight: Promise<Ambiente[]> | null = null;
const AMBIENTES_CACHE_TTL = 30000; // 30 segundos

export const getAmbientes = async (): Promise<Ambiente[]> => {
  const now = Date.now();
  if (_ambientesCache && (now - _ambientesCache.timestamp < AMBIENTES_CACHE_TTL)) {
    return _ambientesCache.data;
  }
  if (_ambientesInflight) {
    return _ambientesInflight;
  }
  _ambientesInflight = api.get<Ambiente[]>('/ambientes')
    .then(res => {
      _ambientesCache = { data: res.data, timestamp: Date.now() };
      _ambientesInflight = null;
      return res.data;
    })
    .catch(err => {
      _ambientesInflight = null;
      throw err;
    });
  return _ambientesInflight;
};

export const getAmbienteById = async (id: string, token?: string): Promise<Ambiente | null> => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await api.get<Ambiente>(`/ambientes/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ambiente com ID ${id}:`, error);
    return null;
  }
};

export const createAmbiente = async (data: Partial<Ambiente>): Promise<Ambiente> => {
  const response = await api.post<Ambiente>('/ambientes', data);
  return response.data;
};

export const updateAmbiente = async (id: string, data: Partial<Ambiente>): Promise<Ambiente> => {
  const response = await api.put<Ambiente>(`/ambientes/${id}`, data);
  // Limpar cache local para forçar atualização
  _ambientesCache = null;
  _ambientesInflight = null;
  return response.data;
};

export const deleteAmbiente = async (id: string): Promise<void> => {
  await api.delete(`/ambientes/${id}`);
  // Limpar cache local para forçar atualização
  _ambientesCache = null;
  _ambientesInflight = null;
};

// Função para limpar cache manualmente (útil após update/delete)
export const clearAmbientesCache = (): void => {
  _ambientesCache = null;
  _ambientesInflight = null;
};