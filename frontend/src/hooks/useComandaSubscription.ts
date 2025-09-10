// Caminho: frontend/src/hooks/useComandaSubscription.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Comanda, ComandaStatus } from '@/types/comanda'; // Importado ComandaStatus
import { getPublicComandaById } from '@/services/comandaService';

export const useComandaSubscription = (comandaId: string | null) => {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changedPedidos, setChangedPedidos] = useState<Set<string>>(new Set());
  const [audioConsentNeeded, setAudioConsentNeeded] = useState(true);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  const comandaAnteriorRef = useRef<Comanda | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (!comandaId) {
      setError("ID da comanda não fornecido.");
      setIsLoading(false);
      return;
    }
    let intervalId: NodeJS.Timeout;
    const fetchComanda = async () => {
      try {
        if (comandaAnteriorRef.current === null) setIsLoading(true);
        const data = await getPublicComandaById(comandaId);

        // --- LÓGICA DE PARAR O POLLING ---
        if (data.status === ComandaStatus.FECHADA) {
          console.log('[DEBUG] Comanda fechada. Parando o polling.');
          clearInterval(intervalId);
        }
        // --- FIM DA LÓGICA ---

        if (comandaAnteriorRef.current && audioRef.current) {
          const novosPedidosAlterados = new Set<string>();
          data.pedidos?.forEach(pedidoNovo => {
            const pedidoAntigo = comandaAnteriorRef.current?.pedidos?.find(p => p.id === pedidoNovo.id);
            if (pedidoAntigo && pedidoAntigo.status !== pedidoNovo.status) {
              novosPedidosAlterados.add(pedidoNovo.id);
            }
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
        comandaAnteriorRef.current = data;
      } catch (err) {
        setError('Comanda não encontrada ou inválida.');
        console.error(err);
        clearInterval(intervalId);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComanda();
    intervalId = setInterval(fetchComanda, 10000);
    return () => clearInterval(intervalId);
  }, [comandaId, isAudioAllowed]);

  return { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio };
};