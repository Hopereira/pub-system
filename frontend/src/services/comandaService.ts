// Caminho: frontend/src/services/comandaService.ts

import { Comanda } from "@/types/comanda";
import api, { publicApi } from "./api";

export interface AbrirComandaDto {
  mesaId?: string;
  clienteId?: string;
}

export const getComandaById = async (id: string): Promise<Comanda> => {
    try {
        const response = await api.get<Comanda>(`/comandas/${id}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar comanda ${id}:`, error);
        throw error;
    }
}

export const getComandaAbertaPorMesa = async (mesaId: string): Promise<Comanda> => {
    try {
        const response = await api.get<Comanda>(`/comandas/mesa/${mesaId}/aberta`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar comanda aberta para a mesa ${mesaId}:`, error);
        throw error;
    }
}

export const abrirComanda = async (data: AbrirComandaDto): Promise<Comanda> => {
    try {
        const response = await api.post<Comanda>('/comandas', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        throw error;
    }
}

export const searchComandas = async (term: string): Promise<Comanda[]> => {
  if (!term) return [];
  try {
    const response = await api.get('/comandas/search', {
      params: { term },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar comandas:', error);
    throw error;
  }
};

export const fecharComanda = async (id: string): Promise<Comanda> => {
  try {
    const response = await api.patch<Comanda>(`/comandas/${id}/fechar`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao fechar comanda ${id}:`, error);
    throw error;
  }
};

/**
 * Busca os dados públicos de uma comanda, sem necessidade de autenticação.
 */
export const getPublicComandaById = async (id: string): Promise<Comanda | null> => {
  try {
    // CORREÇÃO: Ajustado de '/publica' para '/public' para corresponder ao backend
    const response = await publicApi.get<Comanda>(`/comandas/${id}/public`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar comanda pública ${id}:`, error);
    return null;
  }
};