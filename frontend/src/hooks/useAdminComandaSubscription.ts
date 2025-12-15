'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comanda } from '@/types/comanda';
import { getComandaById } from '@/services/comandaService'; // Usa o serviço do admin (autenticado)
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useAdminComandaSubscription = (comandaId: string | null) => {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComanda = useCallback(async () => {
    if (!comandaId) return;
    try {
      // Usa a função de busca autenticada
      const data = await getComandaById(comandaId);
      setComanda(data);
    } catch (err) {
      setError('Comanda não encontrada ou inválida.');
      logger.error('Erro ao buscar comanda', { module: 'useAdminComandaSubscription', error: err as Error });
    } finally {
      setIsLoading(false);
    }
  }, [comandaId]);

  // Efeito para o carregamento inicial dos dados
  useEffect(() => {
    if (comandaId) {
      setIsLoading(true);
      fetchComanda();
    } else {
      setError('ID da comanda não fornecido.');
      setIsLoading(false);
    }
  }, [comandaId, fetchComanda]);

  // Efeito para a subscrição em tempo real via WebSocket
  useEffect(() => {
    if (!comandaId) return;

    const socket: Socket = io(SOCKET_URL);

    socket.on('connect', () => {
      logger.socket(`Conectado ao servidor com ID: ${socket.id}`);
    });

    socket.on('status_atualizado', (pedidoAtualizado: Pedido) => {
      if (pedidoAtualizado.comanda?.id === comandaId) {
        logger.info('Recebida atualização de status de item', { module: 'useAdminComandaSubscription' });
        fetchComanda();
      }
    });

    socket.on('comanda_atualizada', (comandaAtualizada: Comanda) => {
      if (comandaAtualizada.id === comandaId) {
        logger.info('Recebida atualização de comanda', { module: 'useAdminComandaSubscription' });
        fetchComanda();
      }
    });
    
    socket.on('novo_pedido', (novoPedido: Pedido) => {
      if (novoPedido.comanda?.id === comandaId) {
        logger.info('Recebido novo pedido', { module: 'useAdminComandaSubscription' });
        fetchComanda();
      }
    });

    // Função de limpeza para desconectar o socket
    return () => {
      logger.socket('Desconectando');
      socket.disconnect();
    };
  }, [comandaId, fetchComanda]);

  return { comanda, isLoading, error, fetchComanda };
};