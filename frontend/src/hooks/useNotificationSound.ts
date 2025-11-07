'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Tipos de sons disponíveis no sistema
 */
export type SoundType = 
  | 'item-quase-pronto'  // Som leve
  | 'item-pronto'        // Som forte/urgente
  | 'item-retirado'      // Som confirmação
  | 'item-entregue';     // Som sucesso

/**
 * Hook para gerenciar sons de notificação no sistema
 * Suporta mute temporário e fallback para tons sintéticos
 */
export function useNotificationSound() {
  const [isMuted, setIsMuted] = useState(false);
  const [muteTimer, setMuteTimer] = useState<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializa AudioContext apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        logger.warn('AudioContext não disponível', { module: 'useNotificationSound', error });
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (muteTimer) {
        clearTimeout(muteTimer);
      }
    };
  }, []);

  /**
   * Gera um tom sintético usando Web Audio API
   */
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      logger.error('Erro ao tocar som sintético', { module: 'useNotificationSound', error });
    }
  }, []);

  /**
   * Tenta reproduzir arquivo de áudio real, se existir
   */
  const playAudioFile = useCallback((soundType: SoundType): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`/sounds/${soundType}.mp3`);
        audio.volume = 0.6;
        
        audio.addEventListener('canplaythrough', () => {
          audio.play()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        }, { once: true });

        audio.addEventListener('error', () => resolve(false), { once: true });

        // Timeout de 500ms
        setTimeout(() => resolve(false), 500);
      } catch {
        resolve(false);
      }
    });
  }, []);

  /**
   * Reproduz som baseado no tipo
   * Tenta arquivo real primeiro, depois fallback para tom sintético
   */
  const playSound = useCallback(async (soundType: SoundType) => {
    if (isMuted) {
      logger.debug('Som silenciado', { module: 'useNotificationSound', soundType });
      return;
    }

    logger.debug('Reproduzindo som', { module: 'useNotificationSound', soundType });

    // Tenta arquivo real primeiro
    const fileSuccess = await playAudioFile(soundType);
    if (fileSuccess) return;

    // Fallback para tons sintéticos
    switch (soundType) {
      case 'item-quase-pronto':
        // Tom médio, curto
        playTone(600, 0.3, 'sine');
        break;

      case 'item-pronto':
        // Tom alto, dois bips
        playTone(800, 0.2, 'square');
        setTimeout(() => playTone(800, 0.2, 'square'), 250);
        break;

      case 'item-retirado':
        // Tom confirmação rápido
        playTone(700, 0.15, 'sine');
        break;

      case 'item-entregue':
        // Tom sucesso (ascendente)
        playTone(600, 0.15, 'sine');
        setTimeout(() => playTone(800, 0.2, 'sine'), 150);
        break;
    }

    // Vibração no mobile (se disponível)
    if (navigator.vibrate) {
      const vibratePattern = soundType === 'item-pronto' ? [100, 50, 100] : [50];
      navigator.vibrate(vibratePattern);
    }
  }, [isMuted, playAudioFile, playTone]);

  /**
   * Silencia sons por N minutos
   */
  const muteFor = useCallback((minutes: number) => {
    if (muteTimer) {
      clearTimeout(muteTimer);
    }

    setIsMuted(true);
    logger.log(`🔇 Sons silenciados por ${minutes} minuto(s)`, { module: 'useNotificationSound' });

    const timer = setTimeout(() => {
      setIsMuted(false);
      logger.log('🔊 Sons reativados', { module: 'useNotificationSound' });
    }, minutes * 60 * 1000);

    setMuteTimer(timer);
  }, [muteTimer]);

  /**
   * Alterna mute on/off
   */
  const toggleMute = useCallback(() => {
    if (isMuted && muteTimer) {
      clearTimeout(muteTimer);
      setMuteTimer(null);
    }
    setIsMuted(!isMuted);
    logger.log(`${!isMuted ? '🔇 Silenciado' : '🔊 Ativado'}`, { module: 'useNotificationSound' });
  }, [isMuted, muteTimer]);

  /**
   * Reativa sons imediatamente
   */
  const unmute = useCallback(() => {
    if (muteTimer) {
      clearTimeout(muteTimer);
      setMuteTimer(null);
    }
    setIsMuted(false);
    logger.log('🔊 Sons reativados manualmente', { module: 'useNotificationSound' });
  }, [muteTimer]);

  return {
    playSound,
    muteFor,
    toggleMute,
    unmute,
    isMuted,
  };
}
