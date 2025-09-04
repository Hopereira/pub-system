// Caminho: frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  // CORRETO: A porta do seu backend é 3000, conforme o docker-compose.yml
  baseURL: 'http://localhost:3000', 
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;