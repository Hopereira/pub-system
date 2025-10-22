import { PontoEntrega } from '@/types/ponto-entrega';
import { CreatePontoEntregaDto, UpdatePontoEntregaDto, UpdatePontoComandaDto } from '@/types/ponto-entrega.dto';
import api from './api';
import { logger } from '@/lib/logger';
import { AxiosError } from 'axios';

/**
 * Lista todos os pontos de entrega
 */
export const getPontosEntrega = async (): Promise<PontoEntrega[]> => {
  try {
    logger.debug('🔍 Buscando todos os pontos de entrega', { module: 'PontoEntregaService' });
    const response = await api.get<PontoEntrega[]>('/pontos-entrega');
    logger.log(`✅ ${response.data.length} pontos encontrados`, { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    logger.error('❌ Erro ao buscar pontos de entrega', {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Lista apenas pontos de entrega ativos
 */
export const getPontosEntregaAtivos = async (): Promise<PontoEntrega[]> => {
  try {
    logger.debug('🔍 Buscando pontos de entrega ativos', { module: 'PontoEntregaService' });
    const response = await api.get<PontoEntrega[]>('/pontos-entrega/ativos');
    logger.log(`✅ ${response.data.length} pontos ativos encontrados`, { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    logger.error('❌ Erro ao buscar pontos ativos', {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Busca um ponto de entrega por ID
 */
export const getPontoEntregaById = async (id: string): Promise<PontoEntrega> => {
  try {
    logger.debug(`🔍 Buscando ponto de entrega ${id}`, { module: 'PontoEntregaService' });
    const response = await api.get<PontoEntrega>(`/pontos-entrega/${id}`);
    logger.log(`✅ Ponto encontrado: ${response.data.nome}`, { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    logger.error(`❌ Erro ao buscar ponto ${id}`, {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Cria um novo ponto de entrega
 */
export const createPontoEntrega = async (data: CreatePontoEntregaDto): Promise<PontoEntrega> => {
  try {
    logger.log('📝 Criando novo ponto de entrega', {
      module: 'PontoEntregaService',
      data: { nome: data.nome },
    });
    const response = await api.post<PontoEntrega>('/pontos-entrega', data);
    logger.log(`✅ Ponto criado: ${response.data.nome}`, { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      if (error.response.status === 409) {
        const message = error.response.data.message || 'Este ponto de entrega já existe.';
        logger.warn(`⚠️ Conflito ao criar ponto: ${message}`, { module: 'PontoEntregaService' });
        throw new Error(message);
      }
    }
    logger.error('❌ Erro ao criar ponto de entrega', {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Atualiza um ponto de entrega
 */
export const updatePontoEntrega = async (
  id: string,
  data: UpdatePontoEntregaDto
): Promise<PontoEntrega> => {
  try {
    logger.log(`🔄 Atualizando ponto ${id}`, {
      module: 'PontoEntregaService',
      data,
    });
    const response = await api.patch<PontoEntrega>(`/pontos-entrega/${id}`, data);
    logger.log(`✅ Ponto atualizado: ${response.data.nome}`, { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    logger.error(`❌ Erro ao atualizar ponto ${id}`, {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Toggle status ativo/inativo de um ponto
 */
export const toggleAtivoPontoEntrega = async (id: string): Promise<PontoEntrega> => {
  try {
    logger.log(`🔄 Alterando status do ponto ${id}`, { module: 'PontoEntregaService' });
    const response = await api.patch<PontoEntrega>(`/pontos-entrega/${id}/toggle-ativo`);
    logger.log(`✅ Status alterado para: ${response.data.ativo ? 'ATIVO' : 'INATIVO'}`, {
      module: 'PontoEntregaService',
    });
    return response.data;
  } catch (error) {
    logger.error(`❌ Erro ao alterar status do ponto ${id}`, {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Deleta um ponto de entrega
 */
export const deletePontoEntrega = async (id: string): Promise<void> => {
  try {
    logger.log(`🗑️ Deletando ponto ${id}`, { module: 'PontoEntregaService' });
    await api.delete(`/pontos-entrega/${id}`);
    logger.log('✅ Ponto deletado com sucesso', { module: 'PontoEntregaService' });
  } catch (error) {
    logger.error(`❌ Erro ao deletar ponto ${id}`, {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};

/**
 * Atualiza o ponto de entrega de uma comanda (incluindo agregados)
 */
export const updatePontoComanda = async (
  comandaId: string,
  data: UpdatePontoComandaDto
): Promise<any> => {
  try {
    logger.log(`🔄 Atualizando ponto da comanda ${comandaId}`, {
      module: 'PontoEntregaService',
      data: { pontoId: data.pontoEntregaId, agregados: data.agregados?.length || 0 },
    });
    const response = await api.patch(`/comandas/${comandaId}/ponto-entrega`, data);
    logger.log('✅ Ponto da comanda atualizado', { module: 'PontoEntregaService' });
    return response.data;
  } catch (error) {
    logger.error(`❌ Erro ao atualizar ponto da comanda ${comandaId}`, {
      module: 'PontoEntregaService',
      error,
    });
    throw error;
  }
};
