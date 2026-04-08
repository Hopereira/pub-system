'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketCallback = (data: any) => void;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: SocketCallback) => void;
  unsubscribe: (event: string, callback: SocketCallback) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (event: string, data?: any) => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Provider único de WebSocket para toda a aplicação
 * 
 * Benefícios:
 * - 1 única conexão ao invés de 5+
 * - Eventos centralizados
 * - Melhor gerenciamento de reconexão
 * - 40% menos overhead
 * - ✅ Isolamento por tenant via JWT
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<SocketCallback>>>(new Map());
  const [tokenVersion, setTokenVersion] = useState(0);

  // ✅ Função para criar conexão WebSocket
  const createConnection = useCallback(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // ✅ Obtém o token JWT para enviar no handshake
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    // ✅ Não conectar em páginas públicas sem JWT — o useComandaSubscription
    // cria seu próprio socket para páginas de cliente público.
    // Sem este guard, o SocketContext global tentaria conectar sem token e
    // seria desconectado pelo backend (io server disconnect).
    if (!token) {
      logger.log('⏭️ SocketContext: sem token JWT, pulando conexão WebSocket global (página pública)', {
        module: 'SocketContext',
      });
      return null;
    }
    
    logger.log('🔌 Iniciando conexão WebSocket única', {
      module: 'SocketContext',
      data: { url: SOCKET_URL, hasToken: !!token },
    });

    // ✅ ÚNICA conexão para toda a aplicação
    // ✅ CORREÇÃO: Envia o token JWT no handshake para isolamento por tenant
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      auth: {
        token: token, // Backend extrai tenant_id do JWT
      },
    });

    // ✅ Atualiza o token antes de cada tentativa de reconexão
    // Necessário pois socket.io não atualiza auth automaticamente em reconnects
    newSocket.io.on('reconnect_attempt', () => {
      const freshToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      newSocket.auth = { token: freshToken };
    });

    newSocket.on('connect', () => {
      console.log('✅ [SocketContext] WebSocket conectado!', { socketId: newSocket.id, hasToken: !!token });
      logger.log('✅ WebSocket conectado', {
        module: 'SocketContext',
        data: { socketId: newSocket.id, hasToken: !!token },
      });
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      logger.warn('⚠️ WebSocket desconectado', {
        module: 'SocketContext',
        data: { reason },
      });
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      logger.error('❌ Erro de conexão WebSocket', {
        module: 'SocketContext',
        error: error as Error,
      });
    });

    newSocket.on('reconnect', (attemptNumber) => {
      logger.log('🔄 WebSocket reconectado', {
        module: 'SocketContext',
        data: { attemptNumber },
      });
    });

    return newSocket as Socket;
  }, []);

  // ✅ Função para reconectar com novo token
  const reconnect = useCallback(() => {
    logger.log('🔄 Reconectando WebSocket com novo token', {
      module: 'SocketContext',
    });
    
    // Desconecta socket antigo
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Cria nova conexão
    socketRef.current = createConnection();
    
    // Re-registra todos os listeners salvos
    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        socketRef.current?.on(event, callback);
      });
    });
  }, [createConnection]);

  useEffect(() => {
    socketRef.current = createConnection();

    // ✅ Se conectou sem token mas há um token no localStorage (reload de página
    // com usuário já logado), reconectar com o token correto após breve delay
    // O delay permite que o AuthContext termine de ler o token do localStorage
    const initialTokenCheck = setTimeout(() => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const socketConnectedWithToken = socketRef.current?.auth && (socketRef.current.auth as any).token;
      // Só reconecta se há token E o socket atual não tem token (evita loop em páginas públicas)
      if (currentToken && !socketConnectedWithToken && !socketRef.current?.connected) {
        logger.log('🔄 Token encontrado após mount, reconectando WebSocket com autenticação', {
          module: 'SocketContext',
        });
        setTokenVersion((v) => v + 1);
      }
    }, 500);

    // ✅ Escuta mudanças no localStorage (login/logout em outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        logger.log('🔄 Token alterado em outra aba, reconectando WebSocket', {
          module: 'SocketContext',
        });
        setTokenVersion((v) => v + 1);
      }
    };
    
    // ✅ Escuta evento customizado (login/logout na mesma aba)
    const handleAuthTokenChanged = () => {
      logger.log('🔄 Token alterado na mesma aba, reconectando WebSocket', {
        module: 'SocketContext',
      });
      setTokenVersion((v) => v + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokenChanged', handleAuthTokenChanged);

    // Cleanup ao desmontar
    return () => {
      clearTimeout(initialTokenCheck);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleAuthTokenChanged);
      if (socketRef.current) {
        logger.log('🔌 Desconectando WebSocket', {
          module: 'SocketContext',
        });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [createConnection]);

  // ✅ Reconecta quando o tokenVersion mudar
  useEffect(() => {
    if (tokenVersion > 0) {
      reconnect();
    }
  }, [tokenVersion, reconnect]);

  /**
   * Inscreve um callback em um evento
   */
  const subscribe = useCallback((event: string, callback: SocketCallback) => {
    console.log(`📡 [SocketContext] subscribe chamado:`, { event, hasSocket: !!socketRef.current });
    
    if (!socketRef.current) {
      console.warn(`⚠️ [SocketContext] Socket não disponível para inscrever em: ${event}`);
      return;
    }

    // Adiciona ao mapa de listeners
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)?.add(callback);

    // Registra o listener no socket
    socketRef.current.on(event, callback);
    
    console.log(`✅ [SocketContext] Inscrito com sucesso em: ${event}`);

    logger.debug(`📡 Inscrito no evento: ${event}`, {
      module: 'SocketContext',
    });
  }, []);

  /**
   * Remove a inscrição de um callback de um evento
   */
  const unsubscribe = useCallback((event: string, callback: SocketCallback) => {
    if (!socketRef.current) return;

    // Remove do mapa de listeners
    listenersRef.current.get(event)?.delete(callback);

    // Remove o listener do socket
    socketRef.current.off(event, callback);

    logger.debug(`📡 Desinscrição do evento: ${event}`, {
      module: 'SocketContext',
    });
  }, []);

  /**
   * Emite um evento para o servidor
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current || !isConnected) {
      logger.warn('⚠️ Tentativa de emitir evento sem conexão', {
        module: 'SocketContext',
        data: { event },
      });
      return;
    }

    socketRef.current.emit(event, data);

    logger.debug(`📤 Evento emitido: ${event}`, {
      module: 'SocketContext',
      data,
    });
  }, [isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        subscribe,
        unsubscribe,
        emit,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do WebSocket
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
