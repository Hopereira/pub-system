'use client';

import { useEffect, useState } from 'react';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp, Bell, Package, Plus, ClipboardList } from 'lucide-react';
import turnoService from '@/services/turnoService';
import * as pedidoService from '@/services/pedidoService';
import { FuncionarioAtivo, EstatisticasTurno } from '@/types/turno';
import { Pedido, PedidoStatus } from '@/types/pedido';
import { useAuth } from '@/context/AuthContext';
import { useGarcomNotification } from '@/hooks/useGarcomNotification';

export default function GarcomPage() {
  const { user } = useAuth();
  const [funcionariosAtivos, setFuncionariosAtivos] = useState<FuncionarioAtivo[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasTurno | null>(null);
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [horaAtual, setHoraAtual] = useState<string>('');
  const [dataAtual, setDataAtual] = useState<string>('');

  // WebSocket para notificações em tempo real
  const { connected, novoPedido } = useGarcomNotification({
    onNovoPedidoPronto: () => {
      // Recarregar pedidos quando um novo ficar pronto
      carregarDados();
    },
  });

  useEffect(() => {
    if (user?.id) {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Atualizar hora e data a cada segundo
  useEffect(() => {
    const atualizarHoraData = () => {
      const now = new Date();
      setHoraAtual(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDataAtual(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    atualizarHoraData(); // Atualizar imediatamente
    const interval = setInterval(atualizarHoraData, 1000);

    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      // ⚠️ Sistema de turnos não implementado - removido temporariamente
      // Busca apenas pedidos prontos
      const pedidos = await pedidoService.getPedidos().catch(() => []);
      
      // Filtrar apenas pedidos com status PRONTO
      const prontos = pedidos.filter(p => 
        p.itens?.some(item => item.status === PedidoStatus.PRONTO)
      );
      setPedidosProntos(prontos);
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

  // Verifica se o user tem ID (novo token JWT)
  if (!user.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600">⚠️ Token Desatualizado</h2>
          <p className="text-muted-foreground max-w-md">
            Seu token de autenticação está desatualizado. Por favor, faça logout e login novamente para continuar.
          </p>
        </div>
        <button
          onClick={() => {
            window.location.href = '/login';
          }}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Fazer Logout
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user.nome}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Área do Garçom - Pedidos Prontos para Entrega
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground capitalize mb-1">{dataAtual}</p>
          <div className="flex items-center gap-2 justify-end">
            <Clock className="h-5 w-5 text-primary" />
            <p className="text-3xl font-bold tabular-nums text-primary">{horaAtual}</p>
          </div>
        </div>
      </div>

      {/* Card de Check-In */}
      <CardCheckIn
        funcionarioId={user.id}
        funcionarioNome={user.nome}
      />

      {/* Estatísticas do Mês - Desabilitado temporariamente */}
      {false && estatisticas && (estatisticas?.totalTurnos ?? 0) > 0 && (
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
                <p className="text-2xl font-bold">{estatisticas?.totalTurnos}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Horas Totais</p>
                <p className="text-2xl font-bold">
                  {formatarTempo(estatisticas?.horasTotais ?? 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Média por Turno</p>
                <p className="text-2xl font-bold">
                  {formatarTempo(estatisticas?.horasMedia ?? 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Turno Mais Longo</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatarTempo(estatisticas?.turnoMaisLongo ?? 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Turno Mais Curto</p>
                <p className="text-xl font-bold text-green-600">
                  {formatarTempo(estatisticas?.turnoMaisCurto ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funcionários Ativos - Desabilitado temporariamente */}
      {false && funcionariosAtivos.length > 0 && (
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
              href="/garcom/novo-pedido"
              className="p-4 border-2 border-primary rounded-lg hover:shadow-lg transition-all text-center group bg-primary/5"
            >
              <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold text-primary">Novo Pedido</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fazer pedido para cliente
              </p>
            </a>

            <a
              href="/dashboard/mapa/visualizar"
              className="p-4 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
            >
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
              <h3 className="font-semibold">Mapa Visual</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Layout do ambiente
              </p>
            </a>

            <a
              href="/dashboard/operacional/pedidos-prontos"
              className={`p-4 border-2 rounded-lg hover:shadow-md transition-all text-center group ${
                pedidosProntos.length > 0 
                  ? 'border-yellow-500 bg-yellow-50 animate-pulse' 
                  : 'hover:border-primary'
              }`}
            >
              <Bell className={`h-8 w-8 mx-auto mb-2 ${
                pedidosProntos.length > 0 
                  ? 'text-yellow-600' 
                  : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <h3 className={`font-semibold ${pedidosProntos.length > 0 ? 'text-yellow-800' : ''}`}>
                Pedidos Prontos
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {pedidosProntos.length > 0 
                  ? `${pedidosProntos.length} aguardando entrega` 
                  : 'Nenhum no momento'
                }
              </p>
              {pedidosProntos.length > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {pedidosProntos.length}
                </Badge>
              )}
            </a>

            <a
              href="/dashboard/gestaopedidos"
              className="p-4 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
            >
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
              <h3 className="font-semibold">Gestão de Pedidos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Organizar entregas
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Prontos */}
      <Card className={`${
        pedidosProntos.length > 0 
          ? 'border-2 border-yellow-500 shadow-lg' 
          : ''
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className={`h-5 w-5 ${
                pedidosProntos.length > 0 ? 'text-yellow-600 animate-pulse' : ''
              }`} />
              Pedidos Prontos
            </div>
            {pedidosProntos.length > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {pedidosProntos.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidosProntos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum pedido pronto no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosProntos.slice(0, 3).map((pedido) => {
                const itensProntos = pedido.itens?.filter(i => i.status === 'PRONTO') || [];
                return (
                  <div
                    key={pedido.id}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {pedido.comanda?.mesa 
                            ? `Mesa ${pedido.comanda.mesa.numero}`
                            : 'Mesa Balcão'
                          }
                        </p>
                        {pedido.comanda?.cliente && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pedido.comanda.cliente.nome}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {itensProntos.length} {itensProntos.length === 1 ? 'item pronto' : 'itens prontos'}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        PRONTO
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {pedidosProntos.length > 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  + {pedidosProntos.length - 3} pedidos
                </p>
              )}
              <a
                href="/dashboard/operacional/pedidos-prontos"
                className="block w-full mt-4 p-3 bg-primary text-white text-center rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Ver Todos os Pedidos Prontos
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
