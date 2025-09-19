// Caminho: frontend/src/hooks/useComandaSubscription.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Comanda, ComandaStatus } from '@/types/comanda';
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

  // Armazenamos a referência da comanda anterior para comparação
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
    }).catch(e => {});
  }, []);

  const fetchComanda = useCallback(async () => {
    if (!comandaId) return;
    try {
      const data = await getPublicComandaById(comandaId);
      
      if (comandaAnteriorRef.current && audioRef.current) {
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
            audioRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
          }
          setChangedPedidos(novosPedidosAlterados);
          setTimeout(() => setChangedPedidos(new Set()), 3000);
        }
      }
      setComanda(data);
      // Atualizamos a referência *depois* de usá-la para comparação
      comandaAnteriorRef.current = data;

    } catch (err) {
      setError('Comanda não encontrada ou inválida.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    // ==================================================================
    // ## A CORREÇÃO CRÍTICA ESTÁ AQUI ##
    // Removemos 'comanda' da lista de dependências para quebrar o loop.
    // Usamos 'comandaAnteriorRef' para a lógica de comparação.
    // ==================================================================
  }, [comandaId, isAudioAllowed]);


  useEffect(() => {
    if (comandaId) {
      setIsLoading(true);
      fetchComanda();
    } else {
        setError("ID da comanda não fornecido.");
        setIsLoading(false);
    }
  }, [comandaId]); // Removido fetchComanda daqui para simplificar, pois ele já depende de comandaId


  useEffect(() => {
    if (!comandaId) return;

    const socket: Socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log(`[Socket.IO] Conectado ao servidor com ID: ${socket.id}`);
    });

    socket.on('status_atualizado', (pedidoAtualizado: Pedido) => {
      if (pedidoAtualizado.comanda?.id === comandaId) {
        console.log('[Socket.IO] Recebida atualização de status. Buscando dados novos...');
        fetchComanda();
      }
    });

    return () => {
      console.log('[Socket.IO] Desconectando...');
      socket.disconnect();
    };
  }, [comandaId, fetchComanda]);

  return { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio };
};