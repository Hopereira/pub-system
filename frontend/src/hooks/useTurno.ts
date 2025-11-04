import { useState, useEffect, useCallback } from 'react';
import turnoService from '@/services/turnoService';
import { TurnoFuncionario } from '@/types/turno';
import { toast } from 'sonner';

export function useTurno(funcionarioId?: string) {
  const [turnoAtivo, setTurnoAtivo] = useState<TurnoFuncionario | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Verifica turno ativo ao carregar
  useEffect(() => {
    if (funcionarioId) {
      verificarTurnoAtivo();
    }
  }, [funcionarioId]);

  const verificarTurnoAtivo = useCallback(async () => {
    if (!funcionarioId) return;

    try {
      setVerificando(true);
      const turnos = await turnoService.getTurnosFuncionario(funcionarioId);
      const ativo = turnos.find((t) => t.ativo && !t.checkOut);
      setTurnoAtivo(ativo || null);
    } catch (error) {
      console.error('Erro ao verificar turno:', error);
    } finally {
      setVerificando(false);
    }
  }, [funcionarioId]);

  const checkIn = useCallback(
    async (eventoId?: string) => {
      if (!funcionarioId) {
        toast.error('ID do funcionário não fornecido');
        return null;
      }

      try {
        setLoading(true);
        const turno = await turnoService.checkIn({
          funcionarioId,
          eventoId,
        });
        setTurnoAtivo(turno);
        toast.success('Check-in realizado com sucesso! 🎉');
        return turno;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error('Erro ao fazer check-in', {
          description: err.response?.data?.message || 'Tente novamente',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [funcionarioId],
  );

  const checkOut = useCallback(async () => {
    if (!funcionarioId) {
      toast.error('ID do funcionário não fornecido');
      return null;
    }

    try {
      setLoading(true);
      const turno = await turnoService.checkOut({
        funcionarioId,
      });
      setTurnoAtivo(null);
      toast.success('Check-out realizado com sucesso!', {
        description: `Você trabalhou ${formatarTempo(turno.horasTrabalhadas || 0)}`,
      });
      return turno;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao fazer check-out', {
        description: err.response?.data?.message || 'Tente novamente',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [funcionarioId]);

  const formatarTempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  return {
    turnoAtivo,
    loading,
    verificando,
    checkIn,
    checkOut,
    verificarTurnoAtivo,
    isAtivo: !!turnoAtivo && !turnoAtivo.checkOut,
  };
}
