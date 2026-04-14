'use client';

import { useEffect, useState, useMemo } from 'react';
import { PedidoCard } from '@/components/operacional/PedidoCard';
import { Pedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { getPedidosPorAmbiente, updateItemStatus } from '@/services/pedidoService';
import { getAmbienteById, getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Clock, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { useAuth } from '@/context/AuthContext';

export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de notificação com som para novos pedidos
  const { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio,
    isConnected,
    novoPedidoRecebido
  } = useAmbienteNotification(ambienteId);

  const fetchDados = async () => {
    try {
      const [pedidosData, ambienteData, ambientesData] = await Promise.all([
        getPedidosPorAmbiente(ambienteId),
        getAmbienteById(ambienteId),
        getAmbientes(),
      ]);
      setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
      setAmbiente(ambienteData);
      setAmbientes(ambientesData.filter((a: Ambiente) => a.tipo === 'PREPARO'));
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar os dados.');
      toast.error('Falha ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  // Calcula métricas do ambiente atual
  const metricas = useMemo(() => {
    const itens = pedidos.flatMap(p => p.itens);
    return {
      aFazer: itens.filter(i => i.status === PedidoStatus.FEITO).length,
      emPreparo: itens.filter(i => i.status === PedidoStatus.EM_PREPARO).length,
      quasePronto: itens.filter(i => i.status === PedidoStatus.QUASE_PRONTO).length,
      prontos: itens.filter(i => i.status === PedidoStatus.PRONTO).length,
      aguardandoRetirada: itens.filter(i => i.status === PedidoStatus.DEIXADO_NO_AMBIENTE).length,
    };
  }, [pedidos]);

  useEffect(() => {
    fetchDados();
    
    // Polling apenas se WebSocket desconectado (fallback)
    if (!isConnected) {
      const intervalId = setInterval(fetchDados, 30000);
      return () => clearInterval(intervalId);
    }
  }, [ambienteId, isConnected]);

  // Recarrega dados quando recebe novo pedido via WebSocket
  useEffect(() => {
    if (novoPedidoRecebido) {
      // Atualiza estado diretamente (sem depender do cache)
      setPedidos(prev => {
        const existe = prev.find(p => p.id === novoPedidoRecebido.id);
        if (existe) {
          return prev.map(p => p.id === novoPedidoRecebido.id ? novoPedidoRecebido : p);
        }
        return [novoPedidoRecebido, ...prev];
      });
      // Re-fetch em background para consistência total
      fetchDados();
    }
  }, [novoPedidoRecebido]);

  const handleUpdateStatus = async (itemPedidoId: string, novoStatus: PedidoStatus) => {
    try {
      await updateItemStatus(itemPedidoId, { status: novoStatus });
      toast.success('Status do item atualizado!');
      await fetchDados(); // Atualiza a tela imediatamente
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar o status do item.');
    }
  };

  const handleCancelItem = async (itemPedidoId: string, motivo: string) => {
    try {
      await updateItemStatus(itemPedidoId, {
        status: PedidoStatus.CANCELADO,
        motivoCancelamento: motivo,
      });
      toast.success('Item cancelado com sucesso!');
      await fetchDados();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cancelar o item.');
    }
  };

  if (loading) return <p className="mt-8 text-center">Carregando painel...</p>;
  if (error) return <p className="mt-8 text-center text-red-500">Erro: {error}</p>;

  const colunas: Record<string, PedidoStatus> = {
    'A Fazer': PedidoStatus.FEITO,
    'Em Preparo': PedidoStatus.EM_PREPARO,
    'Quase Pronto': PedidoStatus.QUASE_PRONTO,
    'Pronto': PedidoStatus.PRONTO,
    'Aguardando Retirada': PedidoStatus.DEIXADO_NO_AMBIENTE,
  };

  return (
    <>
      <div className="mb-4 flex-shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{ambiente?.nome || 'Painel Operacional'}</h1>
          <p className="text-muted-foreground text-sm">Acompanhe e gerencie os pedidos em tempo real.</p>
        </div>
        
        {audioConsentNeeded ? (
          <Button onClick={handleAllowAudio} variant="default" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Ativar Som de Notificações
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <BellOff className="h-4 w-4" />
            <span>Notificações ativadas</span>
          </div>
        )}
      </div>

      {/* Card de Check-In/Check-Out */}
      {user && (
        <div className="mb-4">
          <CardCheckIn funcionarioId={user.id} funcionarioNome={user.nome} />
        </div>
      )}

      {/* Cards de Ambientes de Preparo */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4">
        {ambientes.map(amb => {
          const isSelected = amb.id === ambienteId;
          return (
            <Card 
              key={amb.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => router.push(`/dashboard/operacional/${amb.id}`)}
            >
              <CardContent className="p-3 text-center">
                <ChefHat className={`h-5 w-5 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>{amb.nome}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas do Ambiente Atual */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{metricas.aFazer}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500">A Fazer</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{metricas.emPreparo}</div>
          <div className="text-xs text-blue-600 dark:text-blue-500">Em Preparo</div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-orange-700 dark:text-orange-400">{metricas.quasePronto}</div>
          <div className="text-xs text-orange-600 dark:text-orange-500">Quase Pronto</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-700 dark:text-green-400">{metricas.prontos}</div>
          <div className="text-xs text-green-600 dark:text-green-500">Prontos</div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{metricas.aguardandoRetirada}</div>
          <div className="text-xs text-purple-600 dark:text-purple-500">Retirada</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-grow">
        {Object.entries(colunas).map(([titulo, status]) => (
          <div key={status} className="bg-card rounded-lg p-4 flex flex-col shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">{titulo}</h2>
            <div className="space-y-4 flex-grow overflow-y-auto p-1">
              {/* Otimização: Filtramos os pedidos que pertencem a esta coluna ANTES de mapeá-los */}
              {pedidos
                .filter(p => p.itens.some(item => item.status === status))
                .map(pedido => (
                  <div
                    key={pedido.id}
                    className={`transition-all duration-500 ${
                      novoPedidoId === pedido.id 
                        ? 'ring-4 ring-green-500 ring-opacity-50 animate-pulse' 
                        : ''
                    }`}
                  >
                    <PedidoCard
                      pedido={pedido}
                      onUpdateStatus={handleUpdateStatus}
                      onCancel={handleCancelItem}
                      filtroStatus={status}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}