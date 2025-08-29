import axios from 'axios';

// A URL FINAL E CORRETA:
const API_URL = 'http://localhost:3333';

/**
 * Função para autenticar um usuário.
 * @param credentials - Um objeto contendo o email e a senha do usuário.
 * @returns Os dados retornados pela API em caso de sucesso (incluindo o token).
 * @throws Lança um erro se a autenticação falhar.
 */
export const login = async (credentials: any) => {
  try {
    // Faz uma requisição POST para o endpoint de login da API.
    const response = await axios.post(`${API_URL}/auth/login`, credentials);

    // Retorna os dados da resposta (ex: { access_token: '...' }).
    return response.data;
  } catch (error) {
    // Se houver um erro na requisição, o axios lança uma exceção.
    console.error('Falha na autenticação:', error);

    // Lançamos o erro novamente para que o componente saiba que algo deu errado.
    throw error;
  }
};