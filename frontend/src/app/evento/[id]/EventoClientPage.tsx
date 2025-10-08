'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

import { PaginaEvento } from '@/types/pagina-evento';
import { createCliente } from '@/services/clienteService';
import { abrirComanda } from '@/services/comandaService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'Por favor, insira o seu nome completo.' }),
  cpf: z.string().length(11, { message: 'O CPF deve ter 11 dígitos (apenas números).' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }).optional().or(z.literal('')),
  celular: z.string().min(10, { message: 'O celular deve ter pelo menos 10 dígitos.' }).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof formSchema>;

interface EventoClientPageProps {
  paginaEvento: PaginaEvento;
  mesaId?: string;
}

export default function EventoClientPage({ paginaEvento, mesaId }: EventoClientPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', cpf: '', email: '', celular: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const novoCliente = await createCliente({
        nome: values.nome,
        cpf: values.cpf,
        email: values.email,
        celular: values.celular,
      });

      const novaComanda = await abrirComanda({
        clienteId: novoCliente.id,
        mesaId: mesaId,
      });
      
      toast.success(`Bem-vindo(a), ${novoCliente.nome || 'Cliente'}! Comanda aberta.`);

      router.push(`/portal-cliente/${novaComanda.id}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao fazer o cadastro. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="p-0">
          <div className="relative w-full h-48">
            <Image
              src={paginaEvento.urlImagem || '/placeholder.png'}
              alt={paginaEvento.titulo}
              fill
              className="rounded-t-lg object-cover"
            />
          </div>
          <div className="p-6">
            <CardTitle className="text-2xl">{paginaEvento.titulo}</CardTitle>
            <CardDescription>Para começar, por favor, preencha os seus dados abaixo.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (apenas números)</FormLabel>
                    <FormControl><Input type="number" placeholder="12345678900" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl><Input type="email" placeholder="seu.email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular (Opcional)</FormLabel>
                    <FormControl><Input type="number" placeholder="21999998888" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Aguarde...' : 'Criar Acesso e Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}