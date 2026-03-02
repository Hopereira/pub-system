// Caminho: frontend/src/app/evento/[id]/EventoClientPage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

import { Cliente } from '@/types/cliente'; // Importar Cliente
// Assumindo que você tem um tipo Evento
import { Evento } from '@/types/evento'; 
import { PaginaEvento } from '@/types/pagina-evento';
// ✅ IMPORTAÇÕES CORRIGIDAS: Agora inclui a lógica Buscar ou Criar
import { createCliente, getClienteByCpf } from '@/services/clienteService'; 
import { abrirComandaPublica } from '@/services/comandaService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

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

interface EventoClientPageProps {
  // ✅ ADICIONADO: Agora este componente recebe o objeto Evento completo
  evento?: Evento; 
  paginaEvento: PaginaEvento;
  mesaId?: string;
}

export default function EventoClientPage({ evento, paginaEvento, mesaId }: EventoClientPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', cpf: '', email: '', celular: '' },
  });

  // ✅ LÓGICA DE BUSCAR OU CRIAR CLIENTE (COPIADA DE NOSSA CORREÇÃO ANTERIOR)
  const findOrCreateClient = async (values: FormValues): Promise<Cliente> => {
    // Remove máscara do CPF antes de enviar
    const cpfLimpo = values.cpf.replace(/\D/g, '');
    try {
      const clienteExistente = await getClienteByCpf(cpfLimpo);
      return clienteExistente; 
    } catch (error: any) {
      if (error.response?.status === 404) {
        const novoCliente = await createCliente({
            nome: values.nome,
            cpf: cpfLimpo,
            email: values.email || undefined,
            celular: values.celular || undefined,
        });
        return novoCliente;
      }
      throw error; 
    }
  };


  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    let clienteFinal: Cliente;

    try {
      // ✅ PASSO 1: Busca ou Cria o Cliente (resolve o 409)
      clienteFinal = await findOrCreateClient(values);
      
      // ✅ PASSO 2: ABRIR NOVA COMANDA
      const novaComanda = await abrirComandaPublica({
        clienteId: clienteFinal.id,
        mesaId: mesaId,
        paginaEventoId: paginaEvento.id,
        // ✅ CORREÇÃO CRÍTICA AQUI: Envia o ID do Evento se ele existir
        eventoId: evento ? evento.id : undefined, 
      });
      
      toast.success(`Bem-vindo(a), ${clienteFinal.nome || 'Cliente'}! Comanda aberta.`);

      router.push(`/portal-cliente/${novaComanda.id}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao criar a sua sessão. Tente novamente.';
      
      // ✅ TRATAR CASO DE COMANDA JÁ ABERTA - extrair ID e redirecionar
      if (error.response?.status === 400 && errorMessage.includes('já possui uma comanda aberta')) {
        // Extrair ID da comanda do formato: "...comanda aberta (ID: uuid). Por favor..."
        const match = errorMessage.match(/\(ID:\s*([a-f0-9-]+)\)/i);
        if (match && match[1]) {
          toast.info(`Você já possui uma comanda aberta. Redirecionando...`);
          router.push(`/portal-cliente/${match[1]}`);
          return;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const valorEntrada = evento?.valor || 0; // Pega o valor se o objeto evento existir

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Moderna */}
      <div className="mb-8">
        <div className="relative w-full h-[50vh] min-h-[300px]">
          <Image
            src={paginaEvento.urlImagem || '/placeholder.png'}
            alt={paginaEvento.titulo}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {valorEntrada > 0 && (
            <div className="absolute top-6 right-6">
              <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm font-bold">
                Entrada: R$ {valorEntrada.toFixed(2).replace('.', ',')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="container max-w-md mx-auto px-4 -mt-24 relative z-10">
        <Card className="shadow-2xl border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{paginaEvento.titulo}</CardTitle>
            <CardDescription>
              Para começar, por favor, preencha os seus dados abaixo.
            </CardDescription>
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
    </div>
  );
}