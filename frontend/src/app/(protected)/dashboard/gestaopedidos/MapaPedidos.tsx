'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, Clock, Package, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { getMesas } from '@/services/mesaService';
import { getPedidos } from '@/services/pedidoService';
import { getPontosEntregaAtivos } from '@/services/pontoEntregaService';
import { PontoEntrega } from '@/types/ponto-entrega';
import { Mesa, MesaStatus } from '@/types/mesa';
import { Pedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import Link from 'next/link';

interface MesaComPedidos extends Mesa {
  pedidosProntos: number;
  pedidosEmPreparo: number;
  cliente?: string;
  totalPedidos: number;
}

interface PontoComPedidos extends PontoEntrega {
  pedidosProntos: number;
  pedidosEmPreparo: number;
  clientes: string[];
  totalPedidos: number;
}

/**
 * Mapa Visual de Mesas para Garçom
 * 
 * Mostra layout visual das mesas com:
 * - Status da mesa (cores)
 * - Pedidos prontos para entrega
 * - Nome do cliente
 * - Tempo de espera
 */
export default function MapaPedidos() {
  const [mesas, setMesas] = useState<MesaComPedidos[]>([]);
  const [pontos, setPontos] = useState<PontoComPedidos[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mesasData, pontosData, pedidosData] = await Promise.all([
        getMesas(),
        getPontosEntregaAtivos(),
        getPedidos(),
      ]);

      // Agrupa pedidos por mesa
      const mesasComPedidos: MesaComPedidos[] = mesasData.map((mesa) => {
        const pedidosDaMesa = pedidosData.filter(
          (p) => p.comanda?.mesa?.id === mesa.id
        );

        const prontos = pedidosDaMesa.filter(
          (p) => p.status === PedidoStatus.PRONTO
        ).length;

        const emPreparo = pedidosDaMesa.filter(
          (p) => p.status === PedidoStatus.EM_PREPARO
        ).length;

        const cliente = pedidosDaMesa[0]?.comanda?.cliente?.nome;

        return {
          ...mesa,
          pedidosProntos: prontos,
          pedidosEmPreparo: emPreparo,
          totalPedidos: pedidosDaMesa.length,
          cliente,
        };
      });

      // Agrupa pedidos por ponto de entrega (comandas avulsas)
      const pontosComPedidos: PontoComPedidos[] = pontosData.map((ponto) => {
        const pedidosDoPonto = pedidosData.filter(
          (p) => (p.comanda as any)?.pontoEntrega?.id === ponto.id && !(p.comanda as any)?.mesa
        );

        const prontos = pedidosDoPonto.filter(
          (p) => p.status === PedidoStatus.PRONTO
        ).length;

        const emPreparo = pedidosDoPonto.filter(
          (p) => p.status === PedidoStatus.EM_PREPARO
        ).length;

        const clientes = pedidosDoPonto
          .map((p) => p.comanda?.cliente?.nome)
          .filter((nome): nome is string => !!nome);

        return {
          ...ponto,
          pedidosProntos: prontos,
          pedidosEmPreparo: emPreparo,
          totalPedidos: pedidosDoPonto.length,
          clientes: Array.from(new Set(clientes)), // Remove duplicados
        };
      });

      setMesas(mesasComPedidos);
      setPontos(pontosComPedidos);
      setPedidos(pedidosData);

      logger.log('✅ Mapa de pedidos atualizado', {
        module: 'MapaPedidos',
        data: { 
          mesas: mesasComPedidos.length, 
          pontos: pontosComPedidos.length,
          pedidos: pedidosData.length 
        },
      });
    } catch (error) {
      logger.error('❌ Erro ao carregar mapa', {
        module: 'MapaPedidos',
        error: error as Error,
      });
      toast.error('Erro ao carregar mapa de pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupa mesas por ambiente
  const mesasPorAmbiente = mesas.reduce((acc, mesa) => {
    const ambienteNome = mesa.ambiente?.nome || 'Sem Ambiente';
    if (!acc[ambienteNome]) {
      acc[ambienteNome] = [];
    }
    acc[ambienteNome].push(mesa);
    return acc;
  }, {} as Record<string, MesaComPedidos[]>);

  const getStatusColor = (mesa: MesaComPedidos) => {
    if (mesa.pedidosProntos > 0) return 'border-green-500 bg-green-50';
    if (mesa.pedidosEmPreparo > 0) return 'border-orange-500 bg-orange-50';
    if (mesa.status === MesaStatus.OCUPADA) return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusBadge = (mesa: MesaComPedidos) => {
    if (mesa.pedidosProntos > 0) {
      return (
        <Badge className="bg-green-600 text-white">
          {mesa.pedidosProntos} Pronto{mesa.pedidosProntos > 1 ? 's' : ''}
        </Badge>
      );
    }
    if (mesa.pedidosEmPreparo > 0) {
      return (
        <Badge className="bg-orange-600 text-white">
          {mesa.pedidosEmPreparo} Em Preparo
        </Badge>
      );
    }
    if (mesa.status === MesaStatus.LIVRE) {
      return <Badge variant="outline">Livre</Badge>;
    }
    return <Badge variant="secondary">Ocupada</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando mapa...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Mapa de Entregas
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualização em tempo real das mesas e pedidos
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm">Pedidos Prontos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-sm">Em Preparo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm">Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <span className="text-sm">Livre</span>
          </div>
        </CardContent>
      </Card>

      {/* Mesas Agrupadas por Ambiente */}
      {Object.entries(mesasPorAmbiente).map(([ambienteNome, mesasDoAmbiente]) => (
        <div key={ambienteNome} className="space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            <h2 className="text-xl font-bold">{ambienteNome}</h2>
            <Badge variant="secondary">{mesasDoAmbiente.length} mesas</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mesasDoAmbiente.map((mesa) => (
              <Link
                key={mesa.id}
                href={`/dashboard/operacional/caixa?mesa=${mesa.id}`}
                className="block"
              >
                <Card
                  className={`
                    relative overflow-hidden transition-all hover:scale-105 hover:shadow-lg
                    border-2 ${getStatusColor(mesa)}
                    ${mesa.pedidosProntos > 0 ? 'animate-pulse' : ''}
                  `}
                >
                  <CardContent className="p-4 space-y-2">
                    {/* Número da Mesa */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {mesa.numero}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
                      {getStatusBadge(mesa)}
                    </div>

                    {/* Cliente */}
                    {mesa.cliente && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{mesa.cliente}</span>
                      </div>
                    )}

                    {/* Total de Pedidos */}
                    {mesa.totalPedidos > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                        <Package className="w-3 h-3" />
                        <span>{mesa.totalPedidos} pedido{mesa.totalPedidos > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Indicador de Prioridade */}
                    {mesa.pedidosProntos > 0 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Pontos de Entrega (Comandas Avulsas) */}
      {pontos.length > 0 && pontos.some((p) => p.totalPedidos > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <h2 className="text-xl font-bold">Comandas Avulsas - Pontos de Entrega</h2>
            <Badge variant="secondary">{pontos.filter(p => p.totalPedidos > 0).length} ativos</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pontos
              .filter((ponto) => ponto.totalPedidos > 0)
              .map((ponto) => {
                const statusColor =
                  ponto.pedidosProntos > 0
                    ? 'border-green-500 bg-green-50'
                    : ponto.pedidosEmPreparo > 0
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 bg-gray-50';

                return (
                  <Card
                    key={ponto.id}
                    className={`
                      relative overflow-hidden transition-all hover:scale-105 hover:shadow-lg
                      border-2 ${statusColor}
                      ${ponto.pedidosProntos > 0 ? 'animate-pulse' : ''}
                    `}
                  >
                    <CardContent className="p-4 space-y-2">
                      {/* Nome do Ponto */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div className="text-sm font-bold text-primary">
                            {ponto.nome}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-center">
                        {ponto.pedidosProntos > 0 ? (
                          <Badge className="bg-green-600 text-white">
                            {ponto.pedidosProntos} Pronto{ponto.pedidosProntos > 1 ? 's' : ''}
                          </Badge>
                        ) : ponto.pedidosEmPreparo > 0 ? (
                          <Badge className="bg-orange-600 text-white">
                            {ponto.pedidosEmPreparo} Em Preparo
                          </Badge>
                        ) : null}
                      </div>

                      {/* Clientes */}
                      {ponto.clientes.length > 0 && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{ponto.clientes.length} cliente{ponto.clientes.length > 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {ponto.clientes.slice(0, 2).join(', ')}
                            {ponto.clientes.length > 2 && '...'}
                          </div>
                        </div>
                      )}

                      {/* Total de Pedidos */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                        <Package className="w-3 h-3" />
                        <span>{ponto.totalPedidos} pedido{ponto.totalPedidos > 1 ? 's' : ''}</span>
                      </div>

                      {/* Indicador de Prioridade */}
                      {ponto.pedidosProntos > 0 && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {mesas.length === 0 && pontos.length === 0 && (
        <Alert>
          <AlertDescription>
            Nenhuma mesa ou ponto de entrega cadastrado. Configure no painel administrativo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
