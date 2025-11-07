import api from '@/lib/axios';
import { RankingResponse, EstatisticasGarcom } from '@/types/ranking';

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
 * Busca medalhas de um garçom (TODO: implementar no backend)
 */
export async function getMedalhas(garcomId: string) {
  // TODO: Implementar endpoint no backend
  // const response = await api.get(`/analytics/garcons/${garcomId}/medalhas`);
  // return response.data;
  return [];
}
