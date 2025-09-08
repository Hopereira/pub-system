// Caminho: frontend/src/app/(protected)/dashboard/empresa/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { createOrUpdateEmpresa, getEmpresa } from "@/services/empresaService";

// NOVO: Schema de validação com Zod
const formSchema = z.object({
  id: z.string().optional(),
  nomeFantasia: z.string().min(2, { message: 'O nome fantasia é obrigatório.' }),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EmpresaPage = () => {
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

  const { isSubmitting, isDirty } = form.formState;
  const id = form.watch('id'); // Observa o campo 'id' para lógica dinâmica

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const data = await getEmpresa();
        if (data) {
          form.reset(data); // Preenche todo o formulário de uma só vez
        }
      } catch (error) {
        toast.error('Erro ao carregar os dados da empresa.');
      }
    };
    carregarDados();
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const empresaSalva = await createOrUpdateEmpresa(values);
      form.reset(empresaSalva); // Atualiza o formulário com os dados salvos (incluindo o novo ID, se for o caso)
      toast.success("Sucesso!", {
        description: "Os dados da empresa foram salvos com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível salvar os dados da empresa.";
      toast.error("Erro", {
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Empresa</CardTitle>
        <CardDescription>
          Atualize as informações principais do seu estabelecimento. Estes dados serão utilizados em relatórios e notas.
        </CardDescription>
      </CardHeader>
      
      {/* FORMULÁRIO REFATORADO */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <FormLabel className="md:text-right">Nome Fantasia</FormLabel>
                    <FormControl className="md:col-span-3">
                      <Input placeholder="Ex: Pub do Rock" {...field} />
                    </FormControl>
                    <FormMessage className="md:col-start-2 md:col-span-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <FormLabel className="md:text-right">Razão Social</FormLabel>
                    <FormControl className="md:col-span-3">
                      <Input placeholder="Ex: Pereira & Cia Ltda" {...field} />
                    </FormControl>
                    <FormMessage className="md:col-start-2 md:col-span-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <FormLabel className="md:text-right">CNPJ</FormLabel>
                    <FormControl className="md:col-span-3">
                      <Input placeholder="00.000.000/0001-00" {...field} disabled={!!id} />
                    </FormControl>
                    <FormMessage className="md:col-start-2 md:col-span-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <FormLabel className="md:text-right">Endereço</FormLabel>
                    <FormControl className="md:col-span-3">
                      <Input placeholder="Rua das Cervejas, 123" {...field} />
                    </FormControl>
                    <FormMessage className="md:col-start-2 md:col-span-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <FormLabel className="md:text-right">Telefone</FormLabel>
                    <FormControl className="md:col-span-3">
                      <Input type="tel" placeholder="(21) 98765-4321" {...field} />
                    </FormControl>
                    <FormMessage className="md:col-start-2 md:col-span-3" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Cadastrar Empresa')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default EmpresaPage;