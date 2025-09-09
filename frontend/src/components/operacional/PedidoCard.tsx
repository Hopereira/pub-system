// Caminho: frontend/src/components/operacional/PedidoCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
// ALTERADO: Importamos o enum e o tipo do nosso arquivo central
import { Pedido, PedidoStatus } from '@/types/pedido';

interface PedidoCardProps {
  pedido: Pedido;
  onUpdateStatus: (pedidoId: string, novoStatus: PedidoStatus) => void;
  onCancel: (pedidoId: string, motivo: string) => void;
}

// REMOVIDO: A definição local de 'type PedidoStatus' e das interfaces foi removida daqui

export function PedidoCard({ pedido, onUpdateStatus, onCancel }: PedidoCardProps) {
  const [motivo, setMotivo] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmarCancelamento = () => {
    if (motivo.trim().length < 5) {
      alert('Por favor, insira um motivo com pelo menos 5 caracteres.');
      return;
    }
    onCancel(pedido.id, motivo);
    setIsDialogOpen(false);
    setMotivo('');
  };

  const getStatusVariant = (status: PedidoStatus) => {
    switch (status) {
      case PedidoStatus.FEITO: return 'default';
      case PedidoStatus.EM_PREPARO: return 'secondary';
      case PedidoStatus.PRONTO: return 'destructive'; // Vermelho para chamar atenção
      case PedidoStatus.ENTREGUE: return 'outline';
      case PedidoStatus.CANCELADO: return 'outline';
      default: return 'outline';
    }
  };

  const isTerminal = pedido.status === PedidoStatus.ENTREGUE || pedido.status === PedidoStatus.CANCELADO;

  return (
    <Card className={cn("flex flex-col", isTerminal && "opacity-60 bg-muted/50")}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Pedido</CardTitle>
            <p className="text-xs text-muted-foreground truncate">ID: {pedido.id.split('-')[0]}</p>
          </div>
          <Badge variant={getStatusVariant(pedido.status)}
            className={cn(pedido.status === PedidoStatus.ENTREGUE && 'bg-green-600 text-white')}
          >
            {pedido.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {pedido.status === PedidoStatus.CANCELADO && (
          <p className="text-xs text-destructive mb-2">
            <strong>Motivo:</strong> {pedido.motivoCancelamento}
          </p>
        )}
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
        {!isTerminal && (
          <>
            {pedido.status === PedidoStatus.FEITO && (
              <Button variant="outline" size="sm" onClick={() => onUpdateStatus(pedido.id, PedidoStatus.EM_PREPARO)}>
                Iniciar Preparo
              </Button>
            )}
            {pedido.status === PedidoStatus.EM_PREPARO && (
              <Button size="sm" onClick={() => onUpdateStatus(pedido.id, PedidoStatus.PRONTO)}>
                Pronto
              </Button>
            )}
            {pedido.status === PedidoStatus.PRONTO && (
              <Button size="sm" className='bg-green-600 hover:bg-green-700' onClick={() => onUpdateStatus(pedido.id, PedidoStatus.ENTREGUE)}>
                Entregar
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button variant="destructive" size="sm">Cancelar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cancelar Pedido</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="motivo">Motivo do Cancelamento</Label>
                  <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Item em falta no estoque" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Voltar</Button></DialogClose>
                  <Button variant="destructive" onClick={handleConfirmarCancelamento}>Confirmar Cancelamento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
}