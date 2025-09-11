// Caminho: frontend/src/components/cardapio/ProdutoFormDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ... (outros imports)
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

import { Produto } from '@/types/produto';
import { CreateProdutoDto, UpdateProdutoDto } from '@/types/produto.dto';
import { createProduto, updateProduto } from '@/services/produtoService';
import { AmbienteData } from '@/services/ambienteService';

// ALTERADO: A interface de props agora recebe a lista de ambientes
interface ProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (produto: Produto) => void;
  produtoToEdit?: Produto | null;
  ambientesDePreparo: AmbienteData[]; // <-- NOVO PROP
}

const formSchema = z.object({
  nome: z.string().min(2, { message: "O nome é obrigatório." }),
  descricao: z.string().optional(),
  categoria: z.string().min(2, { message: "A categoria é obrigatória." }),
  preco: z.coerce.number().positive({ message: "O preço deve ser um número positivo." }),
  ambienteId: z.string({ required_error: "Por favor, selecione um ambiente." }),
});

type FormValues = z.infer<typeof formSchema>;

// ALTERADO: A função agora recebe a prop 'ambientesDePreparo'
export default function ProdutoFormDialog({ open, onOpenChange, onSuccess, produtoToEdit, ambientesDePreparo }: ProdutoFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!produtoToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', descricao: '', preco: '' as any, categoria: '', ambienteId: '' },
  });

  useEffect(() => {
    // REMOVIDO: A lógica de buscar ambientes foi removida daqui
    if (open) {
      setError(null);
      if (isEditMode && produtoToEdit) {
        form.reset({
            nome: produtoToEdit.nome,
            descricao: produtoToEdit.descricao || '',
            preco: produtoToEdit.preco,
            categoria: produtoToEdit.categoria,
            ambienteId: produtoToEdit.ambiente.id
        });
      } else {
        form.reset({
            nome: '', descricao: '', preco: '' as any, categoria: '', ambienteId: ''
        });
      }
    }
  }, [open, isEditMode, produtoToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      let result: Produto;
      if (isEditMode && produtoToEdit) {
        result = await updateProduto(produtoToEdit.id, values as UpdateProdutoDto);
      } else {
        result = await createProduto(values as CreateProdutoDto);
      }
      onSuccess(result);
    } catch (err: any) {
      const apiError = err.response?.data?.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o produto.`;
      setError(Array.isArray(apiError) ? apiError.join(', ') : apiError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Altere os dados do item do cardápio.' : 'Preencha os dados para adicioná-lo ao cardápio.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                {error && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Erro na Submissão</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <FormField control={form.control} name="nome" render={({ field }) => ( <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="descricao" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="categoria" render={({ field }) => ( <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input placeholder="Ex: Bebidas, Petiscos" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="preco" render={({ field }) => ( <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                
                {/* ALTERADO: O Select agora usa a prop 'ambientesDePreparo' */}
                <FormField control={form.control} name="ambienteId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ambiente de Preparo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione um ambiente" /></SelectTrigger></FormControl>
                            <SelectContent>{ambientesDePreparo.map(ambiente => <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>

                <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}