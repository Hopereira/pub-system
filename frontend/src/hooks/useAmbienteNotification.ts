// Caminho: frontend/src/hooks/useAmbienteNotification.ts
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
 * ✅ CORREÇÃO: Agora usa SocketContext global com JWT para isolamento por tenant
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
  
  // ✅ CORREÇÃO: Usa o SocketContext global ao invés de criar nova conexão
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

  // ✅ CORREÇÃO: Escuta eventos via SocketContext (que tem o token JWT)
  useEffect(() => {
    if (!ambienteId) return;

    const novoPedidoEvent = `novo_pedido_ambiente:${ambienteId}`;
    const statusAtualizadoEvent = `status_atualizado_ambiente:${ambienteId}`;

    // Handler para novo pedido
    const handleNovoPedido = (pedido: Pedido) => {
      logger.log(`🆕 Novo pedido recebido via SocketContext`, {
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
    };

    // Handler para status atualizado
    const handleStatusAtualizado = (pedido: Pedido) => {
      logger.log('🔄 Status atualizado via SocketContext', {
        module: 'WebSocket',
        data: { ambienteId, pedidoId: pedido.id },
      });
      
      // Notifica a UI sobre atualização
      setNovoPedidoRecebido(pedido);
      
      // Limpa após 2 segundos
      setTimeout(() => {
        setNovoPedidoRecebido(null);
      }, 2000);
    };

    // ✅ Inscreve nos eventos via SocketContext global
    logger.log(`📡 Inscrevendo nos eventos do ambiente ${ambienteId}`, {
      module: 'WebSocket',
      data: { novoPedidoEvent, statusAtualizadoEvent, isConnected },
    });
    
    subscribe(novoPedidoEvent, handleNovoPedido);
    subscribe(statusAtualizadoEvent, handleStatusAtualizado);

    // Cleanup ao desmontar
    return () => {
      logger.log(`🔌 Desinscrevendo dos eventos do ambiente ${ambienteId}`, {
        module: 'WebSocket',
      });
      unsubscribe(novoPedidoEvent, handleNovoPedido);
      unsubscribe(statusAtualizadoEvent, handleStatusAtualizado);
    };
  }, [ambienteId, playNotificationSound, subscribe, unsubscribe, isConnected]);

  return {
    novoPedidoId,
    audioConsentNeeded,
    handleAllowAudio,
    clearNotification,
    isConnected,
    novoPedidoRecebido,
  };
};
