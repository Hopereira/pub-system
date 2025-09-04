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
import ProdutoFormDialog from './ProdutoFormDialog'; // NOVO: Importamos o formulário

export default function ProdutoPageClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOVO: Estado para controlar a visibilidade do modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // NOVO: Handler para quando um produto é criado com sucesso
  const handleCreateSuccess = (novoProduto: Produto) => {
    setProdutos(currentProdutos => [novoProduto, ...currentProdutos]);
    setIsDialogOpen(false); // Fecha o modal
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
    return <ProdutosTable produtos={produtos} />;
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
        {/* NOVO: O botão agora abre o modal */}
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>
      {renderContent()}

      {/* NOVO: Renderizamos nosso formulário */}
      <ProdutoFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}