// Caminho: frontend/src/app/evento/[id]/EventoClientPage.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { PaginaEventoData } from '@/services/paginaEventoService';
import { createCliente } from '@/services/clienteService'; // <-- Importamos o nosso novo serviço
import { abrirComanda } from '@/services/comandaService'; // <-- E o serviço de comanda
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

// Schema de validação para o formulário
const formSchema = z.object({
  nome: z.string().min(3, { message: 'Por favor, insira o seu nome completo.' }),
  cpf: z.string().length(11, { message: 'O CPF deve ter 11 dígitos (apenas números).' }),
});
type FormValues = z.infer<typeof formSchema>;

interface EventoClientPageProps {
  paginaEvento: PaginaEventoData;
  mesaId?: string;
}

export default function EventoClientPage({ paginaEvento, mesaId }: EventoClientPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', cpf: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Passo 1: Criar o cliente
      const novoCliente = await createCliente({
        nome: values.nome,
        cpf: values.cpf,
      });

      // Passo 2: Criar a comanda associada ao novo cliente e, se existir, à mesa
      const novaComanda = await abrirComanda({
        clienteId: novoCliente.id,
        mesaId: mesaId, // Passa o mesaId, que pode ser undefined
      });
      
      toast.success(`Bem-vindo(a), ${novoCliente.nome}! Comanda aberta.`);

      // Passo 3: Redirecionar para a página do cardápio/comanda
      // (Vamos precisar de criar esta página a seguir)
      router.push(`/cardapio/${novaComanda.id}`);

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
              src={paginaEvento.urlImagem}
              alt={paginaEvento.titulo}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Aguarde...' : 'Entrar e Ver Cardápio'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}