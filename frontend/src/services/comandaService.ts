// frontend/src/services/comandaService.ts
import { Comanda } from "@/types/comanda";
import { CreateComandaDto } from "@/types/comanda.dto";
import { UpdatePontoComandaDto } from "@/types/ponto-entrega.dto";
import api, { publicApi } from "./api";
import { logger } from "@/lib/logger";

// Buscar todas as comandas
export const getAllComandas = async (): Promise<Comanda[]> => {
    try {
        const response = await api.get<Comanda[]>('/comandas');
        return response.data;
    } catch (error) {
        logger.error('Erro ao buscar todas as comandas', { module: 'ComandaService', error: error as Error });
        throw error;
    }
}

// Buscar comandas abertas (usa search sem termo para retornar todas abertas)
export const getComandasAbertas = async (): Promise<Comanda[]> => {
    try {
        const response = await api.get<Comanda[]>('/comandas/search');
        return response.data;
    } catch (error) {
        logger.error('Erro ao buscar comandas abertas', { module: 'ComandaService', error: error as Error });
        throw error;
    }
}

// Esta função é para uso interno, por funcionários já logados
export const abrirComanda = async (data: CreateComandaDto): Promise<Comanda> => {
    try {
        const response = await api.post<Comanda>('/comandas', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        throw error;
    }
}

// ✅ NOVA FUNÇÃO ADICIONADA: para o cliente se cadastrar sem estar logado
export const abrirComandaPublica = async (data: CreateComandaDto): Promise<Comanda> => {
  try {
    const response = await publicApi.post<Comanda>('/comandas', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao abrir comanda pública:', error);
    throw error;
  }
}

// ... (resto do arquivo)
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

export const getPublicComandaById = async (id: string): Promise<Comanda | null> => {
  try {
    const response = await publicApi.get<Comanda>(`/comandas/${id}/public`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar comanda pública ${id}:`, error);
    return null;
  }
};

export const updateComanda = async (
  id: string,
  data: { mesaId?: string | null; pontoEntregaId?: string | null }
): Promise<Comanda> => {
  try {
    logger.log('🔄 Atualizando local da comanda (público)', {
      module: 'ComandaService',
      data: { id, ...data },
    });

    // Usar publicApi para endpoint público
    const response = await publicApi.patch<Comanda>(`/comandas/${id}/local`, data);

    logger.log('✅ Local da comanda atualizado', { module: 'ComandaService' });
    return response.data;
  } catch (error) {
    logger.error('❌ Erro ao atualizar local da comanda', {
      module: 'ComandaService',
      error: error as Error,
    });
    throw error;
  }
};