'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Pedido, ItemPedido } from '@/types/pedido';
import { PedidoStatus } from '@/types/pedido-status.enum';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PedidoCardProps {
  pedido: Pedido;
  onUpdateStatus: (itemPedidoId: string, novoStatus: PedidoStatus) => void;
  onCancel: (itemPedidoId: string, motivo: string) => void;
  filtroStatus: PedidoStatus;
}

export function PedidoCard({ pedido, onUpdateStatus, onCancel, filtroStatus }: PedidoCardProps) {
  const [motivo, setMotivo] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const handleConfirmarCancelamento = () => {
    if (currentItemId && motivo.trim().length >= 5) {
      onCancel(currentItemId, motivo);
      setIsDialogOpen(false);
      setMotivo('');
      setCurrentItemId(null);
    } else {
      alert('O motivo deve ter pelo menos 5 caracteres.');
    }
  };
  
  const handleOpenCancelDialog = (itemId: string) => {
    setCurrentItemId(itemId);
    setIsDialogOpen(true);
  };

  const itensFiltrados = pedido.itens.filter(item => item.status === filtroStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mesa {pedido.comanda?.mesa?.numero || 'Balcão'}</CardTitle>
        <p className="text-xs text-muted-foreground truncate">Pedido ID: {pedido.id}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {itensFiltrados.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">{item.quantidade}x</span>
              <span>{item.produto.nome}</span>
            </div>
            {item.observacao && <p className="text-xs text-gray-500 italic ml-4">Obs: {item.observacao}</p>}
            
            <div className="flex justify-end space-x-2 mt-2">
              {item.status === PedidoStatus.FEITO && (
                <Button variant="outline" size="sm" onClick={() => onUpdateStatus(item.id, PedidoStatus.EM_PREPARO)}>Em Preparo</Button>
              )}
              {item.status === PedidoStatus.EM_PREPARO && (
                <Button size="sm" onClick={() => onUpdateStatus(item.id, PedidoStatus.PRONTO)}>Pronto</Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => handleOpenCancelDialog(item.id)}>Cancelar</Button>
            </div>
            <Separator className="mt-3"/>
          </div>
        ))}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cancelar Item</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="motivo">Motivo do Cancelamento</Label>
              <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Item em falta"/>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Voltar</Button></DialogClose>
              <Button variant="destructive" onClick={handleConfirmarCancelamento}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}