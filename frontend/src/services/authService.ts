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
  const RESERVED = ['www', 'api', 'app', 'admin', 'mail', 'smtp'];
  const parts = hostname.split('.');
  if (parts.length >= 3 && !RESERVED.includes(parts[0])) {
    return parts[0]; // Primeiro segmento é o slug do tenant
  }
  
  return null;
};

/**
 * Login via BFF proxy route (/api/auth/login).
 * The request goes to the same-origin Next.js server, which proxies to the backend.
 * This avoids CORS and Cloudflare proxy issues.
 */
export const login = async (email: string, senha: string, explicitTenantSlug?: string) => {
  const tenantSlug = explicitTenantSlug || extractTenantSlug();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (tenantSlug) {
    headers['x-tenant-slug'] = tenantSlug;
  }

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, senha }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;
    throw new Error(errorMessage || 'Credenciais inválidas');
  }

  return data;
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
 * Faz logout no backend — revoga refresh token e limpa cookies httpOnly.
 * O access_token cookie é enviado automaticamente via withCredentials.
 * O parâmetro accessToken é opcional (fallback legado via Bearer header).
 */
export const logoutApi = async (accessToken?: string): Promise<void> => {
  try {
    await publicApi.post('/auth/logout', {}, {
      withCredentials: true,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  } catch {
    // Ignora erro no logout (token pode já estar expirado)
  }
};