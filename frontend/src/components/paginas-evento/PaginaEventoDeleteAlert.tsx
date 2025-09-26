// Caminho: frontend/src/components/paginas-evento/PaginaEventoDeleteAlert.tsx
'use client';

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
import { PaginaEvento } from '@/types/pagina-evento';
import { deletePaginaEvento } from '@/services/paginaEventoService';
import { toast } from 'sonner';
import { useState } from 'react';

interface PaginaEventoDeleteAlertProps {
  paginaToDelete: PaginaEvento | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaginaEventoDeleteAlert({
  paginaToDelete,
  onClose,
  onSuccess,
}: PaginaEventoDeleteAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // O componente só está aberto se tiver uma página para deletar
  const open = !!paginaToDelete;

  const handleDelete = async () => {
    if (!paginaToDelete) return;

    setIsDeleting(true);
    try {
      await deletePaginaEvento(paginaToDelete.id);
      toast.success('Página excluída com sucesso!');
      onSuccess(); // Avisa a página pai para recarregar
    } catch (error) {
      console.error('Falha ao excluir página:', error);
      toast.error('Falha ao excluir a página. Tente novamente.');
    } finally {
      setIsDeleting(false);
      onClose(); // Fecha o modal
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isto irá apagar permanentemente a
            página "{paginaToDelete?.titulo}" e todos os seus dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'A Excluir...' : 'Sim, excluir página'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}