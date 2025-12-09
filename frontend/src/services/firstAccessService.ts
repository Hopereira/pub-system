// Serviço para verificar se é o primeiro acesso ao sistema

import { publicApi } from './api';

/**
 * Verifica se é o primeiro acesso (não há usuários no sistema)
 * Usa o endpoint dedicado do backend
 */
export async function checkFirstAccess(): Promise<boolean> {
  try {
    const response = await publicApi.get('/funcionarios/check-first-access');
    return response.data?.isFirstAccess ?? false;
  } catch {
    // Em caso de erro, assume que não é primeiro acesso (mais seguro)
    return false;
  }
}
