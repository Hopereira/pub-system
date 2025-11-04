// Caminho: frontend/src/components/cozinha/PedidoCard.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemPedido, Pedido, PedidoStatus } from '@/types/pedido'; // 1. ItemPedido importado
import { Check, Play } from 'lucide-react';
import { Badge } from '../ui/badge'; // 2. Badge importado para o status

interface PedidoCardProps {
  pedido: Pedido;
  // 3. Assinatura da função alterada para receber o ID do ITEM
  onItemStatusChange: (itemPedidoId: string, newStatus: PedidoStatus) => void;
}

export default function PedidoCard({ pedido, onItemStatusChange }: PedidoCardProps) {
    const tempoDesdePedido = () => {
        const agora = new Date();
        const dataPedido = new Date(pedido.data);
        const diffMs = agora.getTime() - dataPedido.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 1) return 'Agora mesmo';
        return `${diffMins} min atrás`;
    }

    const calcularTempoPreparo = (item: ItemPedido) => {
        if (item.status === 'FEITO') return null;
        
        const agora = new Date();
        const iniciado = item.iniciadoEm ? new Date(item.iniciadoEm) : null;
        const pronto = item.prontoEm ? new Date(item.prontoEm) : null;
        
        if (pronto && iniciado) {
            const tempo = Math.round((pronto.getTime() - iniciado.getTime()) / 60000);
            return `✅ ${tempo} min`;
        } else if (iniciado && item.status === 'EM_PREPARO') {
            const tempo = Math.round((agora.getTime() - iniciado.getTime()) / 60000);
            return `⏱️ ${tempo} min`;
        }
        return null;
    };

  return (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Mesa {pedido.comanda.mesa?.numero ?? 'Balcão'}</span>
                <span className="text-sm font-normal text-muted-foreground">{tempoDesdePedido()}</span>
            </CardTitle>
            <CardDescription>Pedido #{pedido.id.substring(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            {/* --- GRANDE ALTERAÇÃO AQUI --- */}
            {/* Agora iteramos sobre os itens para mostrar status e botões individuais */}
            <ul className='space-y-4'>
                {pedido.itens.map(item => (
                    <li key={item.id} className='border-b pb-3'>
                        <div>
                            <span className='font-bold'>{item.quantidade}x</span> {item.produto.nome}
                            {item.observacao && <p className='text-xs text-slate-500 italic ml-4'>- {item.observacao}</p>}
                        </div>
                        <div className='flex justify-between items-center mt-2'>
                            <div className='flex items-center gap-2'>
                                <Badge variant={item.status === 'EM_PREPARO' ? 'destructive' : 'secondary'}>
                                   {item.status.replace('_', ' ')}
                                </Badge>
                                {calcularTempoPreparo(item) && (
                                    <span className='text-xs font-medium text-muted-foreground'>
                                        {calcularTempoPreparo(item)}
                                    </span>
                                )}
                            </div>
                            <div>
                                {item.status === PedidoStatus.FEITO && (
                                    <Button size="sm" onClick={() => onItemStatusChange(item.id, PedidoStatus.EM_PREPARO)}>
                                        <Play className='h-4 w-4 mr-2' />
                                        Iniciar
                                    </Button>
                                )}
                                {item.status === PedidoStatus.EM_PREPARO && (
                                    <Button size="sm" className='bg-green-600 hover:bg-green-700' onClick={() => onItemStatusChange(item.id, PedidoStatus.PRONTO)}>
                                        <Check className='h-4 w-4 mr-2' />
                                        Pronto
                                    </Button>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
        {/* O CardFooter foi removido pois não há mais um status geral */}
    </Card>
  );
}