// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

import { getPedidos, updateItemStatus } from '@/services/pedidoService';
import { UpdateItemPedidoStatusDto } from '@/types/pedido.dto';
import { Pedido, PedidoStatus } from '@/types/pedido';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import { Button } from '../ui/button';
import { Bell, Filter, Clock, ChefHat, CheckCircle2 } from 'lucide-react';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CozinhaPageClientProps {
  ambienteId?: string;
}

export default function CozinhaPageClient({ ambienteId: initialAmbienteId }: CozinhaPageClientProps) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [todosPedidos, setTodosPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(initialAmbienteId || null);
  
  const { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio,
    novoPedidoRecebido,
  } = useAmbienteNotification(ambienteSelecionado);
  
  // ✅ CORREÇÃO: Usa SocketContext global com JWT
  const { subscribe, unsubscribe, isConnected } = useSocket();

  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        const data = await getAmbientes();
        const ambientesPreparo = data.filter((a: Ambiente) => a.tipo === 'PREPARO');
        setAmbientes(ambientesPreparo);
        if (!ambienteSelecionado && ambientesPreparo.length > 0) {
          setAmbienteSelecionado(ambientesPreparo[0].id);
        }
        // Carrega todos os pedidos em background
        const todosPedidosData = await getPedidos();
        setTodosPedidos(todosPedidosData);
      } catch (error) {
        toast.error('Erro ao carregar ambientes');
      }
    };
    fetchAmbientes();
  }, []);

  const metricasPorAmbiente = useMemo(() => {
    const metricas: Record<string, { aguardando: number; emPreparo: number; prontos: number; tempoMedioEspera: number }> = {};
    // Usa todosPedidos para métricas dos cards (todos os ambientes)
    // Se não carregou ainda, usa pedidos do ambiente atual como fallback
    const fonte = todosPedidos.length > 0 ? todosPedidos : pedidos;
    ambientes.forEach(ambiente => {
      const itensPorAmbiente = fonte.flatMap(p => p.itens.filter(item => item.produto?.ambiente?.id === ambiente.id));
      const aguardando = itensPorAmbiente.filter(i => i.status === 'FEITO').length;
      const emPreparo = itensPorAmbiente.filter(i => i.status === 'EM_PREPARO').length;
      const prontos = itensPorAmbiente.filter(i => i.status === 'PRONTO').length;
      const itensAguardando = fonte.filter(p => p.itens.some(item => item.produto?.ambiente?.id === ambiente.id && (item.status === 'FEITO' || item.status === 'EM_PREPARO')));
      let tempoMedioEspera = 0;
      if (itensAguardando.length > 0) {
        const agora = new Date().getTime();
        const tempoTotal = itensAguardando.reduce((acc, p) => acc + (agora - new Date(p.data).getTime()), 0);
        tempoMedioEspera = Math.floor(tempoTotal / itensAguardando.length / 60000);
      }
      metricas[ambiente.id] = { aguardando, emPreparo, prontos, tempoMedioEspera };
    });
    return metricas;
  }, [ambientes, pedidos, todosPedidos]);

  useEffect(() => {
    if (!ambienteSelecionado) return;
    const fetchPedidos = async () => {
      setIsLoading(true);
      try {
        const data = await getPedidos({ ambienteId: ambienteSelecionado });
        setPedidos(data);
        // Atualiza todosPedidos mesclando com o novo lote
        setTodosPedidos(prev => {
          const outros = prev.filter(p => !p.itens.some(i => i.produto?.ambiente?.id === ambienteSelecionado));
          return [...outros, ...data];
        });
      } catch (error) {
        toast.error('Erro ao carregar pedidos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPedidos();
  }, [ambienteSelecionado]);

  // ✅ CORREÇÃO: Escuta eventos via SocketContext (que tem o token JWT)
  // Eventos são emitidos para o room do tenant, então precisamos usar o SocketContext
  useEffect(() => {
    if (!ambienteSelecionado) return;
    
    // Eventos específicos do ambiente (emitidos para tenant room)
    const novoPedidoAmbienteEvent = `novo_pedido_ambiente:${ambienteSelecionado}`;
    const statusAtualizadoAmbienteEvent = `status_atualizado_ambiente:${ambienteSelecionado}`;
    
    // Handler para novo pedido
    const handleNovoPedido = (novoPedido: Pedido) => {
      console.log('🆕 [CozinhaPage] Novo pedido recebido:', novoPedido.id);
      setPedidos(prev => [novoPedido, ...prev.filter(p => p.id !== novoPedido.id)]);
      setTodosPedidos(prev => [novoPedido, ...prev.filter(p => p.id !== novoPedido.id)]);
    };
    
    // Handler para status atualizado
    const handleStatusAtualizado = (pedidoAtualizado: Pedido) => {
      console.log('🔄 [CozinhaPage] Status atualizado:', pedidoAtualizado.id);
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setTodosPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
    };

    // Inscreve nos eventos via SocketContext
    subscribe(novoPedidoAmbienteEvent, handleNovoPedido);
    subscribe(statusAtualizadoAmbienteEvent, handleStatusAtualizado);
    
    console.log(`📡 [CozinhaPage] Inscrito nos eventos do ambiente ${ambienteSelecionado}`, {
      isConnected,
      events: [novoPedidoAmbienteEvent, statusAtualizadoAmbienteEvent]
    });

    return () => {
      unsubscribe(novoPedidoAmbienteEvent, handleNovoPedido);
      unsubscribe(statusAtualizadoAmbienteEvent, handleStatusAtualizado);
    };
  }, [ambienteSelecionado, subscribe, unsubscribe, isConnected]);

  // ✅ Atualiza lista quando receber notificação do hook
  useEffect(() => {
    if (novoPedidoRecebido) {
      console.log('📨 [CozinhaPage] novoPedidoRecebido do hook:', novoPedidoRecebido.id);
      const updater = (prev: Pedido[]) => {
        const existe = prev.find(p => p.id === novoPedidoRecebido.id);
        if (existe) {
          return prev.map(p => p.id === novoPedidoRecebido.id ? novoPedidoRecebido : p);
        } else {
          return [novoPedidoRecebido, ...prev];
        }
      };
      setPedidos(updater);
      setTodosPedidos(updater);
    }
  }, [novoPedidoRecebido]);

  const handleItemStatusChange = async (itemPedidoId: string, novoStatus: PedidoStatus) => {
    try {
      const data: UpdateItemPedidoStatusDto = { status: novoStatus };
      await updateItemStatus(itemPedidoId, data);
      toast.success(`Item atualizado para ${novoStatus.replace('_', ' ')}!`);
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar o status do item.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const pedidosFiltrados = ambienteSelecionado
    ? pedidos.filter(pedido => pedido.itens.some(item => item.produto?.ambiente?.id === ambienteSelecionado))
    : pedidos;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pedidos de Preparo</h1>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={ambienteSelecionado || undefined} onValueChange={setAmbienteSelecionado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                {ambientes.map(ambiente => (
                  <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {audioConsentNeeded ? (
          <Button onClick={handleAllowAudio} variant="secondary" size="sm" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Ativar Som de Notific
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4 text-green-600" />
            <span>Notificações ativadas</span>
          </div>
        )}
      </div>

      {user && (
        <div className="mb-6">
          <CardCheckIn funcionarioId={user.id} funcionarioNome={user.nome} />
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {ambientes.map(ambiente => {
          const metricas = metricasPorAmbiente[ambiente.id] || { aguardando: 0, emPreparo: 0, prontos: 0, tempoMedioEspera: 0 };
          const isSelected = ambienteSelecionado === ambiente.id;
          const temPedidos = metricas.aguardando > 0 || metricas.emPreparo > 0;
          return (
            <Card 
              key={ambiente.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'} ${temPedidos ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
              onClick={() => setAmbienteSelecionado(ambiente.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    {ambiente.nome}
                  </span>
                  {temPedidos && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                    <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{metricas.aguardando}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">Aguardando</div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{metricas.emPreparo}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-500">Em Preparo</div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                    <div className="text-xl font-bold text-green-700 dark:text-green-400">{metricas.prontos}</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Prontos</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className={`h-4 w-4 ${metricas.tempoMedioEspera > 15 ? 'text-red-500' : metricas.tempoMedioEspera > 10 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className={metricas.tempoMedioEspera > 15 ? 'text-red-600 font-semibold' : metricas.tempoMedioEspera > 10 ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}>
                    {metricas.tempoMedioEspera > 0 ? `${metricas.tempoMedioEspera} min espera` : 'Sem espera'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ambienteSelecionado && (
        <>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Pedidos - {ambientes.find(a => a.id === ambienteSelecionado)?.nome}
          </h2>
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-lg">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="text-muted-foreground">Nenhum pedido aguardando preparo neste ambiente.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pedidosFiltrados.map(pedido => (
                <div key={pedido.id} className={`transition-all duration-500 ${novoPedidoId === pedido.id ? 'ring-4 ring-green-500 ring-opacity-50 animate-pulse' : ''}`}>
                  <PedidoCard pedido={pedido} onItemStatusChange={handleItemStatusChange} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}