'use client';

import { useState } from 'react';
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
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Produto } from '@/types/produto';
import Image from 'next/image';

interface AddProdutoDialogProps {
  produto: Produto | null;
  open: boolean;
  onClose: () => void;
  onAdd: (quantidade: number, observacao: string) => void;
}

export function AddProdutoDialog({
  produto,
  open,
  onClose,
  onAdd,
}: AddProdutoDialogProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  const handleClose = () => {
    setQuantidade(1);
    setObservacao('');
    onClose();
  };

  const handleAdd = () => {
    onAdd(quantidade, observacao);
    handleClose();
  };

  if (!produto) return null;

  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(produto.preco);

  const subtotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(produto.preco * quantidade);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ao Pedido</DialogTitle>
          <DialogDescription>
            Personalize seu pedido antes de adicionar ao carrinho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem e Info do Produto */}
          <div className="flex gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              {produto.urlImagem ? (
                <Image
                  src={produto.urlImagem}
                  alt={produto.nome}
                  fill
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                  Sem Foto
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{produto.nome}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {produto.descricao}
              </p>
              <p className="text-lg font-bold text-primary mt-1">
                {precoFormatado}
              </p>
            </div>
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
          <Button onClick={handleAdd} className="flex-1">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Adicionar ao Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
