// Hook para escutar atualizações de TODOS os pedidos via WebSocket
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UsePedidosSubscriptionReturn {
  novoPedido: Pedido | null;
  pedidoAtualizado: Pedido | null;
  isConnected: boolean;
}

/**
 * Hook para escutar atualizações de TODOS os pedidos via WebSocket
 * Usado na página de Supervisão de Pedidos (ADMIN/GERENTE)
 */
export const usePedidosSubscription = (): UsePedidosSubscriptionReturn => {
  const [novoPedido, setNovoPedido] = useState<Pedido | null>(null);
  const [pedidoAtualizado, setPedidoAtualizado] = useState<Pedido | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conecta ao socket
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      logger.socket('Conectado ao WebSocket (supervisão)', {
        socketId: socketRef.current?.id,
      });
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      logger.warn('Desconectado do WebSocket', {
        module: 'WebSocket',
        data: { reason },
      });
    });

    // Escuta TODOS os novos pedidos (sem filtro de ambiente)
    socketRef.current.on('novo_pedido', (pedido: Pedido) => {
      logger.log('🆕 Novo pedido recebido (supervisão)', {
        module: 'WebSocket',
        data: { pedidoId: pedido.id, itens: pedido.itens?.length },
      });
      
      setNovoPedido(pedido);
      
      // Limpa após 3 segundos
      setTimeout(() => {
        setNovoPedido(null);
      }, 3000);
    });

    // Escuta atualizações de status de qualquer pedido
    socketRef.current.on('status_atualizado', (pedido: Pedido) => {
      logger.log('🔄 Status atualizado (supervisão)', {
        module: 'WebSocket',
        data: { pedidoId: pedido.id },
      });
      
      setPedidoAtualizado(pedido);
      
      // Limpa após 3 segundos
      setTimeout(() => {
        setPedidoAtualizado(null);
      }, 3000);
    });
    
    // Escuta erros de conexão
    socketRef.current.on('connect_error', (error) => {
      logger.error('Erro ao conectar no WebSocket', {
        module: 'WebSocket',
        error: error as Error,
      });
    });

    // Cleanup ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.off('novo_pedido');
        socketRef.current.off('status_atualizado');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    novoPedido,
    pedidoAtualizado,
    isConnected,
  };
};
