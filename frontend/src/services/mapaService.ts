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
};

export default mapaService;
