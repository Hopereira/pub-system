'use client';

import React, { createContext, useState, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { login as apiLogin, logoutApi, refreshToken } from '@/services/authService';
import { LoginCredentials, User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  /** Ref compartilhado para o access_token em memória (usado pelo SocketContext) */
  tokenRef: React.RefObject<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // SECURITY: Token mantido APENAS em memória React (useRef + useState).
  // O httpOnly cookie é a fonte autoritativa para a API.
  // Este estado em memória é usado somente para: (1) decode user info, (2) WebSocket handshake.
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sincroniza tokenRef com token state
  const updateToken = useCallback((newToken: string | null) => {
    tokenRef.current = newToken;
    setToken(newToken);
  }, []);

  // Na inicialização, tenta recuperar sessão via cookie httpOnly (chamando /auth/me ou /auth/refresh)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // MIGRATION FALLBACK: Se ainda houver token no sessionStorage (deploy anterior),
        // usa-lo para a transição e removê-lo
        const legacyToken = sessionStorage.getItem('authToken');
        if (legacyToken) {
          try {
            const decoded = jwtDecode<User & { exp?: number }>(legacyToken);
            const isExpired = decoded.exp ? Date.now() / 1000 > decoded.exp : false;
            if (!isExpired) {
              setUser(decoded);
              updateToken(legacyToken);
              logger.log('🔄 Sessão restaurada do sessionStorage (legado)', { module: 'Auth' });
            }
          } catch {
            // Token inválido
          }
          // Remove o token legado — a partir de agora usa apenas cookie
          sessionStorage.removeItem('authToken');
          document.cookie = 'authSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          return;
        }

        // NORMAL FLOW: Tenta refresh via httpOnly cookie para restaurar sessão
        // Se o cookie access_token existir e for válido, o backend retorna user info
        const result = await refreshToken();
        if (result.access_token) {
          const decoded: User = jwtDecode(result.access_token);
          setUser(decoded);
          updateToken(result.access_token);
          logger.log('🔑 Sessão restaurada via refresh cookie', { module: 'Auth' });
        }
      } catch {
        // Sem sessão válida — usuário não logado
        logger.debug('Sem sessão ativa (normal para visitantes)', { module: 'Auth' });
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [updateToken]);

  // Sincroniza estado React quando o interceptor do api.ts faz refresh transparente
  useEffect(() => {
    const handleRefreshed = (e: Event) => {
      const newToken = (e as CustomEvent).detail?.token;
      if (newToken) {
        try {
          const decoded: User = jwtDecode(newToken);
          setUser(decoded);
          updateToken(newToken);
        } catch { /* token inválido, ignora */ }
      }
    };
    window.addEventListener('authTokenRefreshed', handleRefreshed);
    return () => window.removeEventListener('authTokenRefreshed', handleRefreshed);
  }, [updateToken]);

  const login = async ({ email, senha, tenantSlug }: LoginCredentials) => {
    // Verifica se está trocando de tenant (empresaId diferente)
    const oldEmpresaId = user?.empresaId || null;
    
    const loginResponse = await apiLogin(email, senha, tenantSlug);
    const { access_token } = loginResponse;
    const decodedUser: User = jwtDecode(access_token);
    const newEmpresaId = decodedUser.empresaId || null;

    // SECURITY: Token em memória apenas — o httpOnly cookie foi setado pelo backend
    updateToken(access_token);
    
    // Se mudou de tenant, força reload completo para limpar todo o cache/estado
    if (oldEmpresaId && newEmpresaId && oldEmpresaId !== newEmpresaId) {
      window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
      window.location.reload();
      return loginResponse;
    }
    
    setUser(decodedUser);
    
    // Dispara evento customizado para reconectar WebSocket na mesma aba
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
    
    // Retorna a resposta completa para que o componente possa acessar user.cargo
    return loginResponse;
  };

  const logout = async () => {
    // Revoga refresh token no backend e limpa httpOnly cookies
    try {
      await logoutApi();
    } catch {
      // Ignora erro no logout (token pode já estar expirado)
    }

    setUser(null);
    updateToken(null);
    
    // Limpa legado (se existir)
    sessionStorage.removeItem('authToken');
    document.cookie = 'authSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Dispara evento customizado para desconectar WebSocket
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: false } }));
    
    // Força reload completo para limpar todo cache e estado React
    // Isso garante que dados do tenant anterior não vazem
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, tokenRef }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};