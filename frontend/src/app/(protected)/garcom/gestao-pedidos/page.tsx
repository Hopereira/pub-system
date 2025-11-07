'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Package, 
  CheckCircle, 
  AlertCircle,
  User,
  UtensilsCrossed
} from 'lucide-react';
import * as pedidoService from '@/services/pedidoService';
import { Pedido } from '@/types/pedido';
import { toast } from 'sonner';

export default function GestaoPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('prontos');

  useEffect(() => {
    carregarPedidos();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarPedidos = async () => {
    try {
      const todosPedidos = await pedidoService.getPedidos();
      setPedidos(todosPedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const marcarComoEntregue = async (pedidoId: string) => {
    try {
      await pedidoService.atualizarStatusPedido(pedidoId, 'ENTREGUE');
      toast.success('Pedido marcado como entregue!');
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const calcularTempoDecorrido = (data: string): string => {
    const agora = new Date();
    const criacao = new Date(data);
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    }
    
    const horas = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${horas}h ${mins}min`;
  };

  const pedidosProntos = pedidos.filter(p => p.status === 'PRONTO');
  const pedidosEmPreparo = pedidos.filter(p => p.status === 'EM_PREPARO');
  const pedidosEntregues = pedidos.filter(p => p.status === 'ENTREGUE');

  const renderPedidoCard = (pedido: Pedido, mostrarBotaoEntregar: boolean = false) => {
    const itensProntos = pedido.itens?.filter(i => i.status === 'PRONTO') || [];
    const ambiente = pedido.itens?.[0]?.produto?.ambiente;
    
    return (
      <Card 
        key={pedido.id}
        className={`${
          pedido.status === 'PRONTO' 
            ? 'border-2 border-yellow-500 bg-yellow-50' 
            : pedido.status === 'EM_PREPARO'
            ? 'border-2 border-blue-500 bg-blue-50'
            : 'border-2 border-green-500 bg-green-50'
        }`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Mesa/Local */}
                <div className="flex items-center gap-2 mb-2">
                  {pedido.comanda?.mesa ? (
                    <>
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                      <span className="text-lg font-bold">
                        Mesa {pedido.comanda.mesa.numero}
                      </span>
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 text-primary" />
                      <span className="text-lg font-bold">
                        {pedido.comanda?.cliente?.nome || 'Balcão'}
                      </span>
                    </>
                  )}
                </div>

                {/* Cliente - Só mostra se tiver mesa, pois balcão já mostra o nome acima */}
                {pedido.comanda?.mesa && pedido.comanda?.cliente && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{pedido.comanda.cliente.nome}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <Badge
                variant={
                  pedido.status === 'PRONTO' 
                    ? 'default' 
                    : pedido.status === 'EM_PREPARO'
                    ? 'secondary'
                    : 'outline'
                }
                className={`text-sm ${
                  pedido.status === 'PRONTO'
                    ? 'bg-yellow-600 animate-pulse'
                    : pedido.status === 'EM_PREPARO'
                    ? 'bg-blue-600'
                    : 'bg-green-600'
                }`}
              >
                {pedido.status === 'PRONTO' && '🔔 PRONTO'}
                {pedido.status === 'EM_PREPARO' && '👨‍🍳 EM PREPARO'}
                {pedido.status === 'ENTREGUE' && '✅ ENTREGUE'}
              </Badge>
            </div>

            {/* Ambiente de Preparo */}
            {ambiente && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Pegar em: {ambiente.nome}</span>
              </div>
            )}

            {/* Itens */}
            <div className="space-y-1">
              <p className="text-sm font-semibold">Itens:</p>
              {pedido.itens?.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="font-medium">{item.quantidade}x</span>
                  <span>{item.produto?.nome || 'Produto'}</span>
                </div>
              ))}
              {pedido.itens && pedido.itens.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  + {pedido.itens.length - 3} itens
                </p>
              )}
            </div>

            {/* Tempo */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{calcularTempoDecorrido(pedido.data)}</span>
            </div>

            {/* Botão Entregar */}
            {mostrarBotaoEntregar && pedido.status === 'PRONTO' && (
              <Button
                onClick={() => marcarComoEntregue(pedido.id)}
                className="w-full mt-2"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Marcar como Entregue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Organize suas entregas e acompanhe o preparo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prontos" className="relative">
            Prontos
            {pedidosProntos.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pedidosProntos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparo">
            Em Preparo
            {pedidosEmPreparo.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pedidosEmPreparo.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="entregues">
            Entregues
          </TabsTrigger>
        </TabsList>

        {/* Pedidos Prontos */}
        <TabsContent value="prontos" className="space-y-4">
          {pedidosProntos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Nenhum pedido pronto
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Os pedidos prontos aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="font-semibold text-yellow-800">
                    {pedidosProntos.length} {pedidosProntos.length === 1 ? 'pedido pronto' : 'pedidos prontos'} para entrega
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {pedidosProntos.map(pedido => renderPedidoCard(pedido, true))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Pedidos em Preparo */}
        <TabsContent value="preparo" className="space-y-4">
          {pedidosEmPreparo.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Nenhum pedido em preparo
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidosEmPreparo.map(pedido => renderPedidoCard(pedido))}
            </div>
          )}
        </TabsContent>

        {/* Pedidos Entregues */}
        <TabsContent value="entregues" className="space-y-4">
          {pedidosEntregues.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Nenhum pedido entregue hoje
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidosEntregues.slice(0, 10).map(pedido => renderPedidoCard(pedido))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
