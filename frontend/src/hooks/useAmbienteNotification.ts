// Caminho: frontend/src/hooks/useAmbienteNotification.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UseAmbienteNotificationReturn {
  novoPedidoId: string | null;
  audioConsentNeeded: boolean;
  handleAllowAudio: () => void;
  clearNotification: () => void;
  isConnected: boolean;
  novoPedidoRecebido: Pedido | null; // Novo pedido completo recebido
}

/**
 * Hook customizado para receber notificações de novos pedidos em um ambiente específico
 * Toca um som quando um novo pedido chega para o ambiente (cozinha, bar, etc.)
 * 
 * @param ambienteId - ID do ambiente para monitorar (ex: cozinha, bar)
 * @returns Objeto com estado de notificação e funções de controle
 */
export const useAmbienteNotification = (ambienteId: string | null): UseAmbienteNotificationReturn => {
  const [novoPedidoId, setNovoPedidoId] = useState<string | null>(null);
  const [novoPedidoRecebido, setNovoPedidoRecebido] = useState<Pedido | null>(null);
  const [audioConsentNeeded, setAudioConsentNeeded] = useState(true);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Inicializa o áudio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.7; // Volume a 70%
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Função para permitir o áudio (necessário por políticas do navegador)
  const handleAllowAudio = useCallback(() => {
    setAudioConsentNeeded(false);
    setIsAudioAllowed(true);
    
    // Testa o áudio
    audioRef.current?.play().then(() => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      logger.log('🔊 Áudio habilitado e testado com sucesso', { module: 'WebSocket' });
    }).catch(e => {
      logger.error('Falha ao testar áudio de notificação', {
        module: 'WebSocket',
        error: e as Error,
      });
    });
  }, []);

  // Função para tocar o som de notificação
  const playNotificationSound = useCallback(() => {
    if (isAudioAllowed && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        logger.error('Falha ao reproduzir som de notificação', {
          module: 'WebSocket',
          error: e as Error,
        });
      });
    } else if (!isAudioAllowed) {
      logger.warn('Tentativa de tocar áudio sem permissão do usuário', {
        module: 'WebSocket',
      });
    }
  }, [isAudioAllowed]);

  // Limpar notificação
  const clearNotification = useCallback(() => {
    setNovoPedidoId(null);
  }, []);

  // Conectar ao WebSocket e escutar eventos do ambiente
  useEffect(() => {
    if (!ambienteId) return;

    // Conecta ao socket
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      logger.socket(`Conectado ao ambiente ${ambienteId}`, {
        socketId: socketRef.current?.id,
      });
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      logger.warn(`Desconectado do WebSocket`, {
        module: 'WebSocket',
        data: { ambienteId, reason },
      });
      
      // Log se foi desconexão inesperada
      if (reason === 'io server disconnect' || reason === 'transport close') {
        logger.error('Desconexão inesperada - Tentando reconectar', {
          module: 'WebSocket',
          data: { reason },
        });
      }
    });

    // Escuta novos pedidos para este ambiente específico
    const novoPedidoEvent = `novo_pedido_ambiente:${ambienteId}`;
    socketRef.current.on(novoPedidoEvent, (pedido: Pedido) => {
      logger.log(`🆕 Novo pedido recebido`, {
        module: 'WebSocket',
        data: { ambienteId, pedidoId: pedido.id, itens: pedido.itens?.length },
      });
      
      // Toca o som
      playNotificationSound();
      
      logger.log('🔔 Notificação sonora disparada', { module: 'WebSocket' });
      
      // Define o ID do novo pedido para destacar na UI
      setNovoPedidoId(pedido.id);
      
      // Armazena o pedido completo para a página poder atualizar
      setNovoPedidoRecebido(pedido);
      
      // Remove o destaque após 5 segundos
      setTimeout(() => {
        setNovoPedidoId(null);
        setNovoPedidoRecebido(null);
      }, 5000);
    });

    // Escuta atualizações de status para este ambiente
    const statusAtualizadoEvent = `status_atualizado_ambiente:${ambienteId}`;
    socketRef.current.on(statusAtualizadoEvent, (pedido: Pedido) => {
      logger.log('🔄 Status atualizado', {
        module: 'WebSocket',
        data: { ambienteId, pedidoId: pedido.id },
      });
    });
    
    // Escuta erros de conexão
    socketRef.current.on('connect_error', (error) => {
      logger.error('Erro ao conectar no WebSocket', {
        module: 'WebSocket',
        error: error as Error,
      });
    });
    
    // Escuta tentativas de reconexão
    socketRef.current.on('reconnect_attempt', (attempt) => {
      logger.warn(`Tentando reconectar (${attempt})`, {
        module: 'WebSocket',
        data: { ambienteId },
      });
    });
    
    // Escuta reconexão bem-sucedida
    socketRef.current.on('reconnect', (attemptNumber) => {
      logger.log(`✅ Reconectado com sucesso após ${attemptNumber} tentativas`, {
        module: 'WebSocket',
        data: { ambienteId },
      });
    });

    // Cleanup ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.off(novoPedidoEvent);
        socketRef.current.off(statusAtualizadoEvent);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [ambienteId, playNotificationSound]);

  return {
    novoPedidoId,
    audioConsentNeeded,
    handleAllowAudio,
    clearNotification,
    isConnected,
    novoPedidoRecebido,
  };
};
