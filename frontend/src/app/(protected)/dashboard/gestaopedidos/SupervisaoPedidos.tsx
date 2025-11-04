'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Package, Filter, Clock, Flame, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import { getPedidos } from '@/services/pedidoService';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { Pedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePedidosSubscription } from '@/hooks/usePedidosSubscription';

/**
 * Componente de Supervisão de Pedidos para ADMIN/GERENTE
 * 
 * Características:
 * - Visão completa de todos os pedidos
 * - Filtros por ambiente dinâmico
 * - Tabs por status
 * - Métricas em tempo real
 */
export default function SupervisaoPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<PedidoStatus | 'todos' | 'ENTREGUES'>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook de WebSocket para atualizações em tempo real
  const { novoPedido, pedidoAtualizado, isConnected } = usePedidosSubscription();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recarrega quando recebe novo pedido
  useEffect(() => {
    if (novoPedido) {
      console.log('🆕 Novo pedido recebido, recarregando...');
      loadPedidos();
    }
  }, [novoPedido]);

  // Recarrega quando pedido é atualizado
  useEffect(() => {
    if (pedidoAtualizado) {
      console.log('🔄 Pedido atualizado, recarregando...');
      loadPedidos();
    }
  }, [pedidoAtualizado]);

  // Polling de fallback se WebSocket desconectar
  useEffect(() => {
    if (!isConnected && !isLoading) {
      const intervalId = setInterval(() => {
        console.log('🔄 Polling de fallback...');
        loadPedidos();
      }, 30000); // 30 segundos
      
      return () => clearInterval(intervalId);
    }
  }, [isConnected, isLoading]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Carrega ambientes
      const ambientesData = await getAmbientes();
      const ambientesPreparo = ambientesData?.filter((amb) => amb.tipo === 'PREPARO') || [];
      setAmbientes(ambientesPreparo);
      
      // Carrega pedidos iniciais
      const pedidosData = await getPedidos();
      setPedidos(pedidosData);
      
      logger.log('✅ Dados iniciais carregados', { 
        module: 'SupervisaoPedidos',
        data: { 
          ambientes: ambientesPreparo.length,
          pedidos: pedidosData.length 
        }
      });
    } catch (error) {
      logger.error('Erro ao carregar dados iniciais', { 
        module: 'SupervisaoPedidos',
        error: error as Error 
      });
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
      
      logger.debug('Pedidos carregados', { 
        module: 'SupervisaoPedidos',
        data: { total: data.length }
      });
    } catch (error) {
      logger.error('Erro ao carregar pedidos', { 
        module: 'SupervisaoPedidos',
        error: error as Error 
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

  // Filtra pedidos por ambiente e status
  const pedidosFiltrados = pedidos
    .filter((pedido) => {
      // Filtro por ambiente
      if (ambienteSelecionado !== 'todos') {
        const temItemDoAmbiente = pedido.itens.some(
          (item) => item.produto?.ambiente?.id === ambienteSelecionado
        );
        if (!temItemDoAmbiente) return false;
      }

      // Filtro por status
      if (statusFiltro !== 'todos') {
        if (statusFiltro === 'ENTREGUES') {
          // Filtra por todos os tipos de entrega
          const temItemEntregue = pedido.itens.some((item) => 
            item.status === PedidoStatus.ENTREGUE || item.status === PedidoStatus.DEIXADO_NO_AMBIENTE
          );
          if (!temItemEntregue) return false;
        } else {
          // Filtra por status específico
          const temItemComStatus = pedido.itens.some((item) => item.status === statusFiltro);
          if (!temItemComStatus) return false;
        }
      }

      return true;
    })
    // Ordena do mais recente para o mais antigo
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Métricas
  const metricas = {
    total: pedidosFiltrados.length,
    feito: pedidosFiltrados.filter((p) => p.itens.some((i) => i.status === PedidoStatus.FEITO)).length,
    emPreparo: pedidosFiltrados.filter((p) => p.itens.some((i) => i.status === PedidoStatus.EM_PREPARO)).length,
    pronto: pedidosFiltrados.filter((p) => p.itens.some((i) => i.status === PedidoStatus.PRONTO)).length,
    entregue: pedidosFiltrados.filter((p) => p.itens.some((i) => 
      i.status === PedidoStatus.ENTREGUE || i.status === PedidoStatus.DEIXADO_NO_AMBIENTE
    )).length,
  };

  const getStatusIcon = (status: PedidoStatus) => {
    switch (status) {
      case PedidoStatus.FEITO:
        return <Clock className="h-4 w-4" />;
      case PedidoStatus.EM_PREPARO:
        return <Flame className="h-4 w-4" />;
      case PedidoStatus.PRONTO:
        return <CheckCircle className="h-4 w-4" />;
      case PedidoStatus.ENTREGUE:
        return <Package className="h-4 w-4" />;
      case PedidoStatus.DEIXADO_NO_AMBIENTE:
        return <Package className="h-4 w-4" />;
      case PedidoStatus.CANCELADO:
        return <Ban className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: PedidoStatus) => {
    switch (status) {
      case PedidoStatus.FEITO:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case PedidoStatus.EM_PREPARO:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case PedidoStatus.PRONTO:
        return 'bg-green-100 text-green-800 border-green-300';
      case PedidoStatus.ENTREGUE:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case PedidoStatus.DEIXADO_NO_AMBIENTE:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case PedidoStatus.CANCELADO:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervisão de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Visão gerencial completa de todos os pedidos
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Ambiente de Preparo</label>
            <Select value={ambienteSelecionado} onValueChange={setAmbienteSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Ambientes</SelectItem>
                {ambientes.map((ambiente) => (
                  <SelectItem key={ambiente.id} value={ambiente.id}>
                    {ambiente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={statusFiltro}
              onValueChange={(value) => setStatusFiltro(value as PedidoStatus | 'todos' | 'ENTREGUES')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value={PedidoStatus.FEITO}>Aguardando</SelectItem>
                <SelectItem value={PedidoStatus.EM_PREPARO}>Em Preparo</SelectItem>
                <SelectItem value={PedidoStatus.PRONTO}>Pronto</SelectItem>
                <SelectItem value="ENTREGUES">Entregues (Todos)</SelectItem>
                <SelectItem value={PedidoStatus.ENTREGUE}>Entregue (Garçom)</SelectItem>
                <SelectItem value={PedidoStatus.DEIXADO_NO_AMBIENTE}>Retirado (Cliente)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas - Clicáveis como Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFiltro === 'todos' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setStatusFiltro('todos')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total}</div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFiltro === PedidoStatus.FEITO ? 'ring-2 ring-gray-500' : ''
          }`}
          onClick={() => setStatusFiltro(PedidoStatus.FEITO)}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Aguardando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{metricas.feito}</div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFiltro === PedidoStatus.EM_PREPARO ? 'ring-2 ring-orange-500' : ''
          }`}
          onClick={() => setStatusFiltro(PedidoStatus.EM_PREPARO)}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Flame className="h-3 w-3" /> Em Preparo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas.emPreparo}</div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFiltro === PedidoStatus.PRONTO ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setStatusFiltro(PedidoStatus.PRONTO)}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Prontos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricas.pronto}</div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFiltro === 'ENTREGUES' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStatusFiltro('ENTREGUES')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Package className="h-3 w-3" /> Entregues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metricas.entregue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum pedido encontrado com os filtros selecionados.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pedidosFiltrados.map((pedido) => (
            <Card key={pedido.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      Pedido #{pedido.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {pedido.comanda?.mesa
                        ? `Mesa ${pedido.comanda.mesa.numero}`
                        : 'Balcão'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pedido.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.produto?.nome || 'Produto removido'}</p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantidade} | {item.produto?.ambiente?.nome || 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex items-center gap-1 ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}

                {pedido.itens[0]?.produto?.ambiente?.id && (
                  <Button asChild variant="outline" size="sm" className="w-full mt-4">
                    <Link href={`/dashboard/operacional/${pedido.itens[0].produto.ambiente.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
