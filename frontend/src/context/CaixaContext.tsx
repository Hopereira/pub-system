'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTurno } from './TurnoContext';
import caixaService from '@/services/caixaService';
import { AberturaCaixa, ResumoCaixa, FormaPagamento } from '@/types/caixa';
import { io, Socket } from 'socket.io-client';

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
    forcarFechamento?: boolean;
  }) => Promise<void>;
  registrarSangria: (valor: number, motivo: string, observacao?: string) => Promise<void>;
  registrarVenda: (dados: {
    valor: number;
    formaPagamento: FormaPagamento;
    comandaId: string;
    comandaNumero: string;
    descricao: string;
  }) => Promise<void>;
  atualizarResumo: () => Promise<void>;
}

const CaixaContext = createContext<CaixaContextData>({} as CaixaContextData);

export function CaixaProvider({ children }: { children: ReactNode }) {
  const { turnoAtivo, temCheckIn } = useTurno();
  const [caixaAberto, setCaixaAberto] = useState<AberturaCaixa | null>(null);
  const [resumoCaixa, setResumoCaixa] = useState<ResumoCaixa | null>(null);
  const [verificandoCaixa, setVerificandoCaixa] = useState(true);

  const atualizarResumo = useCallback(async () => {
    if (!caixaAberto?.id) return;

    try {
      const resumo = await caixaService.getResumoCaixa(caixaAberto.id);
      setResumoCaixa(resumo);
    } catch (error) {
      console.error('Erro ao atualizar resumo:', error);
    }
  }, [caixaAberto?.id]);

  const verificarCaixaAberto = useCallback(async () => {
    if (!temCheckIn || !turnoAtivo?.funcionarioId) {
      setCaixaAberto(null);
      setResumoCaixa(null);
      setVerificandoCaixa(false);
      return;
    }

    try {
      setVerificandoCaixa(true);
      // Busca caixa aberto DO FUNCIONÁRIO ESPECÍFICO (isolamento de caixas)
      const caixa = await caixaService.getCaixaAbertoPorFuncionario(turnoAtivo.funcionarioId);
      setCaixaAberto(caixa);
      
      // Se tem caixa aberto, buscar resumo
      if (caixa) {
        const resumo = await caixaService.getResumoCaixa(caixa.id);
        setResumoCaixa(resumo);
      } else {
        setResumoCaixa(null);
      }
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      setCaixaAberto(null);
      setResumoCaixa(null);
    } finally {
      setVerificandoCaixa(false);
    }
  }, [temCheckIn, turnoAtivo?.funcionarioId]);

  // Verificar caixa aberto quando componente montar ou turno mudar
  useEffect(() => {
    verificarCaixaAberto();
  }, [verificarCaixaAberto]);

  // Polling para atualizar resumo do caixa automaticamente a cada 10 segundos
  useEffect(() => {
    if (!caixaAberto?.id) return;

    const interval = setInterval(() => {
      atualizarResumo();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [caixaAberto?.id, atualizarResumo]);

  // WebSocket: Escutar eventos de atualização do caixa em tempo real
  useEffect(() => {
    if (!caixaAberto?.id) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      // Socket conectado
    });

    socket.on('caixa_atualizado', (data: { aberturaCaixaId: string }) => {
      // Atualizar apenas se for o caixa atual
      if (data.aberturaCaixaId === caixaAberto.id) {
        atualizarResumo();
      }
    });

    socket.on('disconnect', () => {
      // Socket desconectado
    });

    return () => {
      socket.disconnect();
    };
  }, [caixaAberto?.id, atualizarResumo]);

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
    forcarFechamento?: boolean;
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

  const registrarVenda = async (dados: {
    valor: number;
    formaPagamento: FormaPagamento;
    comandaId: string;
    comandaNumero: string;
    descricao: string;
  }) => {
    if (!caixaAberto?.id) {
      console.warn('Nenhum caixa aberto. Venda não será registrada no caixa.');
      return;
    }

    try {
      await caixaService.registrarVenda({
        aberturaCaixaId: caixaAberto.id,
        ...dados,
      });
      
      // Atualizar resumo após registrar venda
      await atualizarResumo();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      throw error;
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
        registrarVenda,
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
