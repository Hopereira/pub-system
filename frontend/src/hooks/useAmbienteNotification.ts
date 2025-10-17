// Caminho: frontend/src/hooks/useAmbienteNotification.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UseAmbienteNotificationReturn {
  novoPedidoId: string | null;
  audioConsentNeeded: boolean;
  handleAllowAudio: () => void;
  clearNotification: () => void;
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
  const [audioConsentNeeded, setAudioConsentNeeded] = useState(true);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  
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
    }).catch(e => {
      console.error("Erro ao testar áudio:", e);
    });
  }, []);

  // Função para tocar o som de notificação
  const playNotificationSound = useCallback(() => {
    if (isAudioAllowed && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.error("Erro ao tocar som de notificação:", e);
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
      console.log(`[Socket.IO Ambiente] Conectado: ${socketRef.current?.id}`);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Socket.IO Ambiente] Desconectado');
    });

    // Escuta novos pedidos para este ambiente específico
    const novoPedidoEvent = `novo_pedido_ambiente:${ambienteId}`;
    socketRef.current.on(novoPedidoEvent, (pedido: Pedido) => {
      console.log(`[Socket.IO Ambiente] Novo pedido recebido para ambiente ${ambienteId}:`, pedido);
      
      // Toca o som
      playNotificationSound();
      
      // Define o ID do novo pedido para destacar na UI
      setNovoPedidoId(pedido.id);
      
      // Remove o destaque após 5 segundos
      setTimeout(() => {
        setNovoPedidoId(null);
      }, 5000);
    });

    // Escuta atualizações de status para este ambiente
    const statusAtualizadoEvent = `status_atualizado_ambiente:${ambienteId}`;
    socketRef.current.on(statusAtualizadoEvent, (pedido: Pedido) => {
      console.log(`[Socket.IO Ambiente] Status atualizado para ambiente ${ambienteId}:`, pedido);
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
  };
};
