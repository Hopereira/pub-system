// frontend/src/app/(protected)/dashboard/admin/agenda-eventos/[id]/EventoFormPage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Evento } from '@/types/evento';
// ✅ MUDANÇA: Importamos a função de busca e o useEffect/useState
import { createEvento, updateEvento, getEventoById } from '@/services/eventoService';
import { useEffect, useState } from 'react';
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

const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
  descricao: z.string().optional().nullable(),
  dataEvento: z.date({ required_error: "A data do evento é obrigatória." }),
  hora: z.coerce.number().min(0, 'Hora inválida').max(23, 'Hora inválida'),
  minuto: z.coerce.number().min(0, 'Minuto inválido').max(59, 'Minuto inválido'),
  valor: z.coerce.number().min(0, "O valor não pode ser negativo.").default(0),
});

type FormValues = z.infer<typeof formSchema>;

// ✅ MUDANÇA: As props agora recebem o ID, não o objeto evento completo.
interface EventoFormPageProps {
  eventoId: string;
}

export default function EventoFormPage({ eventoId }: EventoFormPageProps) {
  const router = useRouter();
  const isEditMode = eventoId !== 'novo';

  // ✅ MUDANÇA: Adicionamos estados para controlar o carregamento e erros da busca.
  const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Só carrega se for modo de edição
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // ✅ MUDANÇA: Os valores padrão agora são simples, pois serão preenchidos depois.
    defaultValues: {
      titulo: '',
      descricao: '',
      valor: 0,
      hora: new Date().getHours(),
      minuto: new Date().getMinutes(),
    },
  });

  // ✅ MUDANÇA: Este useEffect busca os dados do evento quando a página carrega.
  useEffect(() => {
    // Se não estivermos no modo de edição, não há nada a fazer.
    if (!isEditMode) {
      return;
    }

    const fetchEvento = async () => {
      setIsLoadingData(true);
      setError(null);
      const eventoData = await getEventoById(eventoId);

      if (eventoData) {
        // Se encontrarmos o evento, usamos o form.reset para preencher o formulário.
        form.reset({
          ...eventoData,
          dataEvento: new Date(eventoData.dataEvento),
          hora: new Date(eventoData.dataEvento).getHours(),
          minuto: new Date(eventoData.dataEvento).getMinutes(),
        });
      } else {
        // Se a API retornar nulo, mostramos um erro.
        setError('Evento não encontrado.');
        toast.error('Evento não encontrado.');
      }
      setIsLoadingData(false);
    };

    fetchEvento();
  }, [eventoId, isEditMode, form.reset]); // Dependências do useEffect

  const onSubmit = async (values: FormValues) => {
    let dataFinal = setMinutes(setHours(values.dataEvento, values.hora), values.minuto);
    const payload = { ...values, dataEvento: dataFinal };

    try {
      if (isEditMode) { // A lógica de submissão não precisa do objeto 'eventoToEdit'
        await updateEvento(eventoId, payload);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await createEvento(payload);
        toast.success('Evento criado com sucesso!');
      }
      router.push('/dashboard/admin/agenda-eventos');
      router.refresh();
    } catch (error) {
      toast.error('Falha ao salvar o evento.');
      console.error("Erro ao submeter formulário de evento:", error);
    }
  };
  
  // ✅ MUDANÇA: Adicionamos uma tela de carregamento enquanto os dados são buscados.
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Carregando dados do evento...</span>
      </div>
    );
  }

  // Se houver um erro na busca, exibimos uma mensagem.
  if (error) {
      return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <Card className="max-w-3xl mx-auto my-6">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Altere os dados do evento abaixo.' : 'Preencha os dados para criar um novo evento na agenda.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            
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

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hora" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <FormControl><Input type="number" min="0" max="23" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="minuto" render={({ field }) => (
                <FormItem>
                  <FormLabel>Minuto</FormLabel>
                  <FormControl><Input type="number" min="0" max="59" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <FormField control={form.control} name="valor" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
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