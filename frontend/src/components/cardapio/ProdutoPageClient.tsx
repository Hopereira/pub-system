// Caminho: frontend/src/components/cardapio/ProdutoPageClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Produto } from '@/types/produto';
import { getProdutos, deleteProduto } from '@/services/produtoService';
import ProdutosTable from './ProdutosTable';
import ProdutoFormDialog from './ProdutoFormDialog';

export default function ProdutoPageClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);

  // --- NOVO: Estados para o diálogo de confirmação de exclusão ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);


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
    setProdutoToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (produto: Produto) => {
    setProdutoToEdit(produto);
    setIsDialogOpen(true);
  };

  // --- NOVO: Funções para controlar a exclusão ---
  const handleOpenDeleteDialog = (produto: Produto) => {
    setProdutoToDelete(produto);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!produtoToDelete) return;

    try {
      await deleteProduto(produtoToDelete.id);
      setProdutos(current => current.filter(p => p.id !== produtoToDelete.id));
    } catch (err) {
      setError(`Erro ao excluir o produto ${produtoToDelete.nome}.`);
    } finally {
      setIsConfirmOpen(false);
      setProdutoToDelete(null);
    }
  };

  const handleSuccess = (resultProduto: Produto) => {
    if (produtoToEdit) {
      setProdutos(current =>
        current.map(p => (p.id === resultProduto.id ? resultProduto : p))
      );
    } else {
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
    // Passamos a nova função onDelete para a tabela
    return <ProdutosTable produtos={produtos} onEdit={handleOpenEditDialog} onDelete={handleOpenDeleteDialog} />;
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

      {/* --- NOVO: Diálogo de confirmação de exclusão --- */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
              <span className="font-bold"> {produtoToDelete?.nome}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProdutoToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}