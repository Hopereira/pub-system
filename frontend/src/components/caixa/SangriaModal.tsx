'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SangriaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (valor: number, motivo: string, observacao?: string) => Promise<void>;
  saldoAtual: number;
  funcionarioNome: string;
}

const MOTIVOS_SANGRIA = [
  { value: 'deposito_cofre', label: 'Depositar em cofre' },
  { value: 'troca_valores', label: 'Troca de valores' },
  { value: 'pagamento_fornecedor', label: 'Pagamento a fornecedor' },
  { value: 'seguranca', label: 'Segurança - caixa muito cheio' },
  { value: 'outro', label: 'Outro motivo' },
];

export function SangriaModal({ 
  open, 
  onClose, 
  onConfirm,
  saldoAtual,
  funcionarioNome
}: SangriaModalProps) {
  const [valor, setValor] = useState<string>('');
  const [motivoSelecionado, setMotivoSelecionado] = useState('deposito_cofre');
  const [motivoOutro, setMotivoOutro] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
  const requerAutorizacao = valorNumerico > 500;

  const handleConfirm = async () => {
    if (!valor || valorNumerico <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (valorNumerico > saldoAtual) {
      toast.error('Valor da sangria maior que o saldo disponível');
      return;
    }

    if (motivoSelecionado === 'outro' && !motivoOutro.trim()) {
      toast.error('Descreva o motivo da sangria');
      return;
    }

    if (requerAutorizacao) {
      toast.warning('Sangria acima de R$ 500,00 registrada. Aguarde autorização do gerente.');
    }

    try {
      setLoading(true);
      const motivoFinal = motivoSelecionado === 'outro' ? motivoOutro : 
        MOTIVOS_SANGRIA.find(m => m.value === motivoSelecionado)?.label || '';
      
      await onConfirm(valorNumerico, motivoFinal, observacao || undefined);
      toast.success('Sangria registrada com sucesso!');
      
      // Limpar form
      setValor('');
      setMotivoSelecionado('deposito_cofre');
      setMotivoOutro('');
      setObservacao('');
      onClose();
    } catch (error) {
      toast.error('Erro ao registrar sangria');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const saldoAposSangria = saldoAtual - valorNumerico;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Registrar Sangria
          </DialogTitle>
          <DialogDescription>
            Operador: <strong>{funcionarioNome}</strong>
            <br />
            Saldo atual em caixa: <strong className="text-green-600">{formatCurrency(saldoAtual)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Valor da Sangria */}
          <div className="space-y-2">
            <Label htmlFor="valor">
              Valor da Sangria <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="valor"
                type="text"
                placeholder="0.00"
                value={valor}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValor(value);
                }}
                className="pl-10 text-lg font-semibold"
                autoFocus
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Valor formatado: {formatCurrency(valorNumerico)}
              </span>
              {valorNumerico > 0 && (
                <span className={saldoAposSangria < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                  Saldo após: {formatCurrency(saldoAposSangria)}
                </span>
              )}
            </div>
          </div>

          {/* Valores Sugeridos */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValor('100.00')}
            >
              R$ 100
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValor('200.00')}
            >
              R$ 200
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValor('500.00')}
            >
              R$ 500
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValor('1000.00')}
            >
              R$ 1.000
            </Button>
          </div>

          {/* Alerta se valor alto */}
          {requerAutorizacao && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-300">
                <strong>Atenção:</strong> Sangria acima de R$ 500,00 requer autorização de gerente.
                A operação será registrada e aguardará confirmação.
              </div>
            </div>
          )}

          {/* Motivo da Sangria */}
          <div className="space-y-3">
            <Label>
              Motivo da Sangria <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={motivoSelecionado} onValueChange={setMotivoSelecionado}>
              {MOTIVOS_SANGRIA.map((motivo) => (
                <div key={motivo.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={motivo.value} id={motivo.value} />
                  <Label htmlFor={motivo.value} className="font-normal cursor-pointer">
                    {motivo.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Campo adicional se "Outro" */}
            {motivoSelecionado === 'outro' && (
              <Input
                placeholder="Descreva o motivo..."
                value={motivoOutro}
                onChange={(e) => setMotivoOutro(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Observação Adicional */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação Adicional (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Detalhes adicionais sobre a sangria..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Resumo */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Saldo atual:</span>
              <span className="font-semibold">{formatCurrency(saldoAtual)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Valor da sangria:</span>
              <span className="font-semibold text-red-600">- {formatCurrency(valorNumerico)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-bold">Saldo após sangria:</span>
              <span className={`font-bold ${saldoAposSangria < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(saldoAposSangria)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || valorNumerico <= 0 || saldoAposSangria < 0}
            variant={requerAutorizacao ? 'default' : 'default'}
          >
            {loading ? 'Registrando...' : requerAutorizacao ? 'Registrar (Requer Autorização)' : 'Registrar Sangria'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
