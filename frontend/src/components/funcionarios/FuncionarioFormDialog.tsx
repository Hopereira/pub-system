// Caminho: frontend/src/components/funcionarios/FuncionarioFormDialog.tsx

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
import { Funcionario, CargoType, CARGO_LABELS } from '@/types/funcionario';
import { createFuncionario, updateFuncionario } from '@/services/funcionarioService';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '@/types/funcionario.dto';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

// Cargos disponíveis para seleção (GERENTE incluído)
const CARGOS_DISPONIVEIS: CargoType[] = ['ADMIN', 'GERENTE', 'CAIXA', 'GARCOM', 'COZINHEIRO', 'COZINHA', 'BARTENDER'];

interface FuncionarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (funcionario: Funcionario) => void;
  funcionarioToEdit?: Funcionario | null;
}

const initialFormData: CreateFuncionarioDto = { nome: '', email: '', senha: '', cargo: 'GARCOM', telefone: '', endereco: '', fotoUrl: '' };

export default function FuncionarioFormDialog({
  open,
  onOpenChange,
  onSuccess,
  funcionarioToEdit,
}: FuncionarioFormDialogProps) {
  const [formData, setFormData] = useState<CreateFuncionarioDto | UpdateFuncionarioDto>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!funcionarioToEdit;

  // NOVO: useEffect para preencher o formulário quando estiver em modo de edição
  useEffect(() => {
    // Limpa erros e dados antigos quando o modal é aberto
    if (open) {
      if (isEditMode && funcionarioToEdit) {
        setFormData({
          nome: funcionarioToEdit.nome,
          email: funcionarioToEdit.email,
          cargo: funcionarioToEdit.cargo,
          telefone: funcionarioToEdit.telefone || '',
          endereco: funcionarioToEdit.endereco || '',
          fotoUrl: funcionarioToEdit.fotoUrl || '',
          senha: '', // Senha fica vazia por segurança e para ser opcional
        });
      } else {
        setFormData(initialFormData); // Limpa o formulário para criação
      }
      setError(null);
    }
  }, [funcionarioToEdit, open, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: CargoType) => {
    setFormData((prev) => ({ ...prev, cargo: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let result: Funcionario;
      if (isEditMode && funcionarioToEdit) {
        // Se a senha não for preenchida na edição, não a enviamos
        const dataToUpdate: UpdateFuncionarioDto = { ...formData };
        if (!dataToUpdate.senha) {
          delete dataToUpdate.senha;
        }
        result = await updateFuncionario(funcionarioToEdit.id, dataToUpdate);
      } else {
        if (!formData.senha) {
          setError("O campo senha é obrigatório para criar um funcionário.");
          setIsSubmitting(false);
          return;
        }
        result = await createFuncionario(formData as CreateFuncionarioDto);
      }
      onSuccess(result); // Notifica o componente pai sobre o sucesso
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Este e-mail já está cadastrado. Por favor, utilize outro.");
      } else {
        const apiError = err.response?.data?.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} funcionário.`;
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
            {/* Título e descrição dinâmicos */}
            <DialogTitle>{isEditMode ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Altere os dados do membro da equipe abaixo.' : 'Preencha os dados abaixo para cadastrar um novo membro na equipe.'}
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
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">E-mail</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senha" className="text-right">Senha</Label>
              <Input id="senha" name="senha" type="password" value={formData.senha} onChange={handleChange} className="col-span-3" placeholder={isEditMode ? 'Deixe em branco para não alterar' : ''} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cargo" className="text-right">Cargo</Label>
              <Select onValueChange={handleSelectChange} value={formData.cargo}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS_DISPONIVEIS.map(cargo => (
                    <SelectItem key={cargo} value={cargo}>
                      {CARGO_LABELS[cargo] || cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">Telefone</Label>
              <Input id="telefone" name="telefone" value={formData.telefone || ''} onChange={handleChange} className="col-span-3" placeholder="(11) 99999-9999" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endereco" className="text-right">Endereço</Label>
              <Input id="endereco" name="endereco" value={formData.endereco || ''} onChange={handleChange} className="col-span-3" placeholder="Rua, número, bairro" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fotoUrl" className="text-right">Foto URL</Label>
              <Input id="fotoUrl" name="fotoUrl" value={formData.fotoUrl || ''} onChange={handleChange} className="col-span-3" placeholder="https://exemplo.com/foto.jpg" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}