'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

// Certifique-se de que você tem um tipo Evento ou use 'any'
import { Evento } from '@/types/evento'; 
import { PaginaEvento } from '@/types/pagina-evento';
import { createCliente, findOrCreateClient } from '@/services/clienteService';
import { abrirComandaPublica } from '@/services/comandaService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

// ... (Resto do FormSchema e FormValues) ...

interface EntradaClienteFormularioProps {
  // ✅ Incluir o objeto Evento completo
  evento: Evento; 
  paginaEvento: PaginaEvento;
  mesaId?: string;
}

// ✅ Componente renomeado
export default function EntradaClienteFormulario({ evento, paginaEvento, mesaId }: EntradaClienteFormularioProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      email: '',
      celular: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Lógica Buscar ou Criar Cliente
      const novoCliente = await findOrCreateClient(values);

      // 2. Criação da Comanda
      const novaComanda = await abrirComandaPublica({
        clienteId: novoCliente.id,
        mesaId: mesaId,
        paginaEventoId: paginaEvento.id,
        // ✅ CORREÇÃO CRÍTICA: Passamos o ID do Evento para que o backend cobre a entrada
        eventoId: evento.id, 
      });

      toast.success(`Bem-vindo(a), ${novoCliente.nome}! Sua comanda foi aberta com sucesso.`);
      
      // 3. Redirecionar para o portal do cliente
      router.push(`/cliente/comanda/${novaComanda.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao tentar acessar. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (o restante da renderização do componente) ...

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">{evento.titulo}</CardTitle>
          {paginaEvento.urlImagem && (
            <div className="relative h-40 w-full overflow-hidden rounded-lg mt-4">
              <Image 
                src={paginaEvento.urlImagem} 
                alt={evento.titulo} 
                fill 
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <CardDescription className="text-md mt-4">
            Preencha seus dados para abrir sua comanda e acesso ao evento.
            {evento.valor > 0 && (
                <span className="block font-semibold text-red-600 mt-1">
                    Taxa de Entrada/Cover Artístico: R$ {evento.valor.toFixed(2).replace('.', ',')}
                </span>
            )}
            {mesaId && <span className="block text-lg font-bold mt-2">Você está na Mesa: {mesaId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input type="text" placeholder="Seu nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (Apenas números)</FormLabel>
                    <FormControl><Input type="text" placeholder="12345678900" {...field} /></FormControl>
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
                    <FormControl><Input type="text" placeholder="21999998888" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Aguarde...' : 'Criar Acesso e Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}