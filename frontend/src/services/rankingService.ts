import api from '@/services/api';
import { RankingResponse, EstatisticasGarcom, Medalha } from '@/types/ranking';

/**
 * Busca o ranking de garçons
 */
export async function getRanking(
  periodo: 'hoje' | 'semana' | 'mes' = 'hoje',
  ambienteId?: string,
  limite?: number
): Promise<RankingResponse> {
  const params = new URLSearchParams();
  params.append('periodo', periodo);
  if (ambienteId) params.append('ambienteId', ambienteId);
  if (limite) params.append('limite', limite.toString());

  const response = await api.get(`/analytics/garcons/ranking?${params.toString()}`);
  return response.data;
}

/**
 * Busca estatísticas detalhadas de um garçom
 */
export async function getEstatisticas(
  garcomId: string,
  periodo: 'hoje' | 'semana' | 'mes' = 'hoje'
): Promise<EstatisticasGarcom> {
  const response = await api.get(`/analytics/garcons/${garcomId}/estatisticas`, {
    params: { periodo },
  });
  return response.data;
}

/**
 * Busca medalhas conquistadas por um garçom
 */
export async function getMedalhas(garcomId: string): Promise<Medalha[]> {
  const response = await api.get(`/medalhas/garcom/${garcomId}`);
  return response.data;
}

/**
 * Busca progresso de medalhas de um garçom
 */
export async function getProgressoMedalhas(garcomId: string) {
  const response = await api.get(`/medalhas/garcom/${garcomId}/progresso`);
  return response.data;
}

/**
 * Verifica se há novas medalhas conquistadas
 */
export async function verificarNovasMedalhas(garcomId: string): Promise<Medalha[]> {
  const response = await api.get(`/medalhas/garcom/${garcomId}/verificar`);
  return response.data;
}
