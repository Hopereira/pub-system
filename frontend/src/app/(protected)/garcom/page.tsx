'use client';

import { useEffect, useState } from 'react';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp } from 'lucide-react';
import turnoService from '@/services/turnoService';
import { FuncionarioAtivo, EstatisticasTurno } from '@/types/turno';
import { useAuth } from '@/context/AuthContext';

export default function GarcomPage() {
  const { user } = useAuth();
  const [funcionariosAtivos, setFuncionariosAtivos] = useState<FuncionarioAtivo[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasTurno | null>(null);

  useEffect(() => {
    if (user?.id) {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const carregarDados = async () => {
    try {
      // Busca funcionários ativos e estatísticas em paralelo
      const [ativos, stats] = await Promise.all([
        turnoService.getFuncionariosAtivos().catch(() => []),
        user?.id
          ? turnoService
              .getEstatisticasFuncionario(user.id, {
                dataInicio: getInicioMes(),
                dataFim: new Date().toISOString(),
              })
              .catch(() => null)
          : Promise.resolve(null),
      ]);

      setFuncionariosAtivos(ativos);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const getInicioMes = (): string => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  };

  const formatarTempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Olá, {user.nome}! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu turno e veja suas estatísticas
        </p>
      </div>

      {/* Card de Check-in/Check-out */}
      <CardCheckIn
        funcionarioId={user.id}
        funcionarioNome={user.nome}
      />

      {/* Estatísticas do Mês */}
      {estatisticas && estatisticas.totalTurnos > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Turnos</p>
                <p className="text-2xl font-bold">{estatisticas.totalTurnos}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Horas Totais</p>
                <p className="text-2xl font-bold">
                  {formatarTempo(estatisticas.horasTotais)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Média por Turno</p>
                <p className="text-2xl font-bold">
                  {formatarTempo(estatisticas.horasMedia)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Turno Mais Longo</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatarTempo(estatisticas.turnoMaisLongo)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Turno Mais Curto</p>
                <p className="text-xl font-bold text-green-600">
                  {formatarTempo(estatisticas.turnoMaisCurto)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funcionários Ativos */}
      {funcionariosAtivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipe Ativa ({funcionariosAtivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funcionariosAtivos.map((func) => (
                <div
                  key={func.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {func.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{func.nome}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {func.cargo.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatarTempo(func.tempoTrabalhado)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desde{' '}
                      {new Date(func.checkIn).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/dashboard/gestaopedidos"
              className="p-4 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
              <h3 className="font-semibold">Gestão de Pedidos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ver pedidos prontos
              </p>
            </a>

            <a
              href="/dashboard"
              className="p-4 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
            >
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
              <h3 className="font-semibold">Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ver estatísticas
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
