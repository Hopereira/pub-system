;'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Comanda } from '@/types/comanda';
import { Produto } from '@/types/produto';
import ProdutoCard from '@/components/cardapio/ProdutoCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Pencil, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription, // Adicionado para acessibilidade
  SheetTrigger,
  SheetFooter, // Adicionado para o botão de finalizar
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { createPedidoFromCliente } from '@/services/pedidoService'; 
import { CreateItemPedidoDto } from '@/types/pedido.dto';


interface CarrinhoItem {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
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
  produtos: Produto[];
}

export default function CardapioClientPage({ comanda, produtos }: CardapioClientPageProps) {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [observacaoText, setObservacaoText] = useState('');
  const router = useRouter();

  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('Todos');

  const handleAddItemToCart = (produto: Produto, quantidade = 1) => {
    toast.success(`${produto.nome} adicionado ao carrinho!`);
    setCarrinho(prevCarrinho => {
      const existingItem = prevCarrinho.find(item => item.produtoId === produto.id);
      if (existingItem) {
        return prevCarrinho.map(item =>
          item.produtoId === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      } else {
        return [ ...prevCarrinho, { produtoId: produto.id, nome: produto.nome, preco: produto.preco, quantidade, observacao: '' }];
      }
    });
  };

  const handleRemoveItemFromCart = (produtoId: string) => {
    setCarrinho(prevCarrinho => {
      const existingItem = prevCarrinho.find(item => item.produtoId === produtoId);
      if (!existingItem) return prevCarrinho;
      if (existingItem.quantidade > 1) {
        return prevCarrinho.map(item =>
          item.produtoId === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
        );
      } else {
        return prevCarrinho.filter(item => item.produtoId !== produtoId);
      }
    });
  };

  const handleUpdateObservacao = (produtoId: string) => {
    setCarrinho(prevCarrinho =>
      prevCarrinho.map(item =>
        item.produtoId === produtoId ? { ...item, observacao: observacaoText } : item
      )
    );
    setEditingItemId(null);
    setObservacaoText('');
  };
  
  const handleStartEditing = (item: CarrinhoItem) => {
    setEditingItemId(item.produtoId);
    setObservacaoText(item.observacao || '');
  };

  const calcularTotalCarrinho = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };
  
  const handleFinalizarPedido = async () => {
    if (carrinho.length === 0) {
      toast.info("O seu carrinho está vazio.");
      return;
    }

    const itens: CreateItemPedidoDto[] = carrinho.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      observacao: item.observacao,
    }));

    try {
      await createPedidoFromCliente({ comandaId: comanda.id, itens });
      toast.success("Pedido enviado para a cozinha!");
      setCarrinho([]);
      setIsCarrinhoOpen(false);
      router.push(`/acesso-cliente/${comanda.id}`);
    } catch (error) {
      toast.error("Falha ao enviar o pedido. Tente novamente.");
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
        
        <Sheet open={isCarrinhoOpen} onOpenChange={setIsCarrinhoOpen}>
          <SheetTrigger asChild>
            <Button className="relative mt-4 sm:mt-0">
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2">Ver Carrinho</span>
              {carrinho.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                  {carrinho.reduce((total, item) => total + item.quantidade, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          {/* ==================================================================
              ## CORREÇÃO: Estrutura completa do carrinho restaurada ##
             ================================================================== */}
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Seu Carrinho</SheetTitle>
              <SheetDescription>Revise os itens antes de enviar para o preparo.</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4 flex-1 overflow-y-auto">
              {carrinho.length === 0 ? (
                <p className="text-muted-foreground text-center pt-10">O seu carrinho está vazio.</p>
              ) : (
                carrinho.map(item => (
                  <div key={item.produtoId} className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRemoveItemFromCart(item.produtoId)}>-</Button>
                        <span className="w-6 text-center">{item.quantidade}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAddItemToCart(produtos.find(p => p.id === item.produtoId)!, 1)}>+</Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      {editingItemId === item.produtoId ? (
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Ex: Sem cebola, ponto da carne..."
                            value={observacaoText}
                            onChange={(e) => setObservacaoText(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                             <Button variant="ghost" size="sm" onClick={() => setEditingItemId(null)}>Cancelar</Button>
                             <Button size="sm" onClick={() => handleUpdateObservacao(item.produtoId)}>
                               <Check className="h-4 w-4 mr-1"/> Salvar
                             </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {item.observacao && (
                             <p className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-md">Obs: {item.observacao}</p>
                          )}
                          <Button variant="link" size="sm" className="p-0 h-auto text-sky-600" onClick={() => handleStartEditing(item)}>
                            <Pencil className="h-3 w-3 mr-1"/>
                            {item.observacao ? 'Editar observação' : 'Adicionar observação'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {carrinho.length > 0 && (
                <SheetFooter className="mt-auto border-t pt-4">
                    <div className='w-full space-y-4'>
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalCarrinho())}</span>
                        </div>
                        <Button 
                            disabled={carrinho.length === 0} 
                            className="w-full"
                            onClick={handleFinalizarPedido}
                        >
                            Enviar Pedido para Cozinha
                        </Button>
                    </div>
                </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

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
                  onAddToCart={() => handleAddItemToCart(produto)}
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
    </div>
  );
}