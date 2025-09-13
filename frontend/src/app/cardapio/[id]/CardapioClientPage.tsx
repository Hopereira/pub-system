// Caminho: frontend/src/app/cardapio/[id]/CardapioClientPage.tsx
'use client';

import { useState } from 'react';
// --- ADIÇÃO ---
import { useRouter } from 'next/navigation';
import { Comanda } from '@/types/comanda';
import { Produto } from '@/types/produto';
import ProdutoCard from '@/components/cardapio/ProdutoCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Pencil, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface CarrinhoItem {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
}

// (Função groupProdutosByCategoria não foi alterada)
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
  
  // --- ADIÇÃO ---
  const router = useRouter();

  // (Funções de manipulação do carrinho não foram alteradas)
  const handleAddItemToCart = (produto: Produto, quantidade = 1) => {
    setCarrinho(prevCarrinho => {
      const existingItem = prevCarrinho.find(item => item.produtoId === produto.id);
      if (existingItem) {
        return prevCarrinho.map(item =>
          item.produtoId === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      } else {
        return [
          ...prevCarrinho,
          {
            produtoId: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade,
            observacao: '',
          },
        ];
      }
    });
  };

  const handleRemoveItemFromCart = (produtoId: string) => {
    setCarrinho(prevCarrinho => {
      const existingItem = prevCarrinho.find(item => item.produtoId === produtoId);
      if (!existingItem) return prevCarrinho;
      if (existingItem.quantidade > 1) {
        return prevCarrinho.map(item =>
          item.produtoId === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        );
      } else {
        return prevCarrinho.filter(item => item.produtoId !== produtoId);
      }
    });
  };

  const handleUpdateObservacao = (produtoId: string) => {
    setCarrinho(prevCarrinho =>
      prevCarrinho.map(item =>
        item.produtoId === produtoId
          ? { ...item, observacao: observacaoText }
          : item
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
  // --- FIM DAS FUNÇÕES NÃO ALTERADAS ---

  // --- NOVA FUNÇÃO PARA NAVEGAÇÃO ---
  const handleNavigateToResumo = () => {
    try {
      // Salva o carrinho atual no sessionStorage para ser lido pela próxima página
      sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
      // Navega para a página de resumo
      router.push(`/acesso-cliente/${comanda.id}/resumo`);
    } catch (error) {
      console.error("Falha ao salvar carrinho no sessionStorage:", error);
      toast.error("Ocorreu um erro ao tentar prosseguir. Tente novamente.");
    }
  };

  const produtosAgrupados = groupProdutosByCategoria(produtos);
  const categorias = Object.keys(produtosAgrupados);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* (Cabeçalho da página não foi alterado) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-lg text-muted-foreground">
            Olá, {comanda.cliente?.nome || 'Cliente'}! Mesa {comanda.mesa?.nome || 'balcão'}.
          </p>
        </div>
        
        <Sheet open={isCarrinhoOpen} onOpenChange={setIsCarrinhoOpen}>
          {/* (Conteúdo do Sheet/Carrinho não foi alterado, exceto o botão final) */}
          <SheetTrigger asChild>
            <Button className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2">Ver Carrinho</span>
              {carrinho.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {carrinho.reduce((total, item) => total + item.quantidade, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Seu Pedido</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {carrinho.length === 0 ? (
                <p className="text-muted-foreground text-center">O seu carrinho está vazio.</p>
              ) : (
                <>
                  {carrinho.map(item => (
                    <div key={item.produtoId} className="border-b pb-4">
                      {/* ... (renderização de cada item do carrinho) ... */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantidade} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRemoveItemFromCart(item.produtoId)}>-</Button>
                          <span className="w-6 text-center">{item.quantidade}</span>
                          <Button variant="outline" size="sm" onClick={() => handleAddItemToCart(produtos.find(p => p.id === item.produtoId)!, 1)}>+</Button>
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
                                 <Check className="h-4 w-4 mr-1"/>
                                 Salvar
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
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalCarrinho())}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              {/* --- BOTÃO ATUALIZADO --- */}
              <Button 
                disabled={carrinho.length === 0} 
                className="w-full"
                onClick={handleNavigateToResumo}
              >
                Ir para o Resumo
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* (Renderização dos produtos por categoria não foi alterada) */}
      {categorias.map(categoria => (
        <div key={categoria} className="my-8">
          <h2 className="text-2xl font-semibold mb-4">{categoria}</h2>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {produtosAgrupados[categoria].map(produto => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                onAddToCart={() => handleAddItemToCart(produto)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}