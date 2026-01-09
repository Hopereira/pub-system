'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '@/services/authService';
import { LoginCredentials, User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decodedUser: User = jwtDecode(storedToken);
        setUser(decodedUser);
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to decode token from localStorage", error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async ({ email, senha }: LoginCredentials) => {
    // 🔄 Verifica se está trocando de tenant (empresaId diferente)
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
    
    const { access_token } = await apiLogin(email, senha);
    const decodedUser: User = jwtDecode(access_token);
    const newEmpresaId = decodedUser.empresaId || null;

    localStorage.setItem('authToken', access_token);
    
    // 🚨 Se mudou de tenant, força reload completo para limpar todo o cache/estado
    if (oldEmpresaId && newEmpresaId && oldEmpresaId !== newEmpresaId) {
      console.log('[Auth] Troca de tenant detectada, forçando reload completo');
      // Não atualiza estado React - vai dar reload de qualquer forma
      window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
      
      // Força reload completo para limpar todo cache e estado React
      window.location.reload();
      return;
    }
    
    setUser(decodedUser);
    setToken(access_token);
    
    // ✅ Dispara evento customizado para reconectar WebSocket na mesma aba
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: true } }));
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    
    // ✅ Dispara evento customizado para reconectar WebSocket na mesma aba
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { hasToken: false } }));
    
    // 🚨 Força reload completo para limpar todo cache e estado React
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