'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChefHat,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { getPedidosPorAmbiente } from '@/services/pedidoService';
import { Pedido, PedidoStatus } from '@/types/pedido';

export default function CozinhaPage() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno();
  const router = useRouter();
  
  const [estatisticas, setEstatisticas] = useState({
    emPreparo: 0,
    aguardando: 0,
    prontos: 0,
  });
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirecionar sempre para o kanban quando já tem check-in
  const irParaKanban = () => {
    if (user?.ambienteId) {
      router.push(`/dashboard/operacional/${user.ambienteId}`);
    } else {
      router.push('/dashboard/gestaopedidos');
    }
  };

  // Alerta ao tentar sair sem fazer checkout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (temCheckIn) {
        e.preventDefault();
        e.returnValue = 'Você ainda não fez check-out! Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [temCheckIn]);

  // Buscar pedidos do ambiente
  useEffect(() => {
    const carregarPedidos = async () => {
      if (!user?.ambienteId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPedidosPorAmbiente(user.ambienteId);
        setPedidos(data);

        // Calcular estatísticas
        const stats = {
          emPreparo: data.filter(p => p.itens?.some(i => i.status === PedidoStatus.EM_PREPARO)).length,
          aguardando: data.filter(p => p.itens?.some(i => i.status === PedidoStatus.FEITO)).length,
          prontos: data.filter(p => p.itens?.some(i => i.status === PedidoStatus.PRONTO || i.status === PedidoStatus.QUASE_PRONTO)).length,
        };
        setEstatisticas(stats);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (temCheckIn) {
      carregarPedidos();
      // Atualizar a cada 30 segundos
      const interval = setInterval(carregarPedidos, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user?.ambienteId, temCheckIn]);

  // Saudação baseada no horário
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Nome do ambiente
  const getNomeAmbiente = () => {
    if (!user?.ambienteId) return 'Cozinha';
    // Você pode buscar o nome real do ambiente se necessário
    return 'Cozinha';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho com Saudação */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold">
            {getSaudacao()}, {user?.nome?.split(' ')[0]}! 👨‍🍳
          </h1>
        </div>
        <p className="text-muted-foreground">
          Área de Preparo - {getNomeAmbiente()}
        </p>
      </div>

      {/* Grid: Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Check-in/Check-out */}
        {user?.id && (
          <CardCheckIn 
            funcionarioId={user.id} 
            funcionarioNome={user.nome || 'Usuário'} 
          />
        )}

        {/* Card de Ambiente */}
        {temCheckIn && (
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Seu Ambiente de Preparo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ambiente:</span>
                <Badge variant="default" className="bg-orange-600">
                  {getNomeAmbiente()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-green-600">Operacional</span>
                </div>
              </div>
              <Button 
                onClick={irParaKanban} 
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Ir para o Kanban de Pedidos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerta: Faça check-in */}
      {!temCheckIn && (
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Faça Check-in para Começar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              <strong>Atenção:</strong> Você precisa fazer check-in antes de acessar o painel de preparo.
              Inicie seu turno para começar a preparar pedidos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas em Tempo Real */}
      {temCheckIn && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando Preparo
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{loading ? '...' : estatisticas.aguardando}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pedidos recebidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Em Preparo
              </CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{loading ? '...' : estatisticas.emPreparo}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sendo preparados agora
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prontos/Quase Prontos
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '...' : estatisticas.prontos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando retirada
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Últimos Pedidos com Horários e Garçom */}
      {temCheckIn && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Últimos Pedidos Recebidos</h2>
          
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Carregando pedidos...
              </CardContent>
            </Card>
          ) : pedidos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum pedido no momento
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pedidos.slice(0, 5).map((pedido) => {
                const horarioFeito = pedido.data ? new Date(pedido.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const itemEntregue = pedido.itens?.find(i => i.entregueEm);
                const horarioEntregue = itemEntregue?.entregueEm ? new Date(itemEntregue.entregueEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
                const garcomNome = itemEntregue?.garcomEntrega?.nome || pedido.comanda?.cliente?.nome || 'Sem garçom';
                const mesaNumero = pedido.comanda?.mesa?.numero || '--';
                
                return (
                  <Card key={pedido.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">#{mesaNumero}</div>
                            <p className="text-xs text-muted-foreground">Mesa</p>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-sm">Feito às {horarioFeito}</span>
                            </div>
                            {horarioEntregue && (
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-muted-foreground">Entregue às {horarioEntregue}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                👤 {garcomNome}
                              </Badge>
                              <Badge variant={
                                pedido.itens?.some(i => i.status === 'PRONTO') ? 'default' :
                                pedido.itens?.some(i => i.status === 'EM_PREPARO') ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {pedido.itens?.length || 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={irParaKanban}
                          className="ml-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              <Button 
                onClick={irParaKanban} 
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Package className="mr-2 h-5 w-5" />
                Ver Todos os Pedidos no Kanban
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dicas Rápidas */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-5 w-5" />
            💡 Dicas Rápidas para a Cozinha
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Faça <strong>check-in</strong> no início do turno para começar a trabalhar</p>
          <p>• Veja os <strong>últimos pedidos</strong> com horário de criação e garçom responsável</p>
          <p>• Os pedidos são atualizados em <strong>tempo real</strong> a cada 30 segundos</p>
          <p>• Clique no botão para acessar o <strong>Kanban completo</strong> do seu ambiente</p>
          <div>• No Kanban, mova pedidos entre: <Badge variant="outline" className="mx-1">FEITO</Badge> → <Badge variant="outline" className="mx-1">EM PREPARO</Badge> → <Badge variant="outline" className="mx-1">PRONTO</Badge></div>
          <p>• Use o botão <strong>&quot;Voltar&quot;</strong> no Kanban para retornar a este dashboard</p>
          <p>• Não esqueça de fazer <strong>check-out</strong> ao final do turno</p>
        </CardContent>
      </Card>
    </div>
  );
}
