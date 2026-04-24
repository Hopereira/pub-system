'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Comanda } from '@/types/comanda';
import ProdutoCard from '@/components/cardapio/ProdutoCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createPedidoFromCliente } from '@/services/pedidoService'; 
import { CreateItemPedidoDto } from '@/types/pedido.dto';
import { PedidoReviewSheet } from '@/components/pedidos/PedidoReviewSheet';
import { AddProdutoDialog } from '@/components/cardapio/AddProdutoDialog';
import { EditItemDialog } from '@/components/cardapio/EditItemDialog';
import { Produto } from '@/types/produto';
import { getProdutosPublic } from '@/services/produtoService';

interface CarrinhoItem {
  id?: string;
  produtoId: string;
  produtoNome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  urlImagem?: string;
}

const groupProdutosByCategoria = (produtos: Produto[]) => {
  return produtos.reduce<Record<string, Produto[]>>((acc, produto) => {
    const categoria = produto.categoria || 'Outros';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(produto);
    return acc;
  }, {});
};

interface CardapioClientPageProps {
  comanda: Comanda;
}

export default function CardapioClientPage({ comanda }: CardapioClientPageProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(true);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [itemEditando, setItemEditando] = useState<number | null>(null);
  const router = useRouter();

  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('Todos');

  // Buscar produtos no client side para que o header X-Tenant-ID seja enviado corretamente
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setIsLoadingProdutos(true);
        const data = await getProdutosPublic();
        setProdutos(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar o cardápio');
      } finally {
        setIsLoadingProdutos(false);
      }
    };

    fetchProdutos();
  }, []);

  const handleAddToCart = (produto: Produto) => {
    setProdutoSelecionado(produto);
  };

  const handleConfirmAdd = (quantidade: number, observacao: string) => {
    if (!produtoSelecionado) return;
    
    toast.success(`${produtoSelecionado.nome} adicionado ao carrinho!`);
    setCarrinho(prevCarrinho => [
      ...prevCarrinho,
      { 
        produtoId: produtoSelecionado.id, 
        produtoNome: produtoSelecionado.nome, 
        preco: produtoSelecionado.preco, 
        quantidade, 
        observacao,
        urlImagem: produtoSelecionado.urlImagem ?? undefined 
      }
    ]);
    setProdutoSelecionado(null);
  };

  const handleUpdateQuantidade = (index: number, quantidade: number) => {
    setCarrinho(prevCarrinho => 
      prevCarrinho.map((item, i) => 
        i === index ? { ...item, quantidade } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setCarrinho(prevCarrinho => prevCarrinho.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    setItemEditando(index);
    setIsCarrinhoOpen(false);
  };

  const handleSaveEdit = (quantidade: number, observacao: string) => {
    if (itemEditando === null) return;
    setCarrinho(prevCarrinho =>
      prevCarrinho.map((item, i) =>
        i === itemEditando ? { ...item, quantidade, observacao } : item
      )
    );
    toast.success('Item atualizado!');
    setItemEditando(null);
    setIsCarrinhoOpen(true);
  };

  const handleFinalizarPedido = async () => {
    if (carrinho.length === 0) {
      toast.info("O seu carrinho está vazio.");
      return;
    }

    setIsLoading(true);
    const itens: CreateItemPedidoDto[] = carrinho.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      observacao: item.observacao,
    }));

    try {
      await createPedidoFromCliente({ comandaId: comanda.id, itens });
      toast.success("Pedido enviado para preparo!");
      setCarrinho([]);
      setIsCarrinhoOpen(false);
      router.push(`/acesso-cliente/${comanda.id}`);
    } catch (error) {
      toast.error("Falha ao enviar o pedido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const correspondeBusca = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
      const correspondeCategoria = categoriaSelecionada === 'Todos' || produto.categoria === categoriaSelecionada;
      return correspondeBusca && correspondeCategoria;
    });
  }, [produtos, termoBusca, categoriaSelecionada]);
  
  const produtosAgrupados = useMemo(() => groupProdutosByCategoria(produtosFiltrados), [produtosFiltrados]);
  
  const todasCategorias = useMemo(() => ['Todos', ...Object.keys(groupProdutosByCategoria(produtos))], [produtos]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-lg text-muted-foreground">
            {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}
          </p>
        </div>
      </div>

      {/* Botão Flutuante Ver Carrinho */}
      {carrinho.length > 0 && (
        <Button 
          onClick={() => setIsCarrinhoOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="ml-2">Ver Carrinho</span>
          <Badge className="absolute -top-2 -right-2" variant="destructive">
            {carrinho.reduce((total, item) => total + item.quantidade, 0)}
          </Badge>
        </Button>
      )}
        
      <PedidoReviewSheet
        open={isCarrinhoOpen}
        onClose={() => setIsCarrinhoOpen(false)}
        itens={carrinho}
        onUpdateQuantidade={handleUpdateQuantidade}
        onRemoveItem={handleRemoveItem}
        onAssignPagador={() => {}}
        onSubmit={handleFinalizarPedido}
        isLoading={isLoading}
        onEditItem={handleEditItem}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-4 bg-background/90 backdrop-blur-sm p-4 rounded-lg border z-10">
        <Input
          placeholder="Buscar por nome do produto..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="flex-grow"
        />
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {todasCategorias.map(cat => (
            <Button
              key={cat}
              variant={categoriaSelecionada === cat ? 'default' : 'outline'}
              onClick={() => setCategoriaSelecionada(cat)}
              className="flex-shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {Object.keys(produtosAgrupados).length > 0 ? (
        Object.keys(produtosAgrupados).map(categoria => (
          <div key={categoria} className="my-8">
            <h2 className="text-2xl font-semibold mb-4">{categoria}</h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {produtosAgrupados[categoria].map(produto => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  onAddToCart={() => handleAddToCart(produto)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
        </div>
      )}

      <AddProdutoDialog
        produto={produtoSelecionado}
        open={!!produtoSelecionado}
        onClose={() => setProdutoSelecionado(null)}
        onAdd={handleConfirmAdd}
      />

      <EditItemDialog
        item={itemEditando !== null ? carrinho[itemEditando] : null}
        open={itemEditando !== null}
        onClose={() => {
          setItemEditando(null);
          setIsCarrinhoOpen(true);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}