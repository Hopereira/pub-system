'use client';

import { useState } from 'react';
import { Evento } from '@/types/evento';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEvento } from '@/services/eventoService'; // Importa a função de exclusão

interface EventoDeleteAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventoToDelete: Evento | null;
  onSuccess: () => void;
}

export default function EventoDeleteAlert({ open, onOpenChange, eventoToDelete, onSuccess }: EventoDeleteAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Ação de exclusão
  const handleDelete = async () => {
    if (!eventoToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteEvento(eventoToDelete.id);
      toast.success(`Evento "${eventoToDelete.titulo}" excluído com sucesso!`);
      
      // Fecha o modal e avisa a página para recarregar
      onOpenChange(false);
      onSuccess(); 
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast.error(`Falha ao excluir o evento "${eventoToDelete.titulo}".`);
    } finally {
      setIsDeleting(false);
    }
  };

  const tituloEvento = eventoToDelete?.titulo || "este evento";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível. O evento **"{tituloEvento}"** será permanentemente removido da base de dados e não aparecerá mais na agenda.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</>
            ) : 'Excluir Permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}