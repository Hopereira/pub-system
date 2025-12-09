// src/services/authService.ts

import { publicApi } from './api';

export const login = async (email: string, senha: string) => {
  try {
    const response = await publicApi.post('/auth/login', {
      email,
      senha,
    });

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