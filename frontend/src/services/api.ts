// Caminho: frontend/src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '@/lib/logger';

const isServer = typeof window === 'undefined';

// URL da API - usa API_URL_SERVER no servidor, ou fallback para NEXT_PUBLIC_API_URL
const getApiBaseUrl = () => {
  if (isServer) {
    return process.env.API_URL_SERVER || process.env.NEXT_PUBLIC_API_URL || 'https://api.pubsystem.com.br';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.pubsystem.com.br';
};

// --- Instância 1: API Autenticada (para o admin) ---
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 segundos
  withCredentials: true, // Envia httpOnly cookies (refresh_token)
});

// --- Token refresh state (module-level, não exportado) ---
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

// Configurar retry logic
axiosRetry(api, {
  retries: 3, // Tentar até 3 vezes
  retryDelay: axiosRetry.exponentialDelay, // Delay exponencial (1s, 2s, 4s)
  retryCondition: (error) => {
    // Retry apenas em erros de rede ou 5xx
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn(`Tentativa ${retryCount} de retry`, {
      module: 'API',
      data: { url: requestConfig.url, error: error.message }
    });
  }
});

// Interceptor de Requisição - Log e autenticação
api.interceptors.request.use(
  (config) => {
    // Adiciona timestamp para calcular duração
    (config as any).metadata = { startTime: Date.now() };
    
    if (!isServer) {
      // TODO: Migrar para memória (ler do AuthContext via ref compartilhado)
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
  async (error: AxiosError) => {
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
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Não tentar refresh em rotas de auth (evita loop)
        const isAuthRoute = originalRequest?.url?.includes('/auth/');
        if (!isAuthRoute && originalRequest && !originalRequest._retry && !isServer) {
          if (isRefreshing) {
            // Já está refreshing — enfileira esta request
            return new Promise((resolve, reject) => {
              failedQueue.push({
                resolve: (newToken: string) => {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  resolve(api(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Tenta renovar via httpOnly cookie
            const refreshRes = await axios.post(
              `${getApiBaseUrl()}/auth/refresh`,
              {},
              { withCredentials: true },
            );
            const newToken = refreshRes.data.access_token || refreshRes.data.accessToken;

            // TODO: Migrar para memória (notificar AuthContext via ref compartilhado)
            localStorage.setItem('authToken', newToken);
            window.dispatchEvent(new CustomEvent('authTokenRefreshed', { detail: { token: newToken } }));

            processQueue(null, newToken);

            // Retry da request original com novo token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            logger.warn('Refresh token expirado — redirecionando para login', { module: 'API' });
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        // Fallback: se é rota de auth ou já tentou retry
        logger.warn('Sessão expirada - Token inválido', { module: 'API' });
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
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 segundos
});

/**
 * Extrai o slug do tenant do subdomínio atual
 * Ex: casarao-pub-423.pubsystem.com.br → casarao-pub-423
 */
const getTenantSlugFromHostname = (): string | null => {
  if (isServer) return null;
  
  const hostname = window.location.hostname;
  // Ignora localhost e domínios sem subdomínio
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
  
  // Extrai subdomínio: casarao-pub-423.pubsystem.com.br → casarao-pub-423
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    return parts[0];
  }
  
  return null;
};

// Adiciona os mesmos interceptors de logging na API pública
publicApi.interceptors.request.use(
  (config) => {
    (config as any).metadata = { startTime: Date.now() };
    
    // Adiciona X-Tenant-ID baseado no subdomínio atual
    const tenantSlug = getTenantSlugFromHostname();
    if (tenantSlug) {
      config.headers['X-Tenant-ID'] = tenantSlug;
    }
    
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