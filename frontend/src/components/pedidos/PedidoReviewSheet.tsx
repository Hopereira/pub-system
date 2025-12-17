'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, 
  Users, 
  Send, 
  Plus,
  Minus,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ItemPedido {
  id?: string;
  produtoId: string;
  produtoNome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  pagador?: string;
  urlImagem?: string;
}

interface PedidoReviewSheetProps {
  open: boolean;
  onClose: () => void;
  itens: ItemPedido[];
  onUpdateQuantidade: (index: number, quantidade: number) => void;
  onRemoveItem: (index: number) => void;
  onAssignPagador: (index: number, pagadorId: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  showDivisaoConta?: boolean;
  pagadores?: Array<{ id: string; nome: string }>;
  onEditItem?: (index: number) => void;
}

export function PedidoReviewSheet({
  open,
  onClose,
  itens,
  onUpdateQuantidade,
  onRemoveItem,
  onAssignPagador,
  onSubmit,
  isLoading = false,
  showDivisaoConta = false,
  pagadores = [],
  onEditItem,
}: PedidoReviewSheetProps) {
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleIncrement = (index: number) => {
    const item = itens[index];
    onUpdateQuantidade(index, item.quantidade + 1);
  };

  const handleDecrement = (index: number) => {
    const item = itens[index];
    if (item.quantidade > 1) {
      onUpdateQuantidade(index, item.quantidade - 1);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-2xl flex items-center gap-2">
            Revisar Pedido
            <Badge variant="secondary" className="ml-auto">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <Separator />

        {/* Lista de Itens */}
        <ScrollArea className="flex-1 px-6">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-sm">Nenhum item no pedido</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'bg-muted/50 rounded-lg p-4 transition-all',
                    'animate-in slide-in-from-bottom duration-200',
                    itemSelecionado === index && 'ring-2 ring-primary'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Cabeçalho do Item */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Imagem do Produto */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {item.urlImagem ? (
                        <Image
                          src={item.urlImagem}
                          alt={item.produtoNome}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 
                        className={cn(
                          "font-semibold",
                          onEditItem && "cursor-pointer hover:text-primary hover:underline transition-colors"
                        )}
                        onClick={() => onEditItem && onEditItem(index)}
                      >
                        {item.produtoNome}
                      </h4>
                      {item.observacao && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Obs: {item.observacao}
                        </p>
                      )}
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatPrice(item.preco)}
                      </p>
                    </div>

                    {/* Botão Remover */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-background rounded-full p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleDecrement(index)}
                        disabled={item.quantidade <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-semibold w-8 text-center">
                        {item.quantidade}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleIncrement(index)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex-1 text-right">
                      <span className="text-sm font-semibold">
                        Subtotal: {formatPrice(item.preco * item.quantidade)}
                      </span>
                    </div>
                  </div>

                  {/* Divisão de Conta (opcional) */}
                  {showDivisaoConta && pagadores.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => setItemSelecionado(index)}
                        className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {item.pagador 
                              ? `Pagar por: ${pagadores.find(p => p.id === item.pagador)?.nome}`
                              : 'Atribuir pagador'}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Rodapé com Total e Ações */}
        <div className="border-t bg-background">
          <div className="px-6 py-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(calcularTotal())}
              </span>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2">
              <Button
                className="w-full h-14 text-lg font-semibold"
                onClick={onSubmit}
                disabled={itens.length === 0 || isLoading}
              >
                <Send className="mr-2 h-5 w-5" />
                {isLoading ? 'Enviando...' : 'Enviar para Preparo'}
              </Button>
              
              <Button
                className="w-full h-12"
                variant="ghost"
                onClick={onClose}
              >
                Continuar Adicionando
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
