// Caminho: frontend/src/app/entrada/[eventoId]/EntradaClienteFormulario.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

// Importações de Tipos e Serviços
import { Cliente } from '@/types/cliente'; 
import { Evento } from '@/types/evento'; 
import { PaginaEvento } from '@/types/pagina-evento';
import { createCliente, findOrCreateClient } from '@/services/clienteService';
import { abrirComandaPublica } from '@/services/comandaService';

// Componentes de UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

// DEFINIÇÕES NO ESCOPO CORRETO
const formSchema = z.object({
  nome: z.string().min(3, { message: 'Por favor, insira o seu nome completo.' }),
  cpf: z.string().min(14, { message: 'CPF inválido.' }).max(14, { message: 'CPF inválido.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }).optional().or(z.literal('')),
  celular: z.string().min(10, { message: 'O celular deve ter pelo menos 10 dígitos.' }).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof formSchema>;

// Função para formatar CPF enquanto digita
const formatarCpf = (valor: string) => {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
};

interface EntradaClienteFormularioProps {
  evento: Evento | null; 
  paginaEvento: PaginaEvento;
  mesaId?: string;
}

export default function EntradaClienteFormulario({ evento, paginaEvento, mesaId }: EntradaClienteFormularioProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ BLOCO DE PROTEÇÃO DE NÍVEL SUPERIOR
  if (!evento) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <p className="text-xl text-red-600">Erro ao carregar evento. O link pode estar incorreto ou o evento está inativo.</p>
          </div>
      );
  }
  
  // ✅ CORREÇÃO FINAL: Garantir que o valor seja um número ANTES de usar toFixed
  const valorEntrada = Number(evento.valor) || 0; 

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
      // Remove máscara do CPF antes de enviar
      const valuesComCpfLimpo = {
        ...values,
        cpf: values.cpf.replace(/\D/g, ''),
      };
      const novoCliente = await findOrCreateClient(valuesComCpfLimpo);

      // ✅ Se paginaEvento.id estiver vazio, significa que é um fallback virtual
      // Nesse caso, não enviar paginaEventoId - apenas o eventoId é suficiente
      const novaComanda = await abrirComandaPublica({
        clienteId: novoCliente.id,
        mesaId: mesaId,
        paginaEventoId: paginaEvento.id || undefined, // Não enviar ID vazio
        eventoId: evento.id, 
      });

      toast.success(`Bem-vindo(a), ${novoCliente.nome}! Sua comanda foi aberta com sucesso.`);
      
      router.push(`/portal-cliente/${novaComanda.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao tentar acessar. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {valorEntrada > 0 && (
                <span className="block font-semibold text-red-600 mt-1">
                    Taxa de Entrada/Cover Artístico: R$ {valorEntrada.toFixed(2).replace('.', ',')}
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
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="000.000.000-00" 
                        maxLength={14}
                        value={field.value}
                        onChange={(e) => field.onChange(formatarCpf(e.target.value))}
                      />
                    </FormControl>
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

              {/* Link para recuperar comanda */}
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground mb-2">Já tem uma comanda aberta?</p>
                <Link href="/recuperar-comanda">
                  <Button variant="outline" type="button" className="w-full">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Recuperar Minha Comanda
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}