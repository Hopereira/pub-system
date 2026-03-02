// src/services/authService.ts

import { publicApi } from './api';

export const login = async (email: string, senha: string) => {
  try {
    const response = await publicApi.post('/auth/login', {
      email,
      senha,
    }, { withCredentials: true });

    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string | string[] } }; message?: string };
    if (err.response) {
      const errorMessage = Array.isArray(err.response.data?.message)
        ? err.response.data.message.join(', ')
        : err.response.data?.message;
      throw new Error(errorMessage || 'Credenciais inválidas');
    }
    throw new Error('Não foi possível conectar ao servidor.');
  }
};

/**
 * Renova o access_token usando o refresh_token httpOnly cookie.
 * O cookie é enviado automaticamente via withCredentials.
 */
export const refreshToken = async (): Promise<{ access_token: string; tenant_id?: string }> => {
  const response = await publicApi.post('/auth/refresh', {}, { withCredentials: true });
  return response.data;
};

/**
 * Faz logout no backend — revoga refresh token e limpa cookie httpOnly.
 */
export const logoutApi = async (accessToken: string): Promise<void> => {
  try {
    await publicApi.post('/auth/logout', {}, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Ignora erro no logout (token pode já estar expirado)
  }
};