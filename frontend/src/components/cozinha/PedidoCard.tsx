// Caminho: frontend/src/components/cozinha/PedidoCard.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pedido } from '@/types/pedido';
import { Utensils } from 'lucide-react';

interface PedidoCardProps {
  pedido: Pedido;
}

export default function PedidoCard({ pedido }: PedidoCardProps) {
    const tempoDesdePedido = () => {
        const agora = new Date();
        const dataPedido = new Date(pedido.data);
        const diffMs = agora.getTime() - dataPedido.getTime();
        const diffMins = Math.round(diffMs / 60000);
        return `${diffMins} min atrás`;
    }

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
            <ul className='space-y-2'>
                {pedido.itens.map(item => (
                    <li key={item.id} className='border-b pb-1'>
                        <span className='font-bold'>{item.quantidade}x</span> {item.produto.nome}
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className='flex justify-between items-center bg-slate-50 p-3'>
            <div className='flex items-center gap-2'>
                <Utensils className='h-5 w-5' />
                <span className='font-bold uppercase'>{pedido.status.replace('_', ' ')}</span>
            </div>
            {/* Os botões de ação entrarão aqui no próximo passo */}
        </CardFooter>
    </Card>
  );
}