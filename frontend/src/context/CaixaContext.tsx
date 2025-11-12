'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTurno } from './TurnoContext';
import caixaService from '@/services/caixaService';
import { AberturaCaixa, ResumoCaixa } from '@/types/caixa';

interface CaixaContextData {
  caixaAberto: AberturaCaixa | null;
  temCaixaAberto: boolean;
  resumoCaixa: ResumoCaixa | null;
  verificandoCaixa: boolean;
  abrirCaixa: (valorInicial: number, observacao?: string) => Promise<void>;
  fecharCaixa: (valores: {
    valorInformadoDinheiro: number;
    valorInformadoPix: number;
    valorInformadoDebito: number;
    valorInformadoCredito: number;
    valorInformadoValeRefeicao: number;
    valorInformadoValeAlimentacao: number;
    observacao?: string;
  }) => Promise<void>;
  registrarSangria: (valor: number, motivo: string, observacao?: string) => Promise<void>;
  atualizarResumo: () => Promise<void>;
}

const CaixaContext = createContext<CaixaContextData>({} as CaixaContextData);

export function CaixaProvider({ children }: { children: ReactNode }) {
  const { turnoAtivo, temCheckIn } = useTurno();
  const [caixaAberto, setCaixaAberto] = useState<AberturaCaixa | null>(null);
  const [resumoCaixa, setResumoCaixa] = useState<ResumoCaixa | null>(null);
  const [verificandoCaixa, setVerificandoCaixa] = useState(true);

  // Verificar caixa aberto quando turno mudar
  useEffect(() => {
    verificarCaixaAberto();
  }, [turnoAtivo?.id]);

  const verificarCaixaAberto = async () => {
    if (!temCheckIn || !turnoAtivo?.id) {
      setCaixaAberto(null);
      setResumoCaixa(null);
      setVerificandoCaixa(false);
      return;
    }

    try {
      setVerificandoCaixa(true);
      const caixa = await caixaService.getCaixaAberto(turnoAtivo.id);
      setCaixaAberto(caixa);
      
      // Se tem caixa aberto, buscar resumo
      if (caixa) {
        await atualizarResumo();
      }
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      setCaixaAberto(null);
      setResumoCaixa(null);
    } finally {
      setVerificandoCaixa(false);
    }
  };

  const abrirCaixa = async (valorInicial: number, observacao?: string) => {
    if (!turnoAtivo?.id) {
      throw new Error('Turno não está ativo');
    }

    const caixa = await caixaService.abrirCaixa({
      turnoFuncionarioId: turnoAtivo.id,
      valorInicial,
      observacao,
    });

    setCaixaAberto(caixa);
    await atualizarResumo();
  };

  const fecharCaixa = async (valores: {
    valorInformadoDinheiro: number;
    valorInformadoPix: number;
    valorInformadoDebito: number;
    valorInformadoCredito: number;
    valorInformadoValeRefeicao: number;
    valorInformadoValeAlimentacao: number;
    observacao?: string;
  }) => {
    if (!caixaAberto?.id) {
      throw new Error('Caixa não está aberto');
    }

    await caixaService.fecharCaixa({
      aberturaCaixaId: caixaAberto.id,
      ...valores,
    });

    setCaixaAberto(null);
    setResumoCaixa(null);
  };

  const registrarSangria = async (valor: number, motivo: string, observacao?: string) => {
    if (!caixaAberto?.id) {
      throw new Error('Caixa não está aberto');
    }

    await caixaService.registrarSangria({
      aberturaCaixaId: caixaAberto.id,
      valor,
      motivo,
      observacao,
    });

    await atualizarResumo();
  };

  const atualizarResumo = async () => {
    if (!caixaAberto?.id) return;

    try {
      const resumo = await caixaService.getResumoCaixa(caixaAberto.id);
      setResumoCaixa(resumo);
    } catch (error) {
      console.error('Erro ao atualizar resumo:', error);
    }
  };

  const temCaixaAberto = !!caixaAberto && caixaAberto.status === 'ABERTO';

  return (
    <CaixaContext.Provider
      value={{
        caixaAberto,
        temCaixaAberto,
        resumoCaixa,
        verificandoCaixa,
        abrirCaixa,
        fecharCaixa,
        registrarSangria,
        atualizarResumo,
      }}
    >
      {children}
    </CaixaContext.Provider>
  );
}

export function useCaixa() {
  const context = useContext(CaixaContext);
  if (!context) {
    throw new Error('useCaixa deve ser usado dentro de um CaixaProvider');
  }
  return context;
}
