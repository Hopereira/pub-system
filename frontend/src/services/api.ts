// Caminho: frontend/src/services/api.ts
import axios from 'axios';

const isServer = typeof window === 'undefined';

// --- Instância 1: API Autenticada (para o admin) ---
const api = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  (config) => {
    if (!isServer) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;


// --- Instância 2: API Pública (para o cliente) ---
export const publicApi = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
});