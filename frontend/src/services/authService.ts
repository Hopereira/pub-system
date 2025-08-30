// src/services/authService.ts (Com depuração)

import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const login = async (email: string, senha: string) => {
  try {
    // A LINHA MÁGICA PARA DEPURAÇÃO:
    console.log('Enviando para a API:', { email, senha });

    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      senha,
    });

    return response.data;
  } catch (error: any) {
    console.error('Falha na autenticação:', error.response?.data || error.message);
    if (error.response) {
        // Converte a resposta de erro (que pode ser um array) para uma string
        const errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(',')
          : error.response.data.message;
        throw new Error(errorMessage || 'Credenciais inválidas');
    }
    throw new Error('Não foi possível conectar ao servidor.');
  }
};