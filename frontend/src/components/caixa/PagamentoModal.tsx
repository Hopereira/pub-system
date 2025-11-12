'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Banknote, CreditCard, Smartphone, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { FormaPagamento } from '@/types/caixa';

interface PagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmar: (formaPagamento: FormaPagamento) => Promise<void>;
}

const formasPagamento = [
  { value: FormaPagamento.DINHEIRO, label: 'Dinheiro', icon: Banknote },
  { value: FormaPagamento.PIX, label: 'PIX', icon: Smartphone },
  { value: FormaPagamento.DEBITO, label: 'Débito', icon: CreditCard },
  { value: FormaPagamento.CREDITO, label: 'Crédito', icon: CreditCard },
  { value: FormaPagamento.VALE_REFEICAO, label: 'Vale Refeição', icon: Receipt },
  { value: FormaPagamento.VALE_ALIMENTACAO, label: 'Vale Alimentação', icon: Receipt },
];

export function PagamentoModal({ isOpen, onClose, total, onConfirmar }: PagamentoModalProps) {
  const [formaSelecionada, setFormaSelecionada] = useState<FormaPagamento | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleConfirmar = async () => {
    if (!formaSelecionada) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    setLoading(true);
    try {
      await onConfirmar(formaSelecionada);
      onClose();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormaSelecionada(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">💳 Processar Pagamento</DialogTitle>
          <DialogDescription>
            Selecione a forma de pagamento para fechar a comanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total a Pagar */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
            <p className="text-4xl font-bold text-blue-900">{formatCurrency(total)}</p>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Forma de Pagamento *</Label>
            <RadioGroup value={formaSelecionada || ''} onValueChange={(value) => setFormaSelecionada(value as FormaPagamento)}>
              <div className="grid grid-cols-2 gap-3">
                {formasPagamento.map((forma) => {
                  const Icon = forma.icon;
                  const isSelected = formaSelecionada === forma.value;
                  
                  return (
                    <div key={forma.value} className="relative">
                      <RadioGroupItem
                        value={forma.value}
                        id={forma.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={forma.value}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                          {forma.label}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={loading || !formaSelecionada}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
