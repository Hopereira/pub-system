// src/components/eventos/EventoFormDialog.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Evento } from '@/types/evento';
import { createEvento, updateEvento } from '@/services/eventoService';

interface EventoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  eventoToEdit?: Evento | null;
}

// Schema de validação do formulário
const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
  descricao: z.string().optional(),
  dataEvento: z.date({
    required_error: "A data e hora do evento são obrigatórias.",
  }),
  valor: z.coerce.number().min(0, { message: "O valor não pode ser negativo." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventoFormDialog({ open, onOpenChange, onSuccess, eventoToEdit }: EventoFormDialogProps) {
  const isEditMode = !!eventoToEdit;
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      dataEvento: undefined,
      valor: 0,
    },
  });

  // Preenche o formulário ao abrir em modo de edição
  useEffect(() => {
    if (open) {
      setApiError(null); // Limpa erros anteriores ao abrir
      if (isEditMode && eventoToEdit) {
        form.reset({
          titulo: eventoToEdit.titulo,
          descricao: eventoToEdit.descricao || '',
          dataEvento: new Date(eventoToEdit.dataEvento),
          valor: eventoToEdit.valor,
        });
      } else {
        form.reset({
          titulo: '',
          descricao: '',
          dataEvento: undefined,
          valor: 0,
        });
      }
    }
  }, [open, isEditMode, eventoToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      if (isEditMode && eventoToEdit) {
        await updateEvento(eventoToEdit.id, values);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await createEvento(values);
        toast.success('Novo evento criado com sucesso!');
      }
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o evento.`;
      const displayError = Array.isArray(errorMessage) ? errorMessage.join('. ') : errorMessage;
      setApiError(displayError);
      toast.error(displayError);
    }
  };

  return (
    // CORREÇÃO: onOpen-Change para onOpenChange
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Altere os dados do evento.' : 'Preencha os dados para criar um novo evento na agenda.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {apiError && (
              <Alert variant="destructive">
                <AlertTitle>Erro ao Salvar</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Evento</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataEvento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data e Hora do Evento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP 'às' HH:mm", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      {/* Adicionar input de hora aqui se necessário no futuro */}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}