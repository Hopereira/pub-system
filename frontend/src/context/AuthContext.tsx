'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login as apiLogin, logoutApi } from '@/services/authService';
import { LoginCredentials, User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // TODO: Migrar para memória (useRef no AuthContext)
      // e passar token via header de API calls diretas do Context
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decoded = jwtDecode<User & { exp?: number }>(storedToken);

        // Verificar expiração antes de aceitar o token
        const isExpired = decoded.exp
          ? Date.now() / 1000 > decoded.exp
          : false;

        if (isExpired) {
          // Token expirado — limpar e deixar o interceptor tentar refresh
          localStorage.removeItem('authToken');
          document.cookie = 'authSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          // Não setar user — deixa isLoading = false sem user
        } else {
          setUser(decoded);
          setToken(storedToken);
        }
      }
    } catch (error) {
      console.error("Failed to decode token from localStorage", error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincroniza estado React quando o interceptor do api.ts faz refresh transparente
  useEffect(() => {
    const handleRefreshed = (e: Event) => {
      const newToken = (e as CustomEvent).detail?.token;
      if (newToken) {
        try {
          const decoded: User = jwtDecode(newToken);
          setUser(decoded);
          setToken(newToken);
        } catch { /* token inválido, ignora */ }
      }
    };
    window.addEventListener('authTokenRefreshed', handleRefreshed);
    return () => window.removeEventListener('authTokenRefreshed', handleRefreshed);
  }, []);

  const login = async ({ email, senha, tenantSlug }: LoginCredentials) => {
    // Verifica se está trocando de tenant (empresaId diferente)
    const oldToken = localStorage.getItem('authToken');
    let oldEmpresaId: string | null = null;
    
    if (oldToken) {
      try {
        const oldDecodedUser: User = jwtDecode(oldToken);
        oldEmpresaId = oldDecodedUser.empresaId || null;
      } catch {
        // Token inválido, ignora
      }
    }
    
    const loginResponse = await apiLogin(email, senha, tenantSlug);
    const { access_token } = loginResponse;
    const decodedUser: User = jwtDecode(access_token);
    const newEmpresaId = decodedUser.empresaId || null;

    // TODO: Migrar para memória (useRef no AuthContext)
    // e passar token via header de API calls diretas do Context
    localStorage.setItem('authToken', access_token);
    // Sinaliza presença de sessão para o middleware via cookie simples
    document.cookie = 'authSession=1; path=/; SameSite=Lax';
    
    // Se mudou de tenant, força reload completo para limpar todo o cache/estado
    if (oldEmpresaId && newEmpresaId && oldEmpresaId !== newEmpresaId) {
      // Não atualiza estado React - vai dar reload de qualquer forma
      window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
      
      // Força reload completo para limpar todo cache e estado React
      window.location.reload();
      return loginResponse;
    }
    
    setUser(decodedUser);
    setToken(access_token);
    
    // Dispara evento customizado para reconectar WebSocket na mesma aba
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
    
    // Retorna a resposta completa para que o componente possa acessar user.cargo
    return loginResponse;
  };

  const logout = async () => {
    // Revoga refresh token no backend e limpa httpOnly cookie
    const currentToken = token || localStorage.getItem('authToken');
    if (currentToken) {
      await logoutApi(currentToken);
    }

    localStorage.removeItem('authToken');
    document.cookie = 'authSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setToken(null);
    
    // Dispara evento customizado para reconectar WebSocket na mesma aba
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: false } }));
    
    // Força reload completo para limpar todo cache e estado React
    // Isso garante que dados do tenant anterior não vazem
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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