'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Save } from 'lucide-react';

interface CarrinhoItem {
  id?: string;
  produtoId: string;
  produtoNome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
}

interface EditItemDialogProps {
  item: CarrinhoItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (quantidade: number, observacao: string) => void;
}

export function EditItemDialog({
  item,
  open,
  onClose,
  onSave,
}: EditItemDialogProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (item) {
      setQuantidade(item.quantidade);
      setObservacao(item.observacao || '');
    }
  }, [item]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    onSave(quantidade, observacao);
    handleClose();
  };

  if (!item) return null;

  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(item.preco);

  const subtotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(item.preco * quantidade);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Altere a quantidade ou observações do item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Produto */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg">{item.produtoNome}</h3>
            <p className="text-lg font-bold text-primary mt-1">
              {precoFormatado}
            </p>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-semibold w-12 text-center">
                {quantidade}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidade(quantidade + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacao">
              Observações <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="observacao"
              placeholder="Ex: Sem gelo, sem cebola, ponto da carne, etc."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {observacao.length}/200 caracteres
            </p>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-semibold">Subtotal:</span>
            <span className="text-xl font-bold text-primary">{subtotal}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
