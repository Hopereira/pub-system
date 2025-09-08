// Caminho: frontend/src/components/mesas/MesaFormDialog.tsx

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Mesa } from '@/types/mesa';
import { CreateMesaDto, UpdateMesaDto } from '@/types/mesa.dto';
import { createMesa, updateMesa } from '@/services/mesaService';
import { getAmbientes, AmbienteData } from '@/services/ambienteService';

interface MesaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (mesa: Mesa) => void;
  mesaToEdit?: Mesa | null; // NOVO: Prop para receber a mesa a ser editada
}

const initialFormData = { numero: '' as number | '', ambienteId: '' };

export default function MesaFormDialog({ open, onOpenChange, onSuccess, mesaToEdit }: MesaFormDialogProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!mesaToEdit;

  // Efeito para buscar os ambientes e preencher o formulário
  useEffect(() => {
    if (open) {
      setError(null);
      const fetchAmbientes = async () => {
        try {
          const data = await getAmbientes();
          setAmbientes(data);
        } catch (error) {
          setError("Não foi possível carregar os ambientes.");
        }
      };
      fetchAmbientes();

      if (isEditMode) {
        setFormData({ numero: mesaToEdit.numero, ambienteId: mesaToEdit.ambiente.id });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, isEditMode, mesaToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero || !formData.ambienteId) {
        setError("Todos os campos são obrigatórios.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: Mesa;
      if (isEditMode && mesaToEdit) {
        const dataToUpdate: UpdateMesaDto = {
            numero: Number(formData.numero),
            ambienteId: formData.ambienteId
        };
        result = await updateMesa(mesaToEdit.id, dataToUpdate);
      } else {
        const dataToCreate: CreateMesaDto = {
            numero: Number(formData.numero),
            ambienteId: formData.ambienteId
        };
        result = await createMesa(dataToCreate);
      }
      onSuccess(result);
    } catch (err: any) {
      const apiError = err.response?.data?.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} a mesa.`;
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
            <DialogTitle>{isEditMode ? 'Editar Mesa' : 'Adicionar Nova Mesa'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Altere os dados da mesa abaixo.' : 'Defina o número da mesa e o ambiente onde ela se localiza.'}
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
              <Label htmlFor="numero" className="text-right">Número</Label>
              <Input 
                id="numero" 
                type="number"
                value={formData.numero} 
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value === '' ? '' : Number(e.target.value) }))} 
                className="col-span-3" required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ambiente" className="text-right">Ambiente</Label>
              <Select onValueChange={(value) => setFormData(prev => ({...prev, ambienteId: value}))} value={formData.ambienteId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um ambiente" />
                </SelectTrigger>
                <SelectContent>
                  {ambientes.length > 0 ? (
                    ambientes.map(ambiente => <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem>)
                  ) : (
                    <SelectItem value="loading" disabled>Carregando ambientes...</SelectItem>
                  )}
                </SelectContent>
              </Select>
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