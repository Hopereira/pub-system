import api from './api';
import { MapaCompleto, AtualizarPosicaoDto } from '@/types/mapa';

export const mapaService = {
  /**
   * Obter mapa visual completo do estabelecimento
   */
  async getMapa(ambienteId: string): Promise<MapaCompleto> {
    try {
      const response = await api.get('/mesas/mapa/visualizar', {
        params: { ambienteId },
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar mapa:', error);
      throw error;
    }
  },

  /**
   * Atualizar posição de uma mesa (Admin)
   */
  async atualizarPosicaoMesa(
    mesaId: string,
    dados: AtualizarPosicaoDto,
  ): Promise<void> {
    try {
      await api.put(`/mesas/${mesaId}/posicao`, dados);
    } catch (error: unknown) {
      console.error('Erro ao atualizar posição da mesa:', error);
      throw error;
    }
  },

  /**
   * Atualizar posição de um ponto de entrega (Admin)
   */
  async atualizarPosicaoPonto(
    pontoId: string,
    dados: AtualizarPosicaoDto,
  ): Promise<void> {
    try {
      await api.put(`/pontos-entrega/${pontoId}/posicao`, dados);
    } catch (error: unknown) {
      console.error('Erro ao atualizar posição do ponto:', error);
      throw error;
    }
  },

  /**
   * Atualizar posições de múltiplas mesas em uma única requisição (Admin)
   * Evita rate limiting do Cloudflare
   */
  async atualizarPosicoesMesasBatch(
    mesas: Array<{
      id: string;
      posicao: { x: number; y: number };
      tamanho?: { width: number; height: number };
      rotacao?: number;
    }>,
  ): Promise<{ atualizadas: number }> {
    try {
      const response = await api.put('/mesas/posicoes/batch', { mesas });
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao atualizar posições das mesas em batch:', error);
      throw error;
    }
  },
};

export default mapaService;
