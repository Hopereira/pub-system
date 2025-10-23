// Caminho: frontend/src/components/comandas/AddItemDrawer.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { adicionarItensAoPedido } from "@/services/pedidoService";
import { getProdutos } from "@/services/produtoService";
import { Produto } from "@/types/produto";
import { MinusCircle, PlusCircle, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Representa um item no nosso carrinho temporário
type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
}

interface AddItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
  onItensAdicionados: () => void; // Callback para notificar o pai
}

export function AddItemDrawer({ isOpen, onClose, comandaId, onItensAdicionados }: AddItemDrawerProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [carrinho, setCarrinho] = useState<Map<string, ItemCarrinho>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [errorProdutos, setErrorProdutos] = useState<string | null>(null);

  // Busca os produtos quando o drawer é aberto
  useEffect(() => {
    if (isOpen) {
      setLoadingProdutos(true);
      setErrorProdutos(null);
      
      getProdutos()
        .then(setProdutos)
        .catch(err => {
          console.error("Erro ao carregar produtos", err);
          setErrorProdutos('Falha ao carregar produtos. Tente novamente.');
          toast.error('Falha ao carregar produtos');
        })
        .finally(() => setLoadingProdutos(false));
    }
  }, [isOpen]);

  const handleAddToCart = (produto: Produto) => {
    const novoCarrinho = new Map(carrinho);
    const itemExistente = novoCarrinho.get(produto.id);
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      novoCarrinho.set(produto.id, { produto, quantidade: 1 });
    }
    setCarrinho(novoCarrinho);
  };

  const handleUpdateQuantidade = (produtoId: string, quantidade: number) => {
    const novoCarrinho = new Map(carrinho);
    if (quantidade <= 0) {
      novoCarrinho.delete(produtoId);
    } else {
      const item = novoCarrinho.get(produtoId);
      if (item) {
        item.quantidade = quantidade;
      }
    }
    setCarrinho(novoCarrinho);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const itensParaAdicionar = Array.from(carrinho.values()).map(item => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      }));

      const dtoParaEnviar = { comandaId, itens: itensParaAdicionar };
      await adicionarItensAoPedido(dtoParaEnviar);
      
      // Limpa tudo e notifica a página pai
      setCarrinho(new Map());
      setSearchTerm('');
      toast.success(`${itensParaAdicionar.length} item(ns) adicionado(s) com sucesso!`);
      onItensAdicionados();
      onClose();
    } catch (error: any) {
      console.error("Erro ao adicionar itens", error);
      toast.error(error.message || 'Falha ao adicionar itens. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itensCarrinhoArray = Array.from(carrinho.values());

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Adicionar Itens ao Pedido</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            {/* BUSCA */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar produto..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* LISTA DE PRODUTOS */}
            <div className="h-48 overflow-auto border rounded-md">
              {filteredProdutos.map(produto => (
                <div key={produto.id} className="flex items-center justify-between p-2 border-b" onClick={() => handleAddToCart(produto)}>
                  <span>{produto.nome}</span>
                  <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5 text-green-500" /></Button>
                </div>
              ))}
            </div>

            {/* CARRINHO */}
            <div className="h-40 overflow-auto border rounded-md p-2 space-y-2">
              <h3 className="font-semibold">Itens a adicionar:</h3>
              {itensCarrinhoArray.length === 0 ? <p className="text-sm text-center text-muted-foreground">Nenhum item selecionado</p> :
                itensCarrinhoArray.map(item => (
                  <div key={item.produto.id} className="flex items-center justify-between">
                    <span>{item.produto.nome}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleUpdateQuantidade(item.produto.id, item.quantidade - 1)}><MinusCircle className="h-5 w-5"/></Button>
                      <span className="font-bold">{item.quantidade}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleUpdateQuantidade(item.produto.id, item.quantidade + 1)}><PlusCircle className="h-5 w-5"/></Button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={isLoading || itensCarrinhoArray.length === 0}>
              {isLoading ? "A adicionar..." : `Adicionar ${itensCarrinhoArray.length} Iten(s)`}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}