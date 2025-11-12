'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface AberturaCaixaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (valorInicial: number, observacao?: string) => Promise<void>;
  funcionarioNome: string;
}

export function AberturaCaixaModal({ 
  open, 
  onClose, 
  onConfirm,
  funcionarioNome 
}: AberturaCaixaModalProps) {
  const [valorInicial, setValorInicial] = useState<string>('0.00');
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const valor = parseFloat(valorInicial.replace(',', '.'));
    
    if (isNaN(valor) || valor < 0) {
      toast.error('Digite um valor válido');
      return;
    }

    try {
      setLoading(true);
      await onConfirm(valor, observacao || undefined);
      toast.success('Caixa aberto com sucesso!');
      setValorInicial('0.00');
      setObservacao('');
      onClose();
    } catch (error) {
      toast.error('Erro ao abrir caixa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numero = parseFloat(value.replace(',', '.'));
    if (isNaN(numero)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numero);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Abertura de Caixa
          </DialogTitle>
          <DialogDescription>
            Operador: <strong>{funcionarioNome}</strong>
            <br />
            Informe o valor inicial em dinheiro do caixa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Valor Inicial */}
          <div className="space-y-2">
            <Label htmlFor="valorInicial">
              Valor Inicial em Dinheiro <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="valorInicial"
                type="text"
                placeholder="0.00"
                value={valorInicial}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValorInicial(value);
                }}
                className="pl-10 text-lg font-semibold"
                autoFocus
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Valor formatado: {formatCurrency(valorInicial)}
            </p>
          </div>

          {/* Valores Sugeridos */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValorInicial('50.00')}
            >
              R$ 50,00
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValorInicial('100.00')}
            >
              R$ 100,00
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValorInicial('200.00')}
            >
              R$ 200,00
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValorInicial('500.00')}
            >
              R$ 500,00
            </Button>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Ex: Troco extra para o final de semana"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Abrindo...' : 'Abrir Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
