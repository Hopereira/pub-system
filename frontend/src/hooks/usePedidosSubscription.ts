// Hook para escutar atualizações de TODOS os pedidos via WebSocket
import { useState, useEffect, useCallback } from 'react';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';
import { useSocket } from '@/context/SocketContext';

interface UsePedidosSubscriptionReturn {
  novoPedido: Pedido | null;
  pedidoAtualizado: Pedido | null;
  isConnected: boolean;
}

/**
 * Hook para escutar atualizações de TODOS os pedidos via WebSocket
 * Usado na página de Supervisão de Pedidos (ADMIN/GERENTE)
 * 
 * ✅ OTIMIZADO: Usa SocketContext único ao invés de criar nova conexão
 */
export const usePedidosSubscription = (): UsePedidosSubscriptionReturn => {
  const [novoPedido, setNovoPedido] = useState<Pedido | null>(null);
  const [pedidoAtualizado, setPedidoAtualizado] = useState<Pedido | null>(null);
  
  // ✅ Usa socket compartilhado do contexto
  const { isConnected, subscribe, unsubscribe } = useSocket();

  // Handler para novo pedido
  const handleNovoPedido = useCallback((pedido: Pedido) => {
    logger.log('🆕 Novo pedido recebido (supervisão)', {
      module: 'usePedidosSubscription',
      data: { pedidoId: pedido.id, itens: pedido.itens?.length },
    });
    
    setNovoPedido(pedido);
    
    // Limpa após 3 segundos
    setTimeout(() => {
      setNovoPedido(null);
    }, 3000);
  }, []);

  // Handler para pedido atualizado
  const handlePedidoAtualizado = useCallback((pedido: Pedido) => {
    logger.log('🔄 Status atualizado (supervisão)', {
      module: 'usePedidosSubscription',
      data: { pedidoId: pedido.id },
    });
    
    setPedidoAtualizado(pedido);
    
    // Limpa após 3 segundos
    setTimeout(() => {
      setPedidoAtualizado(null);
    }, 3000);
  }, []);

  useEffect(() => {
    // ✅ Inscreve nos eventos usando o socket compartilhado
    subscribe('novo_pedido', handleNovoPedido);
    subscribe('status_atualizado', handlePedidoAtualizado);

    // Cleanup ao desmontar
    return () => {
      unsubscribe('novo_pedido', handleNovoPedido);
      unsubscribe('status_atualizado', handlePedidoAtualizado);
    };
  }, [subscribe, unsubscribe, handleNovoPedido, handlePedidoAtualizado]);

  return {
    novoPedido,
    pedidoAtualizado,
    isConnected,
  };
};
