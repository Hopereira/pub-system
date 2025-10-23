// Serviço para verificar se é o primeiro acesso ao sistema

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Verifica se é o primeiro acesso (não há usuários no sistema)
 * Usa o endpoint dedicado do backend
 */
export async function checkFirstAccess(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/funcionarios/check-first-access`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Erro ao verificar primeiro acesso:', response.status);
      return false;
    }

    const { isFirstAccess } = await response.json();
    return isFirstAccess;
  } catch (error) {
    console.error('Erro ao verificar primeiro acesso:', error);
    // Em caso de erro, assume que não é primeiro acesso (mais seguro)
    return false;
  }
}
