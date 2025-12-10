// Caminho: frontend/src/components/paginas-evento/PaginaEventoFormDialog.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PaginaEvento } from '@/types/pagina-evento';
import { createPaginaEvento, updatePaginaEvento } from '@/services/paginaEventoService';

const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
});

type FormValues = z.infer<typeof formSchema>;

interface PaginaEventoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  paginaToEdit?: PaginaEvento | null;
}

export default function PaginaEventoFormDialog({ open, onOpenChange, onSuccess, paginaToEdit }: PaginaEventoFormDialogProps) {
  const isEditMode = !!paginaToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '' },
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && paginaToEdit) {
        form.reset({ titulo: paginaToEdit.titulo });
      } else {
        form.reset({ titulo: '' });
      }
    }
  }, [open, isEditMode, paginaToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditMode && paginaToEdit) {
        await updatePaginaEvento(paginaToEdit.id, { titulo: values.titulo });
        toast.success('Página atualizada com sucesso!');
      } else {
        await createPaginaEvento({ titulo: values.titulo });
        toast.success('Nova página criada com sucesso!');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Falha ao ${isEditMode ? 'atualizar' : 'criar'} a página.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Página' : 'Adicionar Nova Página'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Altere os dados da página.' : 'Preencha os dados para criar uma nova página.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Boas-vindas ao Pub!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}