// Caminho: frontend/src/components/funcionarios/FuncionarioFormDialog.tsx

'use client';

import React, { useState } from 'react';
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
import { Funcionario } from '@/types/funcionario';
import { CreateFuncionarioDto } from '@/types/funcionario.dto';
import { createFuncionario } from '@/services/funcionarioService';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

interface FuncionarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newFuncionario: Funcionario) => void;
}

const cargos = ['ADMIN', 'GARCOM', 'CAIXA', 'COZINHA'];

export default function FuncionarioFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: FuncionarioFormDialogProps) {
  const [formData, setFormData] = useState<CreateFuncionarioDto>({
    nome: '',
    email: '',
    senha: '',
    cargo: 'GARCOM',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHA') => {
    setFormData((prev) => ({ ...prev, cargo: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senha) {
      setError("O campo senha é obrigatório.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const newFuncionario = await createFuncionario(formData);
      onSuccess(newFuncionario); // Notifica o componente pai sobre o sucesso
    } catch (err: any) {
      // --- REATORAÇÃO AQUI ---
      // Primeiro, verificamos se o erro é de conflito (e-mail duplicado)
      if (err.response?.status === 409) {
        setError("Este e-mail já está cadastrado. Por favor, utilize outro.");
      } else {
        // Se for outro tipo de erro, usamos a mensagem genérica da API como antes
        const apiError = err.response?.data?.message || 'Falha ao criar funcionário. Verifique os dados e tente novamente.';
        setError(Array.isArray(apiError) ? apiError.join(', ') : apiError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo membro na equipe.
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">Nome</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">E-mail</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senha" className="text-right">Senha</Label>
              <Input id="senha" name="senha" type="password" value={formData.senha} onChange={handleChange} className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cargo" className="text-right">Cargo</Label>
              <Select onValueChange={handleSelectChange} defaultValue={formData.cargo}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map(cargo => <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Funcionário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}