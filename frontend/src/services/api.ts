// Caminho: frontend/src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { logger } from '@/lib/logger';

const isServer = typeof window === 'undefined';

// --- Instância 1: API Autenticada (para o admin) ---
const api = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 segundos
});

// Interceptor de Requisição - Log e autenticação
api.interceptors.request.use(
  (config) => {
    // Adiciona timestamp para calcular duração
    (config as any).metadata = { startTime: Date.now() };
    
    if (!isServer) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log da requisição
    logger.api('request', {
      method: config.method?.toUpperCase(),
      url: config.url,
    });
    
    return config;
  },
  (error: AxiosError) => {
    logger.error('Erro ao preparar requisição', { 
      module: 'API', 
      error: error as Error 
    });
    return Promise.reject(error);
  }
);

// Interceptor de Resposta - Log de sucesso/erro
api.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    const duration = config.metadata ? Date.now() - config.metadata.startTime : 0;
    
    logger.api('response', {
      method: config.method?.toUpperCase(),
      url: config.url,
      status: response.status,
      duration,
    });
    
    return response;
  },
  (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
    
    // Log detalhado de erros
    if (error.response) {
      // Erro do servidor (4xx, 5xx)
      logger.api('error', {
        method: config?.method?.toUpperCase(),
        url: config?.url,
        status: error.response.status,
        duration,
        error: error.response.data,
      });
      
      // Logs específicos por tipo de erro
      if (error.response.status === 401) {
        logger.warn('Sessão expirada - Token inválido', { module: 'API' });
        
        // Limpar token e redirecionar para login
        if (!isServer) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      } else if (error.response.status === 403) {
        logger.warn('Acesso negado - Permissão insuficiente', { module: 'API' });
      } else if (error.response.status >= 500) {
        logger.error('Erro interno do servidor', { 
          module: 'API', 
          data: error.response.data 
        });
      }
    } else if (error.request) {
      // Requisição enviada mas sem resposta (timeout/rede)
      logger.error('Sem resposta do servidor - Timeout ou erro de rede', {
        module: 'API',
        data: { url: config?.url, code: error.code },
      });
    } else {
      // Erro ao configurar a requisição
      logger.error('Erro ao configurar requisição', {
        module: 'API',
        error: error as Error,
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;

// --- Instância 2: API Pública (para o cliente) ---
export const publicApi = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 segundos
});

// Adiciona os mesmos interceptors de logging na API pública
publicApi.interceptors.request.use(
  (config) => {
    (config as any).metadata = { startTime: Date.now() };
    logger.api('request', {
      method: config.method?.toUpperCase(),
      url: config.url,
    });
    return config;
  },
  (error: AxiosError) => {
    logger.error('Erro ao preparar requisição pública', { 
      module: 'PublicAPI', 
      error: error as Error 
    });
    return Promise.reject(error);
  }
);

publicApi.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    const duration = config.metadata ? Date.now() - config.metadata.startTime : 0;
    
    logger.api('response', {
      method: config.method?.toUpperCase(),
      url: config.url,
      status: response.status,
      duration,
    });
    
    return response;
  },
  (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
    
    if (error.response) {
      logger.api('error', {
        method: config?.method?.toUpperCase(),
        url: config?.url,
        status: error.response.status,
        duration,
        error: error.response.data,
      });
    } else if (error.request) {
      logger.error('Sem resposta do servidor público - Timeout ou erro de rede', {
        module: 'PublicAPI',
        data: { url: config?.url, code: error.code },
      });
    }
    
    return Promise.reject(error);
  }
);