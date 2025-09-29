'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Produto } from '@/types/produto';
import { createProduto, updateProduto, uploadProdutoMedia } from '@/services/produtoService';
import { AmbienteData } from '@/services/ambienteService';
import { UpdateProdutoDto } from '@/types/produto.dto';

interface ProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  produtoToEdit?: Produto | null;
  ambientesDePreparo: AmbienteData[];
}

const formSchema = z.object({
  nome: z.string().min(2, { message: "O nome é obrigatório." }),
  descricao: z.string().optional(),
  categoria: z.string().min(2, { message: "A categoria é obrigatória." }),
  preco: z.coerce.number().positive({ message: "O preço deve ser um número positivo." }),
  ambienteId: z.string({ required_error: "Por favor, selecione um ambiente." }).uuid({ message: "Seleção de ambiente inválida."}),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProdutoFormDialog({ open, onOpenChange, onSuccess, produtoToEdit, ambientesDePreparo }: ProdutoFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const isEditMode = !!produtoToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', descricao: '', preco: 0, categoria: '', ambienteId: undefined },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      setImagemFile(null);
      if (isEditMode && produtoToEdit) {
        form.reset({
            nome: produtoToEdit.nome,
            descricao: produtoToEdit.descricao || '',
            preco: produtoToEdit.preco,
            categoria: produtoToEdit.categoria,
            ambienteId: produtoToEdit.ambiente?.id,
        });
      } else {
        form.reset({
            nome: '',
            descricao: '',
            preco: 0,
            categoria: '',
            ambienteId: ambientesDePreparo[0]?.id || undefined,
        });
      }
    }
  }, [open, isEditMode, produtoToEdit, form, ambientesDePreparo]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    // ALTERAÇÃO: Linha removida daqui. A biblioteca gere isto.

    try {
      if (isEditMode && produtoToEdit) {
        // --- FLUXO DE ATUALIZAÇÃO ---
        const dadosAtualizacao: UpdateProdutoDto = values;
        const produtoAtualizado = await updateProduto(produtoToEdit.id, dadosAtualizacao);
        toast.success('Dados do produto atualizados!');

        if (imagemFile) {
          await uploadProdutoMedia(produtoAtualizado.id, imagemFile);
          toast.success('Imagem atualizada com sucesso!');
        }
      } else {
        // --- FLUXO DE CRIAÇÃO ---
        const novoProduto = await createProduto(values);
        toast.success('Produto criado com sucesso!');

        if (imagemFile && novoProduto.id) {
          await uploadProdutoMedia(novoProduto.id, imagemFile);
          toast.success('Imagem enviada com sucesso!');
        }
      }
      onSuccess();
    } catch (err: any) {
      const apiErrorMessages = err.response?.data?.message;
      const displayError = Array.isArray(apiErrorMessages) 
        ? apiErrorMessages.join('. ') 
        : apiErrorMessages || `Falha na operação.`;
      setError(displayError);
      toast.error(displayError);
    } 
    // ALTERAÇÃO: Linha removida do 'finally'. A biblioteca gere isto.
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
                {error && ( <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Erro na Submissão</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> )}
                <FormField control={form.control} name="nome" render={({ field }) => ( <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="descricao" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormItem>
                  <FormLabel>Imagem do Produto (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImagemFile(file);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormField control={form.control} name="categoria" render={({ field }) => ( <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input placeholder="Ex: Bebidas, Petiscos" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="preco" render={({ field }) => ( <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="ambienteId" render={({ field }) => ( <FormItem><FormLabel>Ambiente de Preparo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um ambiente" /></SelectTrigger></FormControl><SelectContent>{ambientesDePreparo.map(ambiente => <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}