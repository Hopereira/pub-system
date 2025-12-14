'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import turnoService from '@/services/turnoService';
import { useTurno } from '@/context/TurnoContext';

interface CardCheckInProps {
  funcionarioId: string;
  funcionarioNome: string;
  eventoId?: string;
}

export function CardCheckIn({
  funcionarioId,
  funcionarioNome,
  eventoId,
}: CardCheckInProps) {
  const { turnoAtivo, setTurnoAtivo, verificarTurno, verificando } = useTurno();
  const [tempoTrabalhado, setTempoTrabalhado] = useState<string>('0h 0min');
  const [loading, setLoading] = useState(false);

  // Atualiza tempo trabalhado a cada minuto
  useEffect(() => {
    if (!turnoAtivo) return;

    const interval = setInterval(() => {
      calcularTempoTrabalhado();
    }, 60000); // Atualiza a cada 1 minuto

    calcularTempoTrabalhado(); // Calcula imediatamente

    return () => clearInterval(interval);
  }, [turnoAtivo]);

  const calcularTempoTrabalhado = () => {
    if (!turnoAtivo) return;

    const agora = new Date();
    const checkIn = new Date(turnoAtivo.checkIn);
    
    // Calcula diferença em milissegundos
    // O Date já converte automaticamente UTC para local
    const diffMs = agora.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Garante que não mostra valores negativos
    if (diffMins < 0) {
      setTempoTrabalhado('0h 0min');
      return;
    }

    const horas = Math.floor(diffMins / 60);
    const minutos = diffMins % 60;

    setTempoTrabalhado(`${horas}h ${minutos}min`);
  };

  const handleCheckIn = async () => {
    if (!funcionarioId) {
      toast.error('Erro: ID do funcionário não disponível. Faça logout e login novamente.');
      return;
    }

    try {
      setLoading(true);

      const turno = await turnoService.checkIn({
        funcionarioId,
        eventoId,
      });

      setTurnoAtivo(turno);
      toast.success('Check-in realizado com sucesso!', {
        description: `Bom trabalho, ${funcionarioNome}! 🎉`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao fazer check-in', {
        description: err.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!turnoAtivo) return;

    // Confirmação
    if (
      !confirm(
        `Tem certeza que deseja fazer check-out?\n\nTempo trabalhado: ${tempoTrabalhado}`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const turno = await turnoService.checkOut({
        funcionarioId,
      });

      setTurnoAtivo(null);
      toast.success('Check-out realizado com sucesso!', {
        description: `Até logo, ${funcionarioNome}! Você trabalhou ${formatarTempo(turno.horasTrabalhadas || 0)}`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao fazer check-out', {
        description: err.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  if (verificando) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Verificando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={turnoAtivo ? 'border-green-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {funcionarioNome}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${turnoAtivo ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}
            />
            <span className={`font-medium ${turnoAtivo ? 'text-green-600' : 'text-gray-500'}`}>
              {turnoAtivo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Tempo Trabalhado */}
        {turnoAtivo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tempo trabalhado:</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-mono font-medium text-blue-600">
                {tempoTrabalhado}
              </span>
            </div>
          </div>
        )}

        {/* Horário Check-in */}
        {turnoAtivo && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check-in:</span>
            <span className="font-medium">
              {new Date(turnoAtivo.checkIn).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {/* Botões */}
        <div className="pt-2">
          {!turnoAtivo ? (
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Fazendo Check-in...' : 'Fazer Check-in'}
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              {loading ? 'Fazendo Check-out...' : 'Fazer Check-out'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
