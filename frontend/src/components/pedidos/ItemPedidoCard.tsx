'use client';

import { ItemPedido, PedidoStatus } from '@/types/pedido';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, Package, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ItemPedidoCardProps {
  item: ItemPedido;
  onRetirar?: (itemId: string) => void;
  onEntregar?: (itemId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Card de item de pedido com ações contextuais baseadas no status
 * Exibe badges de tempo e botões de ação (Retirar/Entregar)
 */
export function ItemPedidoCard({
  item,
  onRetirar,
  onEntregar,
  isLoading = false,
  showActions = true,
  compact = false,
}: ItemPedidoCardProps) {
  // Calcula tempo de espera desde que ficou pronto
  const calcularTempoEspera = () => {
    if (!item.prontoEm) return null;
    const prontoDate = new Date(item.prontoEm);
    const agoraMs = Date.now();
    const diferencaMin = Math.floor((agoraMs - prontoDate.getTime()) / 60000);
    return diferencaMin;
  };

  const tempoEsperaMin = calcularTempoEspera();

  // Cores baseadas em SLA
  const getCorSLA = () => {
    if (!tempoEsperaMin) return '';
    if (tempoEsperaMin < 2) return 'text-green-600';
    if (tempoEsperaMin < 5) return 'text-yellow-600';
    return 'text-red-600 animate-pulse';
  };

  // Badge de status
  const renderStatusBadge = () => {
    const badges = {
      [PedidoStatus.EM_PREPARO]: (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Em Preparo
        </Badge>
      ),
      [PedidoStatus.QUASE_PRONTO]: (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          Quase Pronto
        </Badge>
      ),
      [PedidoStatus.PRONTO]: (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pronto
        </Badge>
      ),
      [PedidoStatus.RETIRADO]: (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Package className="w-3 h-3 mr-1" />
          Retirado
        </Badge>
      ),
      [PedidoStatus.ENTREGUE]: (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          <Truck className="w-3 h-3 mr-1" />
          Entregue
        </Badge>
      ),
    };

    return badges[item.status as PedidoStatus] || (
      <Badge variant="outline">{item.status}</Badge>
    );
  };

  // Ações disponíveis por status
  const renderActions = () => {
    if (!showActions) return null;

    if (item.status === PedidoStatus.PRONTO && onRetirar) {
      return (
        <Button
          size={compact ? 'sm' : 'default'}
          onClick={() => onRetirar(item.id)}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Package className="w-4 h-4 mr-2" />
          Retirar
        </Button>
      );
    }

    if (item.status === PedidoStatus.RETIRADO && onEntregar) {
      return (
        <Button
          size={compact ? 'sm' : 'default'}
          onClick={() => onEntregar(item.id)}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Truck className="w-4 h-4 mr-2" />
          Entregar
        </Button>
      );
    }

    return null;
  };

  // Countdown ETA para QUASE_PRONTO
  const renderCountdown = () => {
    if (item.status !== PedidoStatus.QUASE_PRONTO || !item.quaseProntoEm) return null;

    return (
      <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Ficará pronto em breve (~30-60s)
      </div>
    );
  };

  // Badge de tempo de espera
  const renderTempoEspera = () => {
    if (!tempoEsperaMin || item.status !== PedidoStatus.PRONTO) return null;

    return (
      <div className={cn('text-xs font-semibold flex items-center gap-1', getCorSLA())}>
        <Clock className="w-3 h-3" />
        Aguardando {tempoEsperaMin} min
      </div>
    );
  };

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      item.status === PedidoStatus.PRONTO && tempoEsperaMin && tempoEsperaMin > 5 && 'border-red-300 bg-red-50/30',
      compact && 'p-2'
    )}>
      <CardContent className={cn('space-y-3', compact ? 'p-3' : 'p-4')}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold truncate', compact ? 'text-sm' : 'text-base')}>
              {item.produto?.nome || 'Produto'}
            </h4>
            <p className="text-xs text-muted-foreground">
              Qtd: {item.quantidade} × R$ {Number(item.precoUnitario).toFixed(2)}
            </p>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Observações */}
        {item.observacao && (
          <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">
            {item.observacao}
          </p>
        )}

        {/* Indicadores de tempo */}
        <div className="flex flex-wrap gap-2 text-xs">
          {renderCountdown()}
          {renderTempoEspera()}
          
          {item.ambienteRetirada && (
            <Badge variant="secondary" className="text-xs">
              {item.ambienteRetirada.nome}
            </Badge>
          )}

          {item.retiradoPorGarcom && (
            <div className="text-xs text-gray-600">
              Retirado por: {item.retiradoPorGarcom.nome}
            </div>
          )}

          {item.garcomEntrega && (
            <div className="text-xs text-gray-600">
              Entregue por: {item.garcomEntrega.nome}
            </div>
          )}
        </div>

        {/* Métricas de tempo (quando entregue) */}
        {item.status === PedidoStatus.ENTREGUE && (
          <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2 border-t">
            {item.tempoPreparoMinutos !== null && item.tempoPreparoMinutos !== undefined && (
              <div>
                <div className="text-muted-foreground">Preparo</div>
                <div className="font-semibold">{item.tempoPreparoMinutos}min</div>
              </div>
            )}
            {item.tempoReacaoMinutos !== null && item.tempoReacaoMinutos !== undefined && (
              <div>
                <div className="text-muted-foreground">Reação</div>
                <div className="font-semibold">{item.tempoReacaoMinutos}min</div>
              </div>
            )}
            {item.tempoEntregaFinalMinutos !== null && item.tempoEntregaFinalMinutos !== undefined && (
              <div>
                <div className="text-muted-foreground">Entrega</div>
                <div className="font-semibold">{item.tempoEntregaFinalMinutos}min</div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {renderActions()}
      </CardContent>
    </Card>
  );
}
