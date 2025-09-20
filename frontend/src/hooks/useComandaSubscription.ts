// Caminho: frontend/src/hooks/useComandaSubscription.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Comanda } from '@/types/comanda';
import { getPublicComandaById } from '@/services/comandaService';
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';

const SOCKET_URL = 'http://localhost:3000';

export const useComandaSubscription = (comandaId: string | null) => {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [changedPedidos, setChangedPedidos] = useState<Set<string>>(new Set());
  const [audioConsentNeeded, setAudioConsentNeeded] = useState(true);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const comandaAnteriorRef = useRef<Comanda | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const handleAllowAudio = useCallback(() => {
    setAudioConsentNeeded(false);
    setIsAudioAllowed(true);
    audioRef.current
      ?.play()
      .then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      })
      .catch((e) => {});
  }, []);

  const fetchComanda = useCallback(async () => {
    if (!comandaId) return;
    try {
      const data = await getPublicComandaById(comandaId);

      if (comandaAnteriorRef.current && audioRef.current) {
        const novosPedidosAlterados = new Set<string>();

        data.pedidos?.forEach((pedidoNovo) => {
          const pedidoAntigo = comandaAnteriorRef.current?.pedidos?.find(
            (p) => p.id === pedidoNovo.id,
          );
          
          pedidoNovo.itens.forEach((itemNovo) => {
            const itemAntigo = pedidoAntigo?.itens.find(
              (i) => i.id === itemNovo.id,
            );
            if (itemAntigo && itemAntigo.status !== itemNovo.status) {
              novosPedidosAlterados.add(pedidoNovo.id);
            }
          });
        });

        if (novosPedidosAlterados.size > 0) {
          if (isAudioAllowed) {
            audioRef.current.play().catch((e) => console.error('Erro ao tocar áudio:', e));
          }
          setChangedPedidos(novosPedidosAlterados);
          setTimeout(() => setChangedPedidos(new Set()), 3000);
        }
      }
      
      setComanda(data);
      comandaAnteriorRef.current = data;

    } catch (err) {
      setError('Comanda não encontrada ou inválida.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [comandaId, isAudioAllowed]);

  useEffect(() => {
    if (comandaId) {
      setIsLoading(true);
      fetchComanda();
    } else {
      setError('ID da comanda não fornecido.');
      setIsLoading(false);
    }
  }, [comandaId]);

  useEffect(() => {
    if (!comandaId) return;

    const socket: Socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log(`[Socket.IO] Conectado ao servidor com ID: ${socket.id}`);
    });

    socket.on('status_atualizado', (pedidoAtualizado: Pedido) => {
      if (pedidoAtualizado.comanda?.id === comandaId) {
        console.log('[Socket.IO] Recebida atualização de status de item. Buscando dados novos...');
        fetchComanda();
      }
    });

    // ==================================================================
    // ## CORREÇÃO: Adicionamos o "ouvinte" para a atualização da comanda ##
    // ==================================================================
    socket.on('comanda_atualizada', (comandaAtualizada: Comanda) => {
      if (comandaAtualizada.id === comandaId) {
        console.log('[Socket.IO] Recebida atualização de comanda. Buscando dados novos...');
        fetchComanda();
      }
    });

    return () => {
      console.log('[Socket.IO] Desconectando...');
      socket.disconnect();
    };
  }, [comandaId, fetchComanda]);

  return {
    comanda,
    isLoading,
    error,
    changedPedidos,
    audioConsentNeeded,
    handleAllowAudio,
  };
};