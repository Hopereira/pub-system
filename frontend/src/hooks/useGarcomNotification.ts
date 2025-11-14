// Hook para notificações em tempo real para garçons
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

interface UseGarcomNotificationProps {
  onNovoPedidoPronto?: () => void;
  onItemEntregue?: () => void;
}

export function useGarcomNotification({
  onNovoPedidoPronto,
  onItemEntregue,
}: UseGarcomNotificationProps = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [novoPedido, setNovoPedido] = useState(false);
  
  // Usar refs para callbacks para evitar re-renders
  const onNovoPedidoProntoRef = useRef(onNovoPedidoPronto);
  const onItemEntregueRef = useRef(onItemEntregue);
  
  useEffect(() => {
    onNovoPedidoProntoRef.current = onNovoPedidoPronto;
    onItemEntregueRef.current = onItemEntregue;
  }, [onNovoPedidoPronto, onItemEntregue]);

  // Função para tocar som de notificação
  const tocarSom = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((error) => {
        logger.warn('Não foi possível tocar som de notificação', {
          module: 'useGarcomNotification',
          error: error as Error,
        });
      });
    } catch (error) {
      logger.error('Erro ao tocar som', {
        module: 'useGarcomNotification',
        error: error as Error,
      });
    }
  }, []);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    logger.log('🔌 Conectando ao WebSocket para notificações de garçom', {
      module: 'useGarcomNotification',
      data: { url: backendUrl },
    });

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      logger.log('✅ WebSocket conectado (Garçom)', {
        module: 'useGarcomNotification',
      });
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      logger.warn('⚠️ WebSocket desconectado (Garçom)', {
        module: 'useGarcomNotification',
      });
      setConnected(false);
    });

    // Escutar quando um item fica PRONTO
    socketInstance.on('status_atualizado', (pedido: any) => {
      logger.log('🔄 Status de pedido atualizado', {
        module: 'useGarcomNotification',
        data: { pedidoId: pedido?.id },
      });

      // Verificar se algum item ficou PRONTO
      if (pedido?.itens && Array.isArray(pedido.itens)) {
        const itemPronto = pedido.itens.find((item: any) => item.status === 'PRONTO');
        
        if (itemPronto) {
          logger.log('🔔 Novo item PRONTO para entrega!', {
            module: 'useGarcomNotification',
            data: { 
              itemId: itemPronto.id,
              produto: itemPronto.produto?.nome 
            },
          });

          // Tocar som
          tocarSom();

          // Destacar visualmente
          setNovoPedido(true);
          setTimeout(() => setNovoPedido(false), 5000);

          // Callback customizado
          if (onNovoPedidoProntoRef.current) {
            onNovoPedidoProntoRef.current();
          }
        }
      }

      // Verificar se algum item foi ENTREGUE
      if (pedido?.itens && Array.isArray(pedido.itens)) {
        const itemEntregue = pedido.itens.find((item: any) => item.status === 'ENTREGUE');
        
        if (itemEntregue && onItemEntregueRef.current) {
          logger.log('✅ Item marcado como entregue', {
            module: 'useGarcomNotification',
            data: { itemId: itemEntregue.id },
          });
          onItemEntregueRef.current();
        }
      }
    });

    // Escutar novos pedidos
    socketInstance.on('novo_pedido', (data: any) => {
      logger.log('🆕 Novo pedido criado', {
        module: 'useGarcomNotification',
        data: { pedidoId: data.id },
      });
    });

    socketInstance.on('connect_error', (error) => {
      logger.error('❌ Erro de conexão WebSocket (Garçom)', {
        module: 'useGarcomNotification',
        error,
      });
    });

    setSocket(socketInstance);

    return () => {
      logger.log('🔌 Desconectando WebSocket (Garçom)', {
        module: 'useGarcomNotification',
      });
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Só conecta uma vez

  return {
    socket,
    connected,
    novoPedido,
  };
}
