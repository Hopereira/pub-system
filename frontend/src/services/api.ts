import axios from 'axios';

// Determinamos a URL base dinamicamente
const baseURL = typeof window === 'undefined' 
  ? process.env.API_URL_SERVER // Se estiver no servidor, use a URL interna do Docker
  : process.env.NEXT_PUBLIC_API_URL; // Se estiver no navegador, use a URL pública

const api = axios.create({
  baseURL: baseURL,
});

// O resto do ficheiro continua exatamente igual...
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
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