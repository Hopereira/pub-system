// Caminho: frontend/src/components/cardapio/ProdutoCard.tsx
import Image from 'next/image';
import { Produto } from '@/types/produto';
import { Button } from '@/components/ui/button'; // Importamos o componente Button

// Definimos as props que o componente irá receber
interface ProdutoCardProps {
  produto: Produto;
  onAddToCart: () => void; // A nova prop para a função de adicionar ao carrinho
}

export default function ProdutoCard({ produto, onAddToCart }: ProdutoCardProps) {
  // Converte o preço para um formato de moeda
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(produto.preco);

  return (
    <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Exibimos a imagem do produto */}
      {produto.urlImagem && (
        <Image
          src={produto.urlImagem}
          alt={produto.nome}
          width={400} // Largura da imagem
          height={300} // Altura da imagem
          className="rounded-t-lg object-cover aspect-[4/3]"
        />
      )}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold">{produto.nome}</h3>
          <p className="text-sm text-muted-foreground">{produto.descricao}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold">{precoFormatado}</span>
          {/* Botão de adicionar ao carrinho, agora com o onClick */}
          <Button onClick={onAddToCart}>Adicionar</Button>
        </div>
      </div>
    </div>
  );
}