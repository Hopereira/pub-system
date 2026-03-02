'use client';

import { useState } from 'react';
import { X, Banknote, CreditCard, Smartphone, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  VALE_REFEICAO = 'VALE_REFEICAO',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
}

const formasPagamento = [
  { value: FormaPagamento.DINHEIRO, label: 'Dinheiro', icon: Banknote, color: 'text-green-600' },
  { value: FormaPagamento.PIX, label: 'PIX', icon: Smartphone, color: 'text-cyan-600' },
  { value: FormaPagamento.DEBITO, label: 'Débito', icon: CreditCard, color: 'text-blue-600' },
  { value: FormaPagamento.CREDITO, label: 'Crédito', icon: CreditCard, color: 'text-purple-600' },
  { value: FormaPagamento.VALE_REFEICAO, label: 'Vale Refeição', icon: Receipt, color: 'text-orange-600' },
  { value: FormaPagamento.VALE_ALIMENTACAO, label: 'Vale Alimentação', icon: Receipt, color: 'text-amber-600' },
];

interface PagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formaPagamento: FormaPagamento, valorPago?: number, observacao?: string) => Promise<void>;
  comandaId: string;
  total: number;
}

export function PagamentoModal({ isOpen, onClose, comandaId, total, onConfirm }: PagamentoModalProps) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(FormaPagamento.DINHEIRO);
  const [valorPago, setValorPago] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const troco = formaPagamento === FormaPagamento.DINHEIRO && valorPago 
    ? Math.max(0, parseFloat(valorPago) - total)
    : 0;

  const handleSubmit = async () => {
    // Validação
    if (formaPagamento === FormaPagamento.DINHEIRO) {
      const valor = parseFloat(valorPago);
      if (!valorPago || isNaN(valor) || valor < total) {
        toast.error('Valor pago deve ser maior ou igual ao total da comanda');
        return;
      }
    }

    setLoading(true);
    try {
      await onConfirm(
        formaPagamento,
        formaPagamento === FormaPagamento.DINHEIRO ? parseFloat(valorPago) : undefined,
        observacao || undefined
      );
      
      toast.success('Comanda fechada com sucesso!', {
        description: formaPagamento === FormaPagamento.DINHEIRO && troco > 0 
          ? `Troco: R$ ${troco.toFixed(2)}`
          : undefined,
      });
      
      onClose();
    } catch (error: any) {
      // O erro já é tratado pelo componente pai (page.tsx) que mostra a mensagem específica do backend
      // Não exibimos toast duplicado aqui
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirmar Pagamento</h2>
            <p className="mt-1 text-sm text-gray-500">Comanda #{comandaId.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total */}
        <div className="mb-6 rounded-lg bg-primary/10 p-4">
          <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
          <p className="text-3xl font-bold text-primary">R$ {total.toFixed(2)}</p>
        </div>

        {/* Forma de Pagamento */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium text-gray-700">
            Forma de Pagamento
          </Label>
          <RadioGroup value={formaPagamento} onValueChange={(value) => setFormaPagamento(value as FormaPagamento)}>
            <div className="grid grid-cols-2 gap-3">
              {formasPagamento.map((forma) => {
                const Icon = forma.icon;
                return (
                  <label
                    key={forma.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                      formaPagamento === forma.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value={forma.value} className="sr-only" />
                    <Icon className={`h-5 w-5 ${formaPagamento === forma.value ? 'text-primary' : forma.color}`} />
                    <span className={`text-sm font-medium ${formaPagamento === forma.value ? 'text-primary' : 'text-gray-700'}`}>
                      {forma.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        {/* Valor Pago (apenas para DINHEIRO) */}
        {formaPagamento === FormaPagamento.DINHEIRO && (
          <div className="mb-6">
            <Label htmlFor="valorPago" className="mb-2 block text-sm font-medium text-gray-700">
              Valor Pago *
            </Label>
            <Input
              id="valorPago"
              type="number"
              step="0.01"
              min={total}
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              placeholder={`Mínimo: R$ ${total.toFixed(2)}`}
              className="text-lg"
              disabled={loading}
            />
            {troco > 0 && (
              <div className="mt-2 rounded-lg bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900">
                  Troco: <span className="text-lg font-bold">R$ {troco.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Observação */}
        <div className="mb-6">
          <Label htmlFor="observacao" className="mb-2 block text-sm font-medium text-gray-700">
            Observações (opcional)
          </Label>
          <Textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Cliente solicitou nota fiscal..."
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
