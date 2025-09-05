// Caminho: frontend/src/components/operacional/PedidoCard.tsx

'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Exportamos o tipo para ser usado em outros lugares
export type PedidoStatus = 'FEITO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

interface ItemPedido {
  quantidade: number;
  produto: {
    nome: string;
  };
}

interface Pedido {
  id: string;
  status: PedidoStatus;
  itens: ItemPedido[];
}

// Definimos as propriedades que o componente espera receber
interface PedidoCardProps {
  pedido: Pedido;
  onUpdateStatus: (pedidoId: string, novoStatus: PedidoStatus) => void;
}

export function PedidoCard({ pedido, onUpdateStatus }: PedidoCardProps) {
  // ... (função getStatusVariant continua igual)
  const getStatusVariant = (status: PedidoStatus) => {
    switch (status) {
      case 'FEITO':
        return 'default';
      case 'EM_PREPARO':
        return 'secondary';
      case 'PRONTO':
        return 'destructive';
      default:
        return 'outline';
    }
  };


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Pedido</CardTitle>
            <p className="text-xs text-muted-foreground truncate">ID: {pedido.id}</p>
          </div>
          <Badge variant={getStatusVariant(pedido.status)}>{pedido.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {pedido.itens.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-sm">
              <span className="font-semibold">{item.quantidade}x</span>
              <span>{item.produto.nome}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {/* --- BOTÕES COM FUNCIONALIDADE --- */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onUpdateStatus(pedido.id, 'EM_PREPARO')}
          disabled={pedido.status !== 'FEITO'} // Desativa se o pedido não estiver como 'FEITO'
        >
          Em Preparo
        </Button>
        <Button 
          size="sm"
          onClick={() => onUpdateStatus(pedido.id, 'PRONTO')}
          disabled={pedido.status !== 'EM_PREPARO'} // Desativa se o pedido não estiver 'EM_PREPARO'
        >
          Pronto
        </Button>
        {/* --- FIM DOS BOTÕES --- */}
      </CardFooter>
    </Card>
  );
}