'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Produto } from '@/types/produto';
import { cn } from '@/lib/utils';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface ProdutoGridMobileProps {
  produtos: Produto[];
  onAddToCart: (produto: Produto, quantidade: number, observacao?: string) => void;
}

export function ProdutoGridMobile({ produtos, onAddToCart }: ProdutoGridMobileProps) {
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  const handleClose = () => {
    setSelectedProduto(null);
    setQuantidade(1);
    setObservacao('');
  };

  const handleAddToCart = () => {
    if (selectedProduto) {
      onAddToCart(selectedProduto, quantidade, observacao || undefined);
      handleClose();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <>
      {/* Grid de Produtos - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        {produtos.map((produto) => (
          <button
            key={produto.id}
            onClick={() => setSelectedProduto(produto)}
            className={cn(
              'bg-card rounded-lg overflow-hidden shadow-sm',
              'active:scale-95 transition-transform',
              'flex flex-col h-full text-left'
            )}
          >
            {/* Imagem do Produto */}
            <div className="relative w-full aspect-[4/3] bg-muted">
              {produto.urlImagem ? (
                <Image
                  src={produto.urlImagem}
                  alt={produto.nome}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
              
              {/* Badge de Preço - Destaque Visual */}
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-primary-foreground font-bold shadow-md">
                  {formatPrice(produto.preco)}
                </Badge>
              </div>
            </div>

            {/* Informações do Produto */}
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {produto.nome}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                {produto.descricao}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Sheet (Modal) de Detalhes do Produto */}
      <Sheet open={!!selectedProduto} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col">
          {selectedProduto && (
            <>
              {/* Imagem Hero */}
              <div className="relative w-full aspect-[16/9] -mx-6 -mt-6 mb-4">
                {selectedProduto.urlImagem ? (
                  <Image
                    src={selectedProduto.urlImagem}
                    alt={selectedProduto.nome}
                    fill
                    className="object-cover rounded-t-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-2xl">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col overflow-y-auto">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl">{selectedProduto.nome}</SheetTitle>
                  <SheetDescription className="text-base">
                    {selectedProduto.descricao}
                  </SheetDescription>
                </SheetHeader>

                {/* Preço */}
                <div className="mt-4">
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(selectedProduto.preco)}
                  </div>
                </div>

                {/* Observações */}
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium">
                    Observações (opcional)
                  </label>
                  <Textarea
                    placeholder="Ex: Sem cebola, ponto da carne ao ponto..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Controle de Quantidade */}
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex-1 text-center">
                      <div className="text-3xl font-bold">{quantidade}</div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botão Adicionar ao Pedido - Fixo no rodapé */}
              <div className="pt-4 pb-safe space-y-2">
                <Button 
                  className="w-full h-14 text-lg font-semibold"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar {quantidade > 1 && `(${quantidade})`} • {formatPrice(selectedProduto.preco * quantidade)}
                </Button>
                <Button 
                  className="w-full h-12"
                  variant="ghost"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
