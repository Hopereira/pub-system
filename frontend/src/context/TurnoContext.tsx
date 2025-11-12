'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import turnoService from '@/services/turnoService';
import { TurnoFuncionario } from '@/types/turno';

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
