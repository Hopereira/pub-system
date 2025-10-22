'use client';

import { useEffect, useState } from 'react';
import { PedidoCard } from '@/components/operacional/PedidoCard';
import { Pedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { getPedidosPorAmbiente, updateItemStatus } from '@/services/pedidoService';
import { getAmbienteById } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de notificação com som para novos pedidos
  const { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio 
  } = useAmbienteNotification(ambienteId);

  const fetchDados = async () => {
    try {
      const [pedidosData, ambienteData] = await Promise.all([
        getPedidosPorAmbiente(ambienteId),
        getAmbienteById(ambienteId),
      ]);
      setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
      setAmbiente(ambienteData);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar os dados.');
      toast.error('Falha ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
    // Adicionamos um polling para atualizar os pedidos a cada 30 segundos
    const intervalId = setInterval(fetchDados, 30000);
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, [ambienteId]);

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
    'Pronto': PedidoStatus.PRONTO,
    'Aguardando Retirada': PedidoStatus.DEIXADO_NO_AMBIENTE,
  };

  return (
    <>
      <div className="mb-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ambiente?.nome || 'Painel Operacional'}</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie os pedidos em tempo real.</p>
        </div>
        
        {/* Botão para ativar notificações sonoras */}
        {audioConsentNeeded ? (
          <Button 
            onClick={handleAllowAudio}
            variant="default"
            size="lg"
            className="gap-2"
          >
            <Bell className="h-5 w-5" />
            Ativar Som de Notificações
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <BellOff className="h-5 w-5" />
            <span>Notificações ativadas</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow h-full">
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