// Caminho: frontend/src/hooks/useAmbienteNotification.ts
// ✅ REFATORADO: Agora usa o SocketContext centralizado ao invés de criar conexão própria

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';
import { useSocket } from '@/context/SocketContext';

interface UseAmbienteNotificationReturn {
  novoPedidoId: string | null;
  audioConsentNeeded: boolean;
  handleAllowAudio: () => void;
  clearNotification: () => void;
  isConnected: boolean;
  novoPedidoRecebido: Pedido | null;
}

/**
 * Hook customizado para receber notificações de novos pedidos em um ambiente específico
 * Toca um som quando um novo pedido chega para o ambiente (cozinha, bar, etc.)
 * 
 * ✅ CORREÇÃO: Agora usa o SocketContext centralizado (1 conexão para toda a app)
 * 
 * @param ambienteId - ID do ambiente para monitorar (ex: cozinha, bar)
 * @returns Objeto com estado de notificação e funções de controle
 */
export const useAmbienteNotification = (ambienteId: string | null): UseAmbienteNotificationReturn => {
  const [novoPedidoId, setNovoPedidoId] = useState<string | null>(null);
  const [novoPedidoRecebido, setNovoPedidoRecebido] = useState<Pedido | null>(null);
  const [audioConsentNeeded, setAudioConsentNeeded] = useState(true);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // ✅ CORREÇÃO: Usa o contexto centralizado ao invés de criar nova conexão
  const { isConnected, subscribe, unsubscribe } = useSocket();

  // Inicializa o áudio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.7;
    
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
    }
  }, [isAudioAllowed]);

  // Limpar notificação
  const clearNotification = useCallback(() => {
    setNovoPedidoId(null);
  }, []);

  // ✅ CORREÇÃO: Usa subscribe/unsubscribe do contexto centralizado
  useEffect(() => {
    if (!ambienteId) return;

    const novoPedidoEvent = `novo_pedido_ambiente:${ambienteId}`;
    const statusAtualizadoEvent = `status_atualizado_ambiente:${ambienteId}`;

    // Handler para novos pedidos
    const handleNovoPedido = (pedido: Pedido) => {
      logger.log(`🆕 Novo pedido recebido`, {
        module: 'WebSocket',
        data: { ambienteId, pedidoId: pedido.id, itens: pedido.itens?.length },
      });
      
      playNotificationSound();
      logger.log('🔔 Notificação sonora disparada', { module: 'WebSocket' });
      
      setNovoPedidoId(pedido.id);
      setNovoPedidoRecebido(pedido);
      
      // Remove o destaque após 5 segundos
      setTimeout(() => {
        setNovoPedidoId(null);
        setNovoPedidoRecebido(null);
      }, 5000);
    };

    // Handler para status atualizado
    const handleStatusAtualizado = (pedido: Pedido) => {
      logger.log('🔄 Status atualizado', {
        module: 'WebSocket',
        data: { ambienteId, pedidoId: pedido.id },
      });
    };

    // Inscreve nos eventos usando o contexto centralizado
    subscribe(novoPedidoEvent, handleNovoPedido);
    subscribe(statusAtualizadoEvent, handleStatusAtualizado);

    logger.log(`📡 Inscrito nos eventos do ambiente ${ambienteId}`, {
      module: 'WebSocket',
      data: { novoPedidoEvent, statusAtualizadoEvent },
    });

    // Cleanup: remove as inscrições
    return () => {
      unsubscribe(novoPedidoEvent, handleNovoPedido);
      unsubscribe(statusAtualizadoEvent, handleStatusAtualizado);
      logger.log(`📡 Desinscrito dos eventos do ambiente ${ambienteId}`, {
        module: 'WebSocket',
      });
    };
  }, [ambienteId, playNotificationSound, subscribe, unsubscribe]);

  return {
    novoPedidoId,
    audioConsentNeeded,
    handleAllowAudio,
    clearNotification,
    isConnected,
    novoPedidoRecebido,
  };
};
