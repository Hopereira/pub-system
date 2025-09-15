// Caminho: frontend/src/components/cozinha/PedidoCard.tsx
'use client';

import { Button } from '@/components/ui/button'; // ADIÇÃO
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pedido, PedidoStatus } from '@/types/pedido';
import { Check, Play, Utensils } from 'lucide-react'; // ADIÇÃO

interface PedidoCardProps {
  pedido: Pedido;
  // ADIÇÃO: Recebemos a função que altera o status como prop
  onStatusChange: (pedidoId: string, newStatus: PedidoStatus) => void;
}

export default function PedidoCard({ pedido, onStatusChange }: PedidoCardProps) {
    // ... (função tempoDesdePedido não foi alterada)
    const tempoDesdePedido = () => {
        const agora = new Date();
        const dataPedido = new Date(pedido.data);
        const diffMs = agora.getTime() - dataPedido.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 1) return 'Agora mesmo';
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
                    <li key={item.id} className='border-b pb-1 text-sm'>
                        <span className='font-bold'>{item.quantidade}x</span> {item.produto.nome}
                        {item.observacao && <p className='text-xs text-slate-500 italic ml-4'>- {item.observacao}</p>}
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className='flex justify-between items-center bg-slate-50 p-3'>
            <div className='flex items-center gap-2'>
                <Utensils className='h-5 w-5' />
                <span className='font-bold uppercase'>{pedido.status.replace('_', ' ')}</span>
            </div>

            {/* --- ALTERAÇÃO: Lógica para renderizar os botões de ação --- */}
            <div>
                {pedido.status === PedidoStatus.FEITO && (
                    <Button size="sm" onClick={() => onStatusChange(pedido.id, PedidoStatus.EM_PREPARO)}>
                        <Play className='h-4 w-4 mr-2' />
                        Iniciar Preparo
                    </Button>
                )}
                {pedido.status === PedidoStatus.EM_PREPARO && (
                    <Button size="sm" className='bg-green-600 hover:bg-green-700' onClick={() => onStatusChange(pedido.id, PedidoStatus.PRONTO)}>
                        <Check className='h-4 w-4 mr-2' />
                        Finalizar
                    </Button>
                )}
            </div>
            {/* --- FIM DA ALTERAÇÃO --- */}
        </CardFooter>
    </Card>
  );
}