// Caminho: frontend/src/components/mesas/MesaPageClient.tsx

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

import { Mesa } from '@/types/mesa';
import { getMesas, deleteMesa } from '@/services/mesaService';
import MesasTable from './MesasTable';
import MesaFormDialog from './MesaFormDialog';

export default function MesaPageClient() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [mesaToEdit, setMesaToEdit] = useState<Mesa | null>(null);

  // --- NOVO: Estados para o diálogo de confirmação de exclusão ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mesaToDelete, setMesaToDelete] = useState<Mesa | null>(null);

  useEffect(() => {
    const fetchMesas = async () => {
      try {
        setIsLoading(true);
        const data = await getMesas();
        setMesas(data);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar a lista de mesas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMesas();
  }, []);

  const handleOpenCreateDialog = () => {
    setMesaToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (mesa: Mesa) => {
    setMesaToEdit(mesa);
    setIsFormDialogOpen(true);
  };

  // --- NOVO: Funções para controlar a exclusão ---
  const handleOpenDeleteDialog = (mesa: Mesa) => {
    setMesaToDelete(mesa);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mesaToDelete) return;

    try {
      await deleteMesa(mesaToDelete.id);
      setMesas(current => current.filter(m => m.id !== mesaToDelete.id));
    } catch (err) {
      setError(`Erro ao excluir a mesa ${mesaToDelete.numero}.`);
    } finally {
      setIsConfirmOpen(false);
      setMesaToDelete(null);
    }
  };

  const handleSuccess = (resultMesa: Mesa) => {
    if (mesaToEdit) {
      setMesas(current =>
        current.map(m => (m.id === resultMesa.id ? resultMesa : m))
      );
    } else {
      setMesas(current => [resultMesa, ...current]);
    }
    setIsFormDialogOpen(false);
    setMesaToEdit(null);
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
    return <MesasTable mesas={mesas} onEdit={handleOpenEditDialog} onDelete={handleOpenDeleteDialog} />;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Mesas</h1>
          <p className="text-muted-foreground">
            Crie, edite e remova as mesas do seu estabelecimento.
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Nova
        </Button>
      </div>

      {renderContent()}

      <MesaFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={handleSuccess}
        mesaToEdit={mesaToEdit}
      />

      {/* --- NOVO: Diálogo de confirmação de exclusão --- */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a mesa de número
              <span className="font-bold"> {mesaToDelete?.numero}</span> do ambiente
              <span className="font-bold"> {mesaToDelete?.ambiente?.nome}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMesaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}