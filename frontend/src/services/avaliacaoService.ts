import api, { publicApi } from './api';
import { Avaliacao, CreateAvaliacaoDto, EstatisticasSatisfacao } from '@/types/avaliacao';
import { logger } from '@/lib/logger';

/**
 * Cria uma avaliação de cliente (usa API pública com X-Tenant-ID)
 * Esta função é usada na página de acesso do cliente após pagamento
 */
export const createAvaliacao = async (data: CreateAvaliacaoDto): Promise<Avaliacao> => {
  try {
    logger.log('⭐ Criando avaliação', {
      module: 'AvaliacaoService',
      data: { comandaId: data.comandaId, nota: data.nota },
    });
    // Usa publicApi que envia X-Tenant-ID baseado no subdomínio
    const response = await publicApi.post<Avaliacao>('/avaliacoes', data);
    logger.log('✅ Avaliação criada com sucesso', {
      module: 'AvaliacaoService',
      data: { avaliacaoId: response.data.id },
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar avaliação', {
      module: 'AvaliacaoService',
      error: error as Error,
    });
    throw error;
  }
};

export const getAvaliacoes = async (
  dataInicio?: Date,
  dataFim?: Date,
): Promise<Avaliacao[]> => {
  try {
    const params: Record<string, string> = {};
    if (dataInicio) params.dataInicio = dataInicio.toISOString();
    if (dataFim) params.dataFim = dataFim.toISOString();

    logger.debug('🔍 Buscando avaliações', {
      module: 'AvaliacaoService',
      data: params,
    });
    const response = await api.get<Avaliacao[]>('/avaliacoes', { params });
    logger.debug(`✅ ${response.data.length} avaliações encontradas`, {
      module: 'AvaliacaoService',
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar avaliações', {
      module: 'AvaliacaoService',
      error: error as Error,
    });
    throw error;
  }
};

export const getEstatisticasSatisfacao = async (
  dataInicio?: Date,
  dataFim?: Date,
): Promise<EstatisticasSatisfacao> => {
  try {
    const params: Record<string, string> = {};
    if (dataInicio) params.dataInicio = dataInicio.toISOString();
    if (dataFim) params.dataFim = dataFim.toISOString();

    logger.debug('📊 Buscando estatísticas de satisfação', {
      module: 'AvaliacaoService',
      data: params,
    });
    const response = await api.get<EstatisticasSatisfacao>('/avaliacoes/estatisticas', {
      params,
    });
    logger.log(
      `✅ Estatísticas obtidas | Média: ${response.data.mediaSatisfacao}/5 | Taxa: ${response.data.taxaSatisfacao}%`,
      { module: 'AvaliacaoService' },
    );
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar estatísticas', {
      module: 'AvaliacaoService',
      error: error as Error,
    });
    throw error;
  }
};

export const getEstatisticasDoDia = async (): Promise<EstatisticasSatisfacao> => {
  try {
    logger.debug('📊 Buscando estatísticas do dia', {
      module: 'AvaliacaoService',
    });
    const response = await api.get<EstatisticasSatisfacao>('/avaliacoes/estatisticas/hoje');
    logger.log(
      `✅ Estatísticas do dia | Média: ${response.data.mediaSatisfacao}/5 | Taxa: ${response.data.taxaSatisfacao}%`,
      { module: 'AvaliacaoService' },
    );
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do dia', {
      module: 'AvaliacaoService',
      error: error as Error,
    });
    throw error;
  }
};
