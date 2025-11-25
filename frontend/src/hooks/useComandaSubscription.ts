// Caminho: frontend/src/hooks/useComandaSubscription.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Comanda, ComandaStatus } from '@/types/comanda';
import { getPublicComandaById } from '@/services/comandaService';
import { io, Socket } from 'socket.io-client';
import { Pedido } from '@/types/pedido';
import { logger } from '@/lib/logger';

const SOCKET_URL = 'http://localhost:3000'; 

// ==================================================================
// ## A CORREÇÃO ESTÁ AQUI ##
// A palavra 'const' antes do nome da função garante que ela seja
// exportada corretamente para que outros ficheiros a possam importar.
// ==================================================================
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
    audioRef.current?.play().then(() => {
      audioRef.current?.pause();
      if(audioRef.current) audioRef.current.currentTime = 0;
    }).catch(e => logger.error('Erro ao tocar áudio', { module: 'useComandaSubscription', error: e as Error }));
  }, []);

  const fetchComanda = useCallback(async () => {
    if (!comandaId) return;
    try {
      const data = await getPublicComandaById(comandaId);
      
      if (comandaAnteriorRef.current && audioRef.current && data) {
        const novosPedidosAlterados = new Set<string>();
        data.pedidos?.forEach(pedidoNovo => {
          const pedidoAntigo = comandaAnteriorRef.current?.pedidos?.find(p => p.id === pedidoNovo.id);
          pedidoNovo.itens.forEach(itemNovo => {
            const itemAntigo = pedidoAntigo?.itens.find(i => i.id === itemNovo.id);
            if (itemAntigo && itemAntigo.status !== itemNovo.status) {
              novosPedidosAlterados.add(pedidoNovo.id);
            }
          });
        });

        if (novosPedidosAlterados.size > 0) {
          if (isAudioAllowed) {
            audioRef.current.play().catch(e => logger.error('Erro ao tocar áudio', { module: 'useComandaSubscription', error: e as Error }));
          }
          setChangedPedidos(novosPedidosAlterados);
          setTimeout(() => setChangedPedidos(new Set()), 3000);
        }
      }
      setComanda(data);
      comandaAnteriorRef.current = data;

    } catch (err) {
      setError('Comanda não encontrada ou inválida.');
      logger.error('Erro ao buscar comanda', { module: 'useComandaSubscription', error: err as Error });
    } finally {
      setIsLoading(false);
    }
  }, [comandaId, isAudioAllowed]);

  useEffect(() => {
    if (comandaId) {
      setIsLoading(true);
      fetchComanda();
    } else {
        setError("ID da comanda não fornecido.");
        setIsLoading(false);
    }
  }, [comandaId, fetchComanda]);

  useEffect(() => {
    if (!comandaId) return;
    const socket: Socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      logger.socket(`Conectado: ${socket.id}`);
      // Entra no room da comanda para receber notificações
      socket.emit('join_comanda', comandaId);
      logger.socket(`Entrou no room: comanda_${comandaId}`);
    });
    
    socket.on('disconnect', () => logger.socket('Desconectado'));
    
    socket.on('status_atualizado', (pedidoAtualizado: Pedido) => {
      if (pedidoAtualizado.comanda?.id === comandaId) {
        fetchComanda();
      }
    });

    socket.on('comanda_atualizada', (comandaAtualizada: Comanda) => {
      if (comandaAtualizada.id === comandaId) {
        fetchComanda();
      }
    });

    // Escuta evento de item deixado no ambiente
    socket.on('item_deixado_no_ambiente', (data: any) => {
      logger.info('Item deixado no ambiente', { module: 'useComandaSubscription', data });
      fetchComanda(); // Recarrega a comanda para mostrar o alerta
      
      // Toca som de notificação se permitido
      if (isAudioAllowed && audioRef.current) {
        audioRef.current.play().catch(e => logger.error('Erro ao tocar áudio', { module: 'useComandaSubscription', error: e as Error }));
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [comandaId, fetchComanda, isAudioAllowed]);

  return { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio };
};