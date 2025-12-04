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
// ✅ ADIÇÃO: Funções para manipular a data e hora
import { format, setHours, setMinutes } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Evento } from '@/types/evento';
import { createEvento, updateEvento } from '@/services/eventoService';
import { CreateEventoDto, UpdateEventoDto } from '@/types/evento.dto';

interface EventoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  eventoToEdit?: Evento | null;
}

// ✅ ALTERAÇÃO: Adicionamos hora e minuto ao schema de validação
const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
  descricao: z.string().optional().nullable(),
  dataEvento: z.date({ message: "A data do evento é obrigatória." }),
  hora: z.coerce.number().min(0, { message: 'Hora deve ser no mínimo 0' }).max(23, { message: 'Hora deve ser no máximo 23' }),
  minuto: z.coerce.number().min(0, { message: 'Minuto deve ser no mínimo 0' }).max(59, { message: 'Minuto deve ser no máximo 59' }),
  valor: z.coerce.number().min(0, { message: "O valor não pode ser negativo." }).default(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventoFormDialog({ open, onOpenChange, onSuccess, eventoToEdit }: EventoFormDialogProps) {
  const isEditMode = !!eventoToEdit;
  const [apiError, setApiError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    // ✅ ALTERAÇÃO: Adicionamos valores padrão para hora e minuto
    defaultValues: {
      titulo: '',
      descricao: '',
      valor: 0,
      hora: 0,
      minuto: 0,
    },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (isEditMode && eventoToEdit) {
        const data = new Date(eventoToEdit.dataEvento);
        form.reset({
          titulo: eventoToEdit.titulo,
          descricao: eventoToEdit.descricao || '',
          dataEvento: data,
          // ✅ ALTERAÇÃO: Preenche os campos de hora e minuto ao editar
          hora: data.getHours(),
          minuto: data.getMinutes(),
          valor: eventoToEdit.valor,
        });
      } else {
        const agora = new Date();
        form.reset({
          titulo: '',
          descricao: '',
          dataEvento: undefined,
          // ✅ ALTERAÇÃO: Sugere a hora e minuto atuais para um novo evento
          hora: agora.getHours(),
          minuto: agora.getMinutes(),
          valor: 0,
        });
      }
    }
  }, [open, isEditMode, eventoToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    
    // ✅ ALTERAÇÃO: Combinamos a data do calendário com a hora e os minutos dos inputs
    let dataFinal = values.dataEvento;
    dataFinal = setHours(dataFinal, values.hora);
    dataFinal = setMinutes(dataFinal, values.minuto);
    
    const payload = {
      titulo: values.titulo,
      descricao: values.descricao,
      dataEvento: dataFinal, // Usamos a data combinada
      valor: values.valor,
    };
    
    console.log("Enviando para a API com data e hora combinadas:", payload);

    try {
      if (isEditMode && eventoToEdit) {
        await updateEvento(eventoToEdit.id, payload as UpdateEventoDto);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await createEvento(payload as CreateEventoDto);
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
            
            <FormField control={form.control} name="titulo" render={({ field }) => ( <FormItem><FormLabel>Título do Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="descricao" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea className="resize-none" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>

            <FormField
              control={form.control}
              name="dataEvento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? ( format(field.value, "PPP", { locale: ptBR }) ) : ( <span>Escolha uma data</span> )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ NOVO: Campos para Hora e Minuto */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="23" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minuto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minuto</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {form.formState.isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> ) : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}