'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Empresa } from '@/types/empresa';
import { getEmpresa, createEmpresa, updateEmpresa } from '@/services/empresaService';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

// ✅ CORREÇÃO: Schema de validação agora inclui TODOS os seus campos.
const formSchema = z.object({
  nomeFantasia: z.string().min(2, 'O nome fantasia é obrigatório.'),
  razaoSocial: z.string().min(2, 'A razão social é obrigatória.'),
  cnpj: z.string().length(14, 'O CNPJ deve ter exatamente 14 caracteres numéricos.'),
  endereco: z.string().min(5, 'O endereço é obrigatório.'),
  telefone: z.string().min(10, 'O telefone é obrigatório.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      endereco: '',
      telefone: '',
    },
  });

  useEffect(() => {
    async function carregarDados() {
      setIsLoading(true);
      try {
        const dadosEmpresa = await getEmpresa();
        if (dadosEmpresa) {
          setEmpresa(dadosEmpresa);
          form.reset(dadosEmpresa);
        }
      } catch (error) {
        console.info("Nenhuma empresa encontrada para carregar. O formulário está em modo de criação.");
      } finally {
        setIsLoading(false);
      }
    }
    carregarDados();
  }, [form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      if (empresa) {
        const empresaAtualizada = await updateEmpresa(empresa.id, values);
        setEmpresa(empresaAtualizada);
        toast.success("Dados da empresa atualizados com sucesso.");
      } else {
        const novaEmpresa = await createEmpresa(values);
        setEmpresa(novaEmpresa);
        toast.success("Empresa cadastrada com sucesso.");
      }
    } catch (error) {
      toast.error("Falha ao salvar os dados da empresa.");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{empresa ? 'Configurações da Empresa' : 'Bem-vindo ao Pub System!'}</CardTitle>
        <CardDescription>
          {empresa 
            ? 'Atualize as informações principais do seu estabelecimento.' 
            : 'Cadastre as informações do seu estabelecimento para começar.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="nomeFantasia" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl><Input placeholder="Nome do seu Pub" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            {/* ✅ CORREÇÃO: Campo Razão Social adicionado */}
            <FormField control={form.control} name="razaoSocial" render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social</FormLabel>
                <FormControl><Input placeholder="Sua Empresa Ltda." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            <FormField control={form.control} name="cnpj" render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl><Input placeholder="Apenas os 14 números" {...field} disabled={!!empresa} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            {/* ✅ CORREÇÃO: Campo Endereço adicionado */}
            <FormField control={form.control} name="endereco" render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl><Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* ✅ CORREÇÃO: Campo Telefone adicionado */}
            <FormField control={form.control} name="telefone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {empresa ? 'Salvar Alterações' : 'Cadastrar Empresa'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}