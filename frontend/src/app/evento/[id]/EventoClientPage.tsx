// Caminho: frontend/src/app/evento/[id]/EventoClientPage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

import { Cliente } from '@/types/cliente'; // Importar Cliente
import { PaginaEvento } from '@/types/pagina-evento';
// ✅ IMPORTAÇÕES CORRIGIDAS: Agora inclui getClienteByCpf
import { createCliente, getClienteByCpf } from '@/services/clienteService'; 
import { abrirComandaPublica } from '@/services/comandaService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'Por favor, insira o seu nome completo.' }),
  cpf: z.string().length(11, { message: 'O CPF deve ter 11 dígitos (apenas números).' }).regex(/^\d+$/, 'CPF deve conter apenas números.'),
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

  // ✅ NOVA FUNÇÃO: Trata a lógica de buscar um cliente existente ou criar um novo
  const findOrCreateClient = async (values: FormValues): Promise<Cliente> => {
    // 1. Tenta buscar o cliente pelo CPF
    try {
      const clienteExistente = await getClienteByCpf(values.cpf);
      return clienteExistente; // Cliente encontrado, retorna o objeto existente
    } catch (error: any) {
      // 2. Se a busca retornar 404 (cliente não encontrado), cria um novo
      if (error.response?.status === 404) {
        // Se não existir, criamos um novo com os dados fornecidos
        const novoCliente = await createCliente({
            nome: values.nome,
            cpf: values.cpf,
            email: values.email || undefined,
            celular: values.celular || undefined,
        });
        return novoCliente;
      }
      // Para qualquer outro erro de busca (500, etc.), lança o erro
      throw error; 
    }
  };


  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    let clienteFinal: Cliente;

    try {
      // ✅ PASSO 1: Busca o cliente existente ou cria um novo.
      // Isto resolve o erro 409 (Conflict).
      clienteFinal = await findOrCreateClient(values);
      
      // ✅ PASSO 2: ABRIR NOVA COMANDA
      // O backend (comanda.service.ts) agora permite que um cliente abra uma nova comanda 
      // (sem mesa) mesmo que tenha uma anterior aberta.
      const novaComanda = await abrirComandaPublica({
        clienteId: clienteFinal.id,
        mesaId: mesaId,
        paginaEventoId: paginaEvento.id,
        // Se este evento estiver ligado à Agenda e cobrar entrada, adicione o eventoId aqui:
        // eventoId: 'ID_DO_EVENTO_AQUI_SE_NECESSARIO', 
      });
      
      toast.success(`Bem-vindo(a), ${clienteFinal.nome || 'Cliente'}! Comanda aberta.`);

      router.push(`/portal-cliente/${novaComanda.id}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao criar a sua sessão. Tente novamente.';
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