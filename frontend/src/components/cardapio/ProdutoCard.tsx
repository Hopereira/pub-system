import Image from 'next/image';
import { Produto } from '@/types/produto';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProdutoCardProps {
  produto: Produto;
  onAddToCart: () => void;
}

export default function ProdutoCard({ produto, onAddToCart }: ProdutoCardProps) {
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(produto.preco);

  return (
    <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-transform hover:scale-105 duration-300">
      <div className="relative w-full aspect-[4/3]">
        {/* Lógica de renderização condicional da imagem */}
        {produto.urlImagem ? (
          <Image
            src={produto.urlImagem}
            alt={produto.nome}
            fill
            className="rounded-t-lg object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center text-xs text-muted-foreground">
            Sem Foto
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold truncate">{produto.nome}</h3>
          <p className="text-sm text-muted-foreground h-10 overflow-hidden">{produto.descricao}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold">{precoFormatado}</span>
          <Button onClick={onAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}