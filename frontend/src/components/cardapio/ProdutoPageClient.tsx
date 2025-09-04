// Caminho: frontend/src/components/cardapio/ProdutoPageClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

import { Produto } from '@/types/produto';
import { getProdutos } from '@/services/produtoService';
import ProdutosTable from './ProdutosTable';
import ProdutoFormDialog from './ProdutoFormDialog';

export default function ProdutoPageClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // NOVO: Estado para guardar o produto que será editado
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setIsLoading(true);
        const data = await getProdutos();
        setProdutos(data);
      } catch (err) {
        setError('Não foi possível carregar o cardápio.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProdutos();
  }, []);

  const handleOpenCreateDialog = () => {
    setProdutoToEdit(null); // Garante que não há dados de edição
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (produto: Produto) => {
    setProdutoToEdit(produto);
    setIsDialogOpen(true);
  };

  // Handler de sucesso genérico que trata tanto criação quanto edição
  const handleSuccess = (resultProduto: Produto) => {
    if (produtoToEdit) {
      // Se estávamos editando, atualizamos o item na lista
      setProdutos(current => 
        current.map(p => (p.id === resultProduto.id ? resultProduto : p))
      );
    } else {
      // Se estávamos criando, adicionamos no topo da lista
      setProdutos(current => [resultProduto, ...current]);
    }
    setIsDialogOpen(false);
    setProdutoToEdit(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    // Passamos a nova função onEdit para a tabela
    return <ProdutosTable produtos={produtos} onEdit={handleOpenEditDialog} />;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Cardápio</h1>
          <p className="text-muted-foreground">
            Adicione, edite e remova os produtos do seu estabelecimento.
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      {renderContent()}

      <ProdutoFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
        produtoToEdit={produtoToEdit}
      />
    </div>
  );
}