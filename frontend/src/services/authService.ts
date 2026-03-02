// src/services/authService.ts

import { publicApi } from './api';

/**
 * Extrai o slug do tenant do hostname
 * Ex: casarao-pub-423.pubsystem.com.br -> casarao-pub-423
 */
const extractTenantSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Desenvolvimento local: localhost ou 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // Sem multi-tenant em dev local
  }
  
  // Produção: extrair primeiro segmento do subdomínio
  // Ex: casarao-pub-423.pubsystem.com.br -> casarao-pub-423
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0]; // Primeiro segmento é o slug do tenant
  }
  
  return null;
};

export const login = async (email: string, senha: string) => {
  try {
    const tenantSlug = extractTenantSlug();
    
    const response = await publicApi.post('/auth/login', {
      email,
      senha,
    }, { 
      withCredentials: true,
      headers: tenantSlug ? {
        'x-tenant-slug': tenantSlug, // Envia slug do tenant
      } : {},
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