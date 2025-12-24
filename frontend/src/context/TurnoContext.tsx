'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import turnoService from '@/services/turnoService';
import { TurnoFuncionario } from '@/types/turno';
import { socket } from '@/lib/socket';
import { logger } from '@/lib/logger';

interface TurnoContextData {
  turnoAtivo: TurnoFuncionario | null;
  temCheckIn: boolean;
  verificando: boolean;
  verificarTurno: () => Promise<void>;
  setTurnoAtivo: (turno: TurnoFuncionario | null) => void;
}

const TurnoContext = createContext<TurnoContextData>({} as TurnoContextData);

export function TurnoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [turnoAtivo, setTurnoAtivo] = useState<TurnoFuncionario | null>(null);
  const [verificando, setVerificando] = useState(true);

  const verificarTurno = async () => {
    if (!user?.id) {
      setVerificando(false);
      return;
    }

    // SUPER_ADMIN não tem turno - ignorar verificação
    if (user.cargo === 'SUPER_ADMIN') {
      setVerificando(false);
      setTurnoAtivo(null);
      return;
    }

    try {
      setVerificando(true);
      const turnos = await turnoService.getTurnosFuncionario(user.id);
      const ativo = turnos.find((t) => t.ativo && !t.checkOut);
      setTurnoAtivo(ativo || null);
    } catch (error) {
      console.error('Erro ao verificar turno:', error);
      setTurnoAtivo(null);
    } finally {
      setVerificando(false);
    }
  };

  // Verifica turno ao montar e quando user mudar
  useEffect(() => {
    verificarTurno();
  }, [user?.id]);

  // WebSocket: Escuta eventos de check-in e check-out em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const handleCheckIn = (data: any) => {
      logger.log('🔔 Evento check-in recebido', { module: 'TurnoContext', data });
      
      // Se for o check-in do próprio usuário, atualiza o turno ativo
      if (data.funcionarioId === user.id || data.funcionario?.id === user.id) {
        logger.log('✅ Check-in do usuário atual detectado, atualizando...', { module: 'TurnoContext' });
        verificarTurno();
      }
    };

    const handleCheckOut = (data: any) => {
      logger.log('🔔 Evento check-out recebido', { module: 'TurnoContext', data });
      
      // Se for o check-out do próprio usuário, limpa o turno ativo
      if (data.funcionarioId === user.id || data.funcionario?.id === user.id) {
        logger.log('✅ Check-out do usuário atual detectado, limpando turno...', { module: 'TurnoContext' });
        setTurnoAtivo(null);
      }
    };

    const handleFuncionariosAtualizado = () => {
      logger.log('🔄 Lista de funcionários atualizada', { module: 'TurnoContext' });
      // Recarrega o turno para pegar dados atualizados
      verificarTurno();
    };

    // Registra listeners
    socket.on('funcionario_check_in', handleCheckIn);
    socket.on('funcionario_check_out', handleCheckOut);
    socket.on('funcionarios_ativos_atualizado', handleFuncionariosAtualizado);

    logger.log('🎧 Listeners de turno registrados', { module: 'TurnoContext' });

    // Cleanup ao desmontar
    return () => {
      socket.off('funcionario_check_in', handleCheckIn);
      socket.off('funcionario_check_out', handleCheckOut);
      socket.off('funcionarios_ativos_atualizado', handleFuncionariosAtualizado);
      logger.log('🔇 Listeners de turno removidos', { module: 'TurnoContext' });
    };
  }, [user?.id]);

  const temCheckIn = !!turnoAtivo && turnoAtivo.ativo && !turnoAtivo.checkOut;

  return (
    <TurnoContext.Provider
      value={{
        turnoAtivo,
        temCheckIn,
        verificando,
        verificarTurno,
        setTurnoAtivo,
      }}
    >
      {children}
    </TurnoContext.Provider>
  );
}

export function useTurno() {
  const context = useContext(TurnoContext);
  if (!context) {
    throw new Error('useTurno deve ser usado dentro de um TurnoProvider');
  }
  return context;
}
