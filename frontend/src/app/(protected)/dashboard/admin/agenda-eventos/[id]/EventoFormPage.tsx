// Caminho: frontend/src/app/(protected)/dashboard/admin/agenda-eventos/[id]/EventoFormPage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Evento } from '@/types/evento';
import { createEvento, updateEvento, getEventoById } from '@/services/eventoService';
import { getPaginasEvento } from '@/services/paginaEventoService';
import { PaginaEvento } from '@/types/pagina-evento';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// ✅ 1. CORREÇÃO NA VALIDAÇÃO
// A validação agora trata corretamente a opção "Nenhum" (que vem como a string "null").
const formSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório." }),
  descricao: z.string().optional().nullable(),
  dataEvento: z.date({ message: "A data do evento é obrigatória." }),
  hora: z.coerce.number().min(0, 'Hora inválida').max(23, 'Hora inválida'),
  minuto: z.coerce.number().min(0, 'Minuto inválido').max(59, 'Minuto inválido'),
  valor: z.coerce.number().min(0, "O valor não pode ser negativo.").default(0),
  paginaEventoId: z.preprocess(
    (val) => (val === "null" ? null : val), // Converte a string "null" para o valor null
    z.string().uuid("Seleção inválida.").nullable().optional()
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface EventoFormPageProps {
  eventoId: string;
}

export default function EventoFormPage({ eventoId }: EventoFormPageProps) {
  const router = useRouter();
  const isEditMode = eventoId !== 'novo';

  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [paginasEvento, setPaginasEvento] = useState<PaginaEvento[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      titulo: '',
      descricao: '',
      valor: 0,
      hora: 19,
      minuto: 0,
      paginaEventoId: null,
    },
  });

  useEffect(() => {
    const fetchPaginasEvento = async () => {
      try {
        const data = await getPaginasEvento();
        setPaginasEvento(data);
      } catch {
        toast.error("Não foi possível carregar a lista de temas.");
      }
    };
    fetchPaginasEvento();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setIsLoadingData(false); // Garante que o loading para no modo de criação
      return;
    }
    const fetchEvento = async () => {
      setIsLoadingData(true);
      const eventoData = await getEventoById(eventoId);
      if (eventoData) {
        form.reset({
          titulo: eventoData.titulo,
          descricao: eventoData.descricao || '',
          dataEvento: new Date(eventoData.dataEvento),
          hora: new Date(eventoData.dataEvento).getHours(),
          minuto: new Date(eventoData.dataEvento).getMinutes(),
          valor: eventoData.valor,
          paginaEventoId: eventoData.paginaEvento?.id || null,
        });
      } else {
        setError("Evento não encontrado.");
        toast.error("Evento não encontrado.");
      }
      setIsLoadingData(false);
    };
    fetchEvento();
  }, [eventoId, isEditMode, form]);

  const onSubmit = async (values: FormValues) => {
    const dataFinal = setMinutes(setHours(values.dataEvento, values.hora), values.minuto);

    // Monta payload apenas com os campos que o backend espera
    const payload = {
      titulo: values.titulo,
      descricao: values.descricao,
      dataEvento: dataFinal,
      valor: values.valor,
      paginaEventoId: values.paginaEventoId,
    };

    try {
      if (isEditMode) {
        await updateEvento(eventoId, payload);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await createEvento(payload);
        toast.success('Evento criado com sucesso!');
      }
      router.push('/dashboard/admin/agenda-eventos');
      router.refresh();
    } catch (error) {
      toast.error("Falha ao salvar o evento.");
    }
  };

  if (isLoadingData) {
    return <div className="text-center p-8">Carregando dados do evento...</div>
  }
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>
  }

  return (
    <Card className="max-w-3xl mx-auto my-6">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
        <CardDescription>
            {isEditMode ? "Altere os dados do evento." : "Preencha os dados para criar um novo evento na agenda."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            
            {/* ✅ 2. CAMPOS DO FORMULÁRIO RESTAURADOS */}
            <FormField control={form.control} name="titulo" render={({ field }) => ( <FormItem><FormLabel>Título do Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="descricao" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea className="resize-none" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>

            <FormField
              control={form.control}
              name="paginaEventoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema da Página de Boas-Vindas (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'null'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tema para a página de entrada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Nenhum</SelectItem>
                      {paginasEvento.map((pagina) => (
                        <SelectItem key={pagina.id} value={pagina.id}>
                          {pagina.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="dataEvento" render={({ field }) => ( 
                <FormItem className="flex flex-col"><FormLabel>Data do Evento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? ( format(field.value, "PPP", { locale: ptBR }) ) : ( <span>Escolha uma data</span> )}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> 
            )}/>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hora" render={({ field }) => ( <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="number" min="0" max="23" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="minuto" render={({ field }) => ( <FormItem><FormLabel>Minuto</FormLabel><FormControl><Input type="number" min="0" max="59" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            
            <FormField control={form.control} name="valor" render={({ field }) => ( <FormItem><FormLabel>Valor da Entrada/Couvert Artístico (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><p className="text-sm text-muted-foreground">Valor cobrado por pessoa ao entrar no evento. Deixe 0 para entrada gratuita.</p><FormMessage /></FormItem> )}/>

          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin/agenda-eventos')}>Cancelar</Button>
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