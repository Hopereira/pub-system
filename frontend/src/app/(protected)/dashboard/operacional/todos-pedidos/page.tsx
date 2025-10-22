'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Package, Filter, Clock, Flame, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import { getPedidosPorAmbiente } from '@/services/pedidoService';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { Pedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const TodosPedidosPage = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<PedidoStatus | 'todos'>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPedidos();
  }, [ambienteSelecionado]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const ambientesData = await getAmbientes();
      const ambientesPreparo = ambientesData?.filter((amb) => amb.tipo === 'PREPARO') || [];
      setAmbientes(ambientesPreparo);
      await loadPedidos();
    } catch (error) {
      logger.error('❌ Erro ao carregar dados', {
        module: 'TodosPedidosPage',
        error: error as Error,
      });
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      setIsRefreshing(true);
      const ambienteId = ambienteSelecionado === 'todos' ? undefined : ambienteSelecionado;
      const data = await getPedidosPorAmbiente(ambienteId || '');
      setPedidos(Array.isArray(data) ? data : []);
      logger.log(`✅ ${data?.length || 0} pedidos carregados`, {
        module: 'TodosPedidosPage',
      });
    } catch (error) {
      logger.error('❌ Erro ao atualizar pedidos', {
        module: 'TodosPedidosPage',
        error: error as Error,
      });
      setPedidos([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadgeVariant = (status: PedidoStatus) => {
    switch (status) {
      case PedidoStatus.FEITO:
        return 'secondary';
      case PedidoStatus.EM_PREPARO:
        return 'default';
      case PedidoStatus.PRONTO:
        return 'outline';
      case PedidoStatus.DEIXADO_NO_AMBIENTE:
        return 'destructive';
      case PedidoStatus.ENTREGUE:
        return 'secondary';
      case PedidoStatus.CANCELADO:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: PedidoStatus) => {
    switch (status) {
      case PedidoStatus.FEITO:
        return <Clock className="w-4 h-4" />;
      case PedidoStatus.EM_PREPARO:
        return <Flame className="w-4 h-4" />;
      case PedidoStatus.PRONTO:
        return <CheckCircle className="w-4 h-4" />;
      case PedidoStatus.DEIXADO_NO_AMBIENTE:
        return <AlertCircle className="w-4 h-4" />;
      case PedidoStatus.ENTREGUE:
        return <CheckCircle className="w-4 h-4" />;
      case PedidoStatus.CANCELADO:
        return <Ban className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (statusFiltro === 'todos') return true;
    return pedido.itens.some((item) => item.status === statusFiltro);
  });

  const getContadorPorStatus = (status: PedidoStatus) => {
    return pedidos.filter((p) => p.itens.some((item) => item.status === status)).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Todos os Pedidos
          </h1>
          <p className="text-muted-foreground mt-1">
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}{' '}
            {statusFiltro !== 'todos' && `com status ${statusFiltro.replace('_', ' ')}`}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filtro por Ambiente */}
          <Select value={ambienteSelecionado} onValueChange={setAmbienteSelecionado}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por ambiente" />
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

          {/* Botão Atualizar */}
          <Button
            variant="outline"
            size="icon"
            onClick={loadPedidos}
            disabled={isRefreshing}
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs por Status */}
      <Tabs value={statusFiltro} onValueChange={(value) => setStatusFiltro(value as PedidoStatus | 'todos')}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="todos">
            Todos ({pedidos.length})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.FEITO}>
            <Clock className="w-4 h-4 mr-2" />
            A Fazer ({getContadorPorStatus(PedidoStatus.FEITO)})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.EM_PREPARO}>
            <Flame className="w-4 h-4 mr-2" />
            Em Preparo ({getContadorPorStatus(PedidoStatus.EM_PREPARO)})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.PRONTO}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Pronto ({getContadorPorStatus(PedidoStatus.PRONTO)})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.DEIXADO_NO_AMBIENTE}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Aguardando ({getContadorPorStatus(PedidoStatus.DEIXADO_NO_AMBIENTE)})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.ENTREGUE}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Entregue ({getContadorPorStatus(PedidoStatus.ENTREGUE)})
          </TabsTrigger>
          <TabsTrigger value={PedidoStatus.CANCELADO}>
            <Ban className="w-4 h-4 mr-2" />
            Cancelado ({getContadorPorStatus(PedidoStatus.CANCELADO)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFiltro} className="mt-6">
          {pedidosFiltrados.length === 0 ? (
            <Alert>
              <Package className="w-4 h-4" />
              <AlertDescription>
                Nenhum pedido encontrado com os filtros selecionados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pedidosFiltrados.map((pedido) => (
                <Link key={pedido.id} href={`/dashboard/comandas/${pedido.comanda?.id}`}>
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {pedido.comanda?.mesa ? `Mesa ${pedido.comanda.mesa.numero}` : 'Balcão'}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {new Date(pedido.data).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {pedido.comanda?.cliente?.nome || 'Cliente não identificado'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {pedido.itens
                        .filter((item) => statusFiltro === 'todos' || item.status === statusFiltro)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {item.quantidade}x {item.produto?.nome || 'Produto'}
                              </p>
                              {item.observacao && (
                                <p className="text-xs text-muted-foreground">Obs: {item.observacao}</p>
                              )}
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(item.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(item.status)}
                              <span className="text-xs">{item.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TodosPedidosPage;
