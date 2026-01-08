'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, Filter, Bell, BellOff, ArrowLeft } from 'lucide-react';
import { getPedidosPorAmbiente } from '@/services/pedidoService';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { Pedido, PedidoStatus } from '@/types/pedido';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import PedidoCard from '@/components/cozinha/PedidoCard';
import { updateItemStatus } from '@/services/pedidoService';
import { UpdateItemPedidoStatusDto } from '@/types/pedido.dto';
import { useSocket } from '@/context/SocketContext';

interface PreparoPedidosProps {
  ambienteIdInicial?: string;
}

/**
 * Componente de Preparo para COZINHEIRO
 * 
 * Características:
 * - Kanban board simplificado
 * - Seletor de ambiente dinâmico
 * - Notificações sonoras automáticas
 * - WebSocket em tempo real
 */
export default function PreparoPedidos({ ambienteIdInicial }: PreparoPedidosProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(
    ambienteIdInicial || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook de notificação de ambiente
  const {
    novoPedidoId,
    audioConsentNeeded,
    handleAllowAudio,
    clearNotification,
    novoPedidoRecebido,
    isConnected,
  } = useAmbienteNotification(ambienteSelecionado);
  
  // ✅ CORREÇÃO: Usa SocketContext global com JWT
  const { subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isLoading && ambienteSelecionado) {
      // Limpa pedidos anteriores antes de carregar novos
      setPedidos([]);
      setIsRefreshing(true);
      loadPedidos().finally(() => setIsRefreshing(false));
    }
  }, [ambienteSelecionado]);

  // ✅ CORREÇÃO: WebSocket - escuta novos pedidos e atualizações via SocketContext
  useEffect(() => {
    if (!ambienteSelecionado) return;
    
    // Eventos específicos do ambiente (emitidos para tenant room)
    const novoPedidoAmbienteEvent = `novo_pedido_ambiente:${ambienteSelecionado}`;
    const statusAtualizadoAmbienteEvent = `status_atualizado_ambiente:${ambienteSelecionado}`;

    const handleNovoPedido = (novoPedido: Pedido) => {
      logger.log('🆕 Novo pedido recebido via SocketContext', {
        module: 'PreparoPedidos',
        data: { pedidoId: novoPedido.id },
      });
      setPedidos((prev) => [novoPedido, ...prev.filter(p => p.id !== novoPedido.id)]);
    };

    const handleStatusAtualizado = (pedidoAtualizado: Pedido) => {
      logger.log('🔄 Status atualizado via SocketContext', {
        module: 'PreparoPedidos',
        data: { pedidoId: pedidoAtualizado.id },
      });
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoAtualizado.id ? pedidoAtualizado : p))
      );
    };

    subscribe(novoPedidoAmbienteEvent, handleNovoPedido);
    subscribe(statusAtualizadoAmbienteEvent, handleStatusAtualizado);
    
    logger.log(`📡 Inscrito nos eventos do ambiente ${ambienteSelecionado}`, {
      module: 'PreparoPedidos',
      data: { events: [novoPedidoAmbienteEvent, statusAtualizadoAmbienteEvent] },
    });

    return () => {
      unsubscribe(novoPedidoAmbienteEvent, handleNovoPedido);
      unsubscribe(statusAtualizadoAmbienteEvent, handleStatusAtualizado);
    };
  }, [ambienteSelecionado, subscribe, unsubscribe]);
  
  // ✅ Atualiza lista quando receber notificação do hook
  useEffect(() => {
    if (novoPedidoRecebido) {
      logger.log('📨 novoPedidoRecebido do hook', {
        module: 'PreparoPedidos',
        data: { pedidoId: novoPedidoRecebido.id },
      });
      setPedidos((prev) => {
        const existe = prev.find(p => p.id === novoPedidoRecebido.id);
        if (existe) {
          return prev.map(p => p.id === novoPedidoRecebido.id ? novoPedidoRecebido : p);
        } else {
          return [novoPedidoRecebido, ...prev];
        }
      });
    }
  }, [novoPedidoRecebido]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const ambientesData = await getAmbientes();
      const ambientesPreparo = ambientesData?.filter((amb) => amb.tipo === 'PREPARO') || [];
      setAmbientes(ambientesPreparo);

      // Se tem ambiente inicial ou seleciona o primeiro disponível
      const ambienteParaCarregar = ambienteIdInicial || (ambientesPreparo.length > 0 ? ambientesPreparo[0].id : null);
      
      if (ambienteParaCarregar) {
        setAmbienteSelecionado(ambienteParaCarregar);
        // Carrega pedidos do ambiente inicial
        const pedidosData = await getPedidosPorAmbiente(ambienteParaCarregar);
        setPedidos(pedidosData);
      }

      logger.log('✅ Ambientes de preparo carregados', {
        module: 'PreparoPedidos',
        data: { total: ambientesPreparo.length },
      });
    } catch (error) {
      logger.error('Erro ao carregar ambientes', {
        module: 'PreparoPedidos',
        error: error as Error,
      });
      toast.error('Erro ao carregar ambientes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidos = async () => {
    if (!ambienteSelecionado) return;

    try {
      const data = await getPedidosPorAmbiente(ambienteSelecionado);
      setPedidos(data);

      logger.debug('Pedidos do ambiente carregados', {
        module: 'PreparoPedidos',
        data: { ambienteId: ambienteSelecionado, total: data.length },
      });
    } catch (error) {
      logger.error('Erro ao carregar pedidos', {
        module: 'PreparoPedidos',
        error: error as Error,
      });
      toast.error('Erro ao carregar pedidos');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPedidos();
    setIsRefreshing(false);
    toast.success('Pedidos atualizados!');
  };

  const handleItemStatusChange = async (itemPedidoId: string, novoStatus: PedidoStatus) => {
    try {
      const data: UpdateItemPedidoStatusDto = { status: novoStatus };
      await updateItemStatus(itemPedidoId, data);
      toast.success(`Item atualizado para ${novoStatus.replace('_', ' ')}!`);
      
      // Recarrega pedidos após atualização para garantir sincronização
      await loadPedidos();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar o status do item.');
    }
  };

  // Filtra pedidos que contêm itens do ambiente selecionado
  const pedidosFiltrados = ambienteSelecionado
    ? pedidos.filter((pedido) =>
        pedido.itens.some((item) => item.produto?.ambiente?.id === ambienteSelecionado)
      )
    : pedidos;

  // Organiza pedidos em colunas do Kanban
  // Considera apenas itens do ambiente selecionado para determinar a coluna
  const colunas = {
    feito: pedidosFiltrados.filter((p) =>
      p.itens.some((i) => 
        i.produto?.ambiente?.id === ambienteSelecionado && 
        i.status === PedidoStatus.FEITO
      )
    ),
    emPreparo: pedidosFiltrados.filter((p) =>
      p.itens.some((i) => 
        i.produto?.ambiente?.id === ambienteSelecionado && 
        i.status === PedidoStatus.EM_PREPARO
      )
    ),
    quasePronto: pedidosFiltrados.filter((p) =>
      p.itens.some((i) => 
        i.produto?.ambiente?.id === ambienteSelecionado && 
        i.status === PedidoStatus.QUASE_PRONTO
      )
    ),
    pronto: pedidosFiltrados.filter((p) =>
      p.itens.some((i) => 
        i.produto?.ambiente?.id === ambienteSelecionado && 
        i.status === PedidoStatus.PRONTO
      )
    ),
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Botão Voltar para COZINHA */}
          {user?.cargo === 'COZINHA' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/cozinha')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel de Preparo</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe e atualize pedidos em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão para ativar som */}
          {audioConsentNeeded ? (
            <Button onClick={handleAllowAudio} variant="secondary" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Ativar Som
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 text-green-600" />
              <span className="hidden md:inline">Notificações ativas</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Seletor de Ambiente Dinâmico */}
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={ambienteSelecionado || undefined} onValueChange={setAmbienteSelecionado}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione o ambiente" />
          </SelectTrigger>
          <SelectContent>
            {ambientes.map((ambiente) => (
              <SelectItem key={ambiente.id} value={ambiente.id}>
                {ambiente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ambientes.length === 0 && (
          <Alert className="flex-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum ambiente de preparo cadastrado. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Kanban Board */}
      {!ambienteSelecionado ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Selecione um ambiente para visualizar os pedidos.</AlertDescription>
        </Alert>
      ) : isRefreshing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-100 rounded-lg"></div>
              <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum pedido aguardando preparo neste ambiente.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Coluna: Aguardando */}
          <div className="space-y-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-700 flex items-center justify-between">
                Aguardando
                <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">
                  {colunas.feito.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {colunas.feito.map((pedido) => (
                <div
                  key={pedido.id}
                  className={`transition-all duration-500 ${
                    novoPedidoId === pedido.id
                      ? 'ring-4 ring-green-500 ring-opacity-50 animate-pulse'
                      : ''
                  }`}
                >
                  <PedidoCard pedido={pedido} onItemStatusChange={handleItemStatusChange} />
                </div>
              ))}
            </div>
          </div>

          {/* Coluna: Em Preparo */}
          <div className="space-y-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <h3 className="font-semibold text-orange-700 flex items-center justify-between">
                Em Preparo
                <span className="text-sm bg-orange-200 px-2 py-1 rounded-full">
                  {colunas.emPreparo.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {colunas.emPreparo.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onItemStatusChange={handleItemStatusChange}
                />
              ))}
            </div>
          </div>

          {/* Coluna: Quase Pronto */}
          <div className="space-y-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <h3 className="font-semibold text-yellow-700 flex items-center justify-between">
                Quase Pronto
                <span className="text-sm bg-yellow-200 px-2 py-1 rounded-full">
                  {colunas.quasePronto.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {colunas.quasePronto.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onItemStatusChange={handleItemStatusChange}
                />
              ))}
            </div>
          </div>

          {/* Coluna: Prontos */}
          <div className="space-y-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <h3 className="font-semibold text-green-700 flex items-center justify-between">
                Prontos
                <span className="text-sm bg-green-200 px-2 py-1 rounded-full">
                  {colunas.pronto.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {colunas.pronto.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onItemStatusChange={handleItemStatusChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
