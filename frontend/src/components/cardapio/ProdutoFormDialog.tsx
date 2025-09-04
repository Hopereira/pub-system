// Caminho: frontend/src/components/cardapio/ProdutoFormDialog.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Usaremos um Textarea para a descrição
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Produto } from '@/types/produto';
import { CreateProdutoDto } from '@/types/produto.dto';
import { createProduto } from '@/services/produtoService';
import { getAmbientes, AmbienteData } from '@/services/ambienteService';

interface ProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (novoProduto: Produto) => void;
}

const initialFormData = {
    nome: '',
    descricao: '',
    preco: '' as number | '',
    categoria: '',
    ambienteId: ''
};

export default function ProdutoFormDialog({ open, onOpenChange, onSuccess }: ProdutoFormDialogProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchAmbientes = async () => {
        try {
          const data = await getAmbientes();
          setAmbientes(data);
        } catch (error) {
          setError("Não foi possível carregar os ambientes de preparo.");
        }
      };
      fetchAmbientes();
      setFormData(initialFormData); // Limpa o formulário ao abrir
      setError(null);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'preco' ? Number(value) : value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, ambienteId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.preco || !formData.categoria || !formData.ambienteId) {
        setError("Todos os campos são obrigatórios.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const produtoData: CreateProdutoDto = {
        ...formData,
        preco: Number(formData.preco)
    };

    try {
      const novoProduto = await createProduto(produtoData);
      onSuccess(novoProduto);
    } catch (err: any) {
      const apiError = err.response?.data?.message || 'Falha ao criar o produto.';
      setError(Array.isArray(apiError) ? apiError.join(', ') : apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do item para adicioná-lo ao cardápio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Erro na Submissão</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input id="preco" name="preco" type="number" value={formData.preco} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ambienteId">Ambiente de Preparo</Label>
              <Select onValueChange={handleSelectChange} value={formData.ambienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ambiente" />
                </SelectTrigger>
                <SelectContent>
                  {ambientes.map(ambiente => <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}