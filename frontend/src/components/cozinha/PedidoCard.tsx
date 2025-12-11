// Caminho: frontend/src/components/cozinha/PedidoCard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemPedido, Pedido, PedidoStatus } from '@/types/pedido';
import { Check, Play, Clock, ChefHat, CheckCircle2, UserCheck, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PedidoCardProps {
  pedido: Pedido;
  onItemStatusChange: (itemPedidoId: string, newStatus: PedidoStatus) => Promise<void> | void;
}

export default function PedidoCard({ pedido, onItemStatusChange }: PedidoCardProps) {
    // ✅ CORREÇÃO: Estado de loading individual por item
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    const handleStatusChange = async (itemId: string, newStatus: PedidoStatus) => {
        setLoadingItemId(itemId);
        try {
            await onItemStatusChange(itemId, newStatus);
        } finally {
            setLoadingItemId(null);
        }
    };

    const tempoDesdePedido = () => {
        const agora = new Date();
        const dataPedido = new Date(pedido.data);
        const diffMs = agora.getTime() - dataPedido.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 1) return 'Agora mesmo';
        return `${diffMins} min atrás`;
    }

    const formatarTempo = (minutos: number) => {
        if (minutos < 1) return '< 1 min';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}min`;
    };

    const calcularTempoDetalhado = (item: ItemPedido) => {
        const agora = new Date();
        const dataPedido = new Date(pedido.data);
        const iniciado = item.iniciadoEm ? new Date(item.iniciadoEm) : null;
        const pronto = item.prontoEm ? new Date(item.prontoEm) : null;
        const entregue = item.entregueEm ? new Date(item.entregueEm) : null;

        const tempoChegada = Math.round((agora.getTime() - dataPedido.getTime()) / 60000);
        const tempoPreparo = iniciado && pronto ? Math.round((pronto.getTime() - iniciado.getTime()) / 60000) : null;
        const tempoEntrega = iniciado && entregue ? Math.round((entregue.getTime() - iniciado.getTime()) / 60000) : null;
        const tempoEmPreparo = iniciado && !pronto ? Math.round((agora.getTime() - iniciado.getTime()) / 60000) : null;

        return {
            tempoChegada,
            tempoPreparo,
            tempoEntrega,
            tempoEmPreparo,
            iniciado,
            pronto,
            entregue
        };
    };

    const getCorTempo = (minutos: number) => {
        if (minutos < 10) return 'text-green-600';
        if (minutos < 20) return 'text-yellow-600';
        return 'text-red-600';
    };

  return (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Mesa {pedido.comanda?.mesa?.numero ?? 'Balcão'}</span>
                <span className="text-sm font-normal text-muted-foreground">{tempoDesdePedido()}</span>
            </CardTitle>
            <CardDescription>Pedido #{pedido.id.substring(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <ul className='space-y-4'>
                {pedido.itens.map(item => {
                    const tempos = calcularTempoDetalhado(item);
                    return (
                        <li key={item.id} className='border-b pb-3 last:border-b-0'>
                            {/* Nome e quantidade do item */}
                            <div className='mb-2'>
                                <span className='font-bold'>{item.quantidade}x</span> {item.produto.nome}
                                {item.observacao && <p className='text-xs text-slate-500 italic ml-4'>- {item.observacao}</p>}
                            </div>

                            {/* Status e Badges */}
                            <div className='flex items-center gap-2 mb-2 flex-wrap'>
                                <Badge variant={
                                    item.status === 'EM_PREPARO' ? 'destructive' : 
                                    item.status === 'QUASE_PRONTO' ? 'default' :
                                    item.status === 'PRONTO' ? 'default' : 
                                    'secondary'
                                }>
                                   {item.status.replace('_', ' ')}
                                </Badge>
                            </div>

                            {/* Informações de Tempo Detalhadas */}
                            <div className='space-y-1 mb-3 text-xs'>
                                {/* Tempo desde chegada */}
                                <div className={`flex items-center gap-1 ${getCorTempo(tempos.tempoChegada)}`}>
                                    <Clock className='h-3 w-3' />
                                    <span className='font-medium'>Chegou há:</span>
                                    <span>{formatarTempo(tempos.tempoChegada)}</span>
                                </div>

                                {/* Tempo em preparo (se estiver preparando) */}
                                {tempos.tempoEmPreparo !== null && (
                                    <div className={`flex items-center gap-1 ${getCorTempo(tempos.tempoEmPreparo)}`}>
                                        <ChefHat className='h-3 w-3' />
                                        <span className='font-medium'>Em preparo:</span>
                                        <span>{formatarTempo(tempos.tempoEmPreparo)}</span>
                                    </div>
                                )}

                                {/* Tempo de preparo (se ficou pronto) */}
                                {tempos.tempoPreparo !== null && (
                                    <div className='flex items-center gap-1 text-green-600'>
                                        <CheckCircle2 className='h-3 w-3' />
                                        <span className='font-medium'>Preparado em:</span>
                                        <span>{formatarTempo(tempos.tempoPreparo)}</span>
                                    </div>
                                )}

                                {/* Tempo de entrega e quem entregou */}
                                {tempos.entregue && tempos.tempoEntrega !== null && (
                                    <div className='flex items-center gap-1 text-blue-600'>
                                        <UserCheck className='h-3 w-3' />
                                        <span className='font-medium'>Entregue em:</span>
                                        <span>{formatarTempo(tempos.tempoEntrega)}</span>
                                        {item.status === PedidoStatus.ENTREGUE && (
                                            <span className='ml-1 text-muted-foreground'>(Garçom)</span>
                                        )}
                                        {item.status === PedidoStatus.DEIXADO_NO_AMBIENTE && (
                                            <span className='ml-1 text-muted-foreground'>(Cliente retirou)</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ✅ CORREÇÃO: Botões de Ação com loading individual */}
                            <div className='flex gap-2'>
                                {item.status === PedidoStatus.FEITO && (
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleStatusChange(item.id, PedidoStatus.EM_PREPARO)}
                                        disabled={loadingItemId === item.id}
                                    >
                                        {loadingItemId === item.id ? (
                                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        ) : (
                                            <Play className='h-4 w-4 mr-2' />
                                        )}
                                        {loadingItemId === item.id ? 'Aguarde...' : 'Iniciar'}
                                    </Button>
                                )}
                                {item.status === PedidoStatus.EM_PREPARO && (
                                    <Button 
                                        size="sm" 
                                        className='bg-green-600 hover:bg-green-700' 
                                        onClick={() => handleStatusChange(item.id, PedidoStatus.PRONTO)}
                                        disabled={loadingItemId === item.id}
                                    >
                                        {loadingItemId === item.id ? (
                                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        ) : (
                                            <Check className='h-4 w-4 mr-2' />
                                        )}
                                        {loadingItemId === item.id ? 'Aguarde...' : 'Pronto'}
                                    </Button>
                                )}
                                {item.status === PedidoStatus.QUASE_PRONTO && (
                                    <Button 
                                        size="sm" 
                                        className='bg-orange-600 hover:bg-orange-700' 
                                        onClick={() => handleStatusChange(item.id, PedidoStatus.PRONTO)}
                                        disabled={loadingItemId === item.id}
                                    >
                                        {loadingItemId === item.id ? (
                                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        ) : (
                                            <CheckCircle2 className='h-4 w-4 mr-2' />
                                        )}
                                        {loadingItemId === item.id ? 'Aguarde...' : 'Finalizar'}
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </CardContent>
        {/* O CardFooter foi removido pois não há mais um status geral */}
    </Card>
  );
}