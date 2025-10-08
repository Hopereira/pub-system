'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Evento } from '@/types/evento';
import { createEvento, updateEvento } from '@/services/eventoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Reutilizamos o mesmo schema de validação
const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
  descricao: z.string().optional().nullable(),
  dataEvento: z.date({ required_error: "A data do evento é obrigatória." }),
  hora: z.coerce.number().min(0).max(23),
  minuto: z.coerce.number().min(0).max(59),
  valor: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface EventoFormPageProps {
  eventoToEdit: Evento | null;
}

export default function EventoFormPage({ eventoToEdit }: EventoFormPageProps) {
  const router = useRouter();
  const isEditMode = !!eventoToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode && eventoToEdit
      ? {
          ...eventoToEdit,
          dataEvento: new Date(eventoToEdit.dataEvento),
          hora: new Date(eventoToEdit.dataEvento).getHours(),
          minuto: new Date(eventoToEdit.dataEvento).getMinutes(),
        }
      : {
          titulo: '',
          descricao: '',
          valor: 0,
          hora: new Date().getHours(),
          minuto: new Date().getMinutes(),
        },
  });

  const onSubmit = async (values: FormValues) => {
    let dataFinal = setMinutes(setHours(values.dataEvento, values.hora), values.minuto);
    const payload = { ...values, dataEvento: dataFinal };

    try {
      if (isEditMode && eventoToEdit) {
        await updateEvento(eventoToEdit.id, payload);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await createEvento(payload);
        toast.success('Evento criado com sucesso!');
      }
      router.push('/dashboard/admin/agenda-eventos'); // Volta para a lista
      router.refresh(); // Força a atualização dos dados na página da lista
    } catch (error) {
      toast.error('Falha ao salvar o evento.');
      console.error("Erro ao submeter formulário de evento:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Altere os dados do evento abaixo.' : 'Preencha os dados para criar um novo evento na agenda.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Campos do formulário (FormField para titulo, descricao, dataEvento, hora, minuto, valor) */}
            {/* ... (Cole aqui os seus FormFields que estavam no EventoFormDialog) ... */}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Evento'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}