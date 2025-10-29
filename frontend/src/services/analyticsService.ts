import { api } from '@/lib/api';
import { RelatorioGeral, FiltroRelatorio, PedidoTempo } from '@/types/analytics';
import { logger } from '@/lib/logger';

/**
 * Serviço para buscar dados de analytics e relatórios
 */

/**
 * Busca relatório geral com todas as métricas
 */
export const getRelatorioGeral = async (filtro?: FiltroRelatorio): Promise<RelatorioGeral> => {
  try {
    logger.log('📊 Buscando relatório geral', {
      module: 'AnalyticsService',
      data: filtro,
    });

    const params = new URLSearchParams();
    
    if (filtro?.dataInicio) {
      params.append('dataInicio', filtro.dataInicio.toISOString());
    }
    if (filtro?.dataFim) {
      params.append('dataFim', filtro.dataFim.toISOString());
    }
    if (filtro?.ambienteId) {
      params.append('ambienteId', filtro.ambienteId);
    }
    if (filtro?.funcionarioId) {
      params.append('funcionarioId', filtro.funcionarioId);
    }
    if (filtro?.limite) {
      params.append('limite', filtro.limite.toString());
    }

    const response = await api.get<RelatorioGeral>(
      `/analytics/pedidos/relatorio-geral?${params.toString()}`
    );

    logger.log('✅ Relatório geral carregado', {
      module: 'AnalyticsService',
      data: {
        totalPedidos: response.data.resumo.totalPedidos,
        garcons: response.data.garcons.length,
        ambientes: response.data.ambientes.length,
      },
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Erro ao buscar relatório geral', {
      module: 'AnalyticsService',
      error: error as Error,
    });
    throw error;
  }
};

/**
 * Busca tempos detalhados de pedidos
 */
export const getTemposPedidos = async (filtro?: FiltroRelatorio): Promise<PedidoTempo[]> => {
  try {
    logger.log('⏱️ Buscando tempos de pedidos', {
      module: 'AnalyticsService',
      data: filtro,
    });

    const params = new URLSearchParams();
    
    if (filtro?.dataInicio) {
      params.append('dataInicio', filtro.dataInicio.toISOString());
    }
    if (filtro?.dataFim) {
      params.append('dataFim', filtro.dataFim.toISOString());
    }
    if (filtro?.limite) {
      params.append('limite', filtro.limite.toString());
    }

    const response = await api.get<PedidoTempo[]>(
      `/analytics/pedidos/tempos?${params.toString()}`
    );

    logger.log('✅ Tempos de pedidos carregados', {
      module: 'AnalyticsService',
      data: { total: response.data.length },
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Erro ao buscar tempos de pedidos', {
      module: 'AnalyticsService',
      error: error as Error,
    });
    throw error;
  }
};
